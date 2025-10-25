<?php

namespace App\Http\Controllers\API\V1;

use App\Events\MessageSent;
use App\Events\MessagesRead;
use App\Http\Controllers\Controller;
use App\Http\Requests\SendMessageRequest;
use App\Http\Requests\UpdateMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function __construct(private NotificationService $notificationService)
    {
    }

    /**
     * Send a new message in a conversation.
     */
    public function store(SendMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

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

        // ========== BATCH READ EVENT ==========
        // User chat ga kirib xabar yozganda barcha o'qilmagan xabarlarni read qilish
        $unreadMessages = Message::unreadForUser($conversation->id, $user->id)->get();
        
        if ($unreadMessages->isNotEmpty()) {
            // Barcha unread message ID larini olamiz
            $messageIds = $unreadMessages->pluck('id')->toArray();
            
            // Database da barcha xabarlarni read qilamiz (bir query bilan)
            Message::whereIn('id', $messageIds)->update(['read_at' => now()]);
            
            // Bitta batch event yuboramiz (bir marta broadcast)
            // toOthers() - o'zi uchun yuborilmaydi
            broadcast(new MessagesRead(
                $messageIds,
                $conversation->id,
                $user->id
            ))->toOthers();
        }
        // ========================================

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

        // Send notification to other participant
        $otherParticipant = $conversation->getOtherParticipant($user->id);
        if ($otherParticipant) {
            $this->notificationService->sendNewMessageNotification(
                $otherParticipant->id,
                [
                    'sender_id' => $user->id,
                    'sender_name' => $user->name,
                    'conversation_id' => $conversation->id,
                    'message_id' => $message->id,
                    'message_preview' => $message->content ? \Str::limit($message->content, 50) : 'Sent a file',
                ]
            );
        }

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
        if ($message->user_id !== $user->id && !$message->isRead()) {
            // markAsRead avtomatik broadcast qiladi
            $message->markAsRead($user->id);
        }

        return response()->json([
            'message' => 'Message marked as read',
            'data' => new MessageResource($message),
        ]);
    }

    /**
     * Update a message (only within 24 hours).
     */
    public function update(UpdateMessageRequest $request, Message $message): JsonResponse
    {
        $user = $request->user();
        $conversation = $message->conversation;

        // Check authorization: user must be the sender or admin
        if (! $user->is_admin && $message->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized to update this message',
            ], 403);
        }

        // Check if message was created within 24 hours
        if ($message->created_at->diffInHours(now()) > 24) {
            return response()->json([
                'message' => 'Messages can only be edited within 24 hours of creation',
            ], 403);
        }

        // Update the message content
        $validated = $request->validated();
        $message->update([
            'content' => $validated['content'],
        ]);

        // Load relationships
        $message->load('user', 'replyTo.user');

        return response()->json([
            'message' => 'Message updated successfully',
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