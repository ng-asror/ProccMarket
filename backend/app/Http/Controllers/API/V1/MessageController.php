<?php

namespace App\Http\Controllers\API\V1;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\SendMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Send a new message in a conversation.
     */
    public function store(SendMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Check authorization: user must be a participant or admin
        if (! $user->is_admin && ! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'message' => 'Unauthorized to send messages in this conversation',
            ], 403);
        }

        $validated = $request->validated();

        // Handle file upload
        $filePath = null;
        $fileName = null;
        $fileType = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('chat-files', 'public');
            $fileName = $file->getClientOriginalName();
            $fileType = $file->getMimeType();
            $fileSize = $file->getSize();
        }

        // Create the message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'content' => $validated['content'] ?? null,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_type' => $fileType,
            'file_size' => $fileSize,
            'reply_to_message_id' => $validated['reply_to_message_id'] ?? null,
        ]);

        // Update conversation's last_message_at
        $conversation->update(['last_message_at' => now()]);

        // Load relationships
        $message->load('user', 'replyTo.user');

        // Broadcast the message via WebSocket
        broadcast(new MessageSent($message));

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => new MessageResource($message),
        ], 201);
    }

    /**
     * Display the specified message.
     */
    public function show(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();
        $conversation = $message->conversation;

        // Check authorization: user must be a participant or admin
        if (! $user->is_admin && ! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'message' => 'Unauthorized to view this message',
            ], 403);
        }

        $message->load('user', 'replyTo.user');

        return response()->json([
            'data' => new MessageResource($message),
        ]);
    }

    /**
     * Mark a message as read.
     */
    public function markAsRead(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();
        $conversation = $message->conversation;

        // Check authorization: user must be a participant (not the sender) or admin
        if (! $user->is_admin && ! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'message' => 'Unauthorized to mark this message as read',
            ], 403);
        }

        // Only mark as read if the user is not the sender
        if ($message->user_id !== $user->id) {
            $message->markAsRead();
        }

        return response()->json([
            'message' => 'Message marked as read',
            'data' => new MessageResource($message),
        ]);
    }

    /**
     * Delete a message.
     */
    public function destroy(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();
        $conversation = $message->conversation;

        // Check authorization: user must be the sender or admin
        if (! $user->is_admin && $message->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized to delete this message',
            ], 403);
        }

        // Delete file if exists
        if ($message->file_path) {
            Storage::disk('public')->delete($message->file_path);
        }

        $message->delete();

        return response()->json([
            'message' => 'Message deleted successfully',
        ]);
    }
}
