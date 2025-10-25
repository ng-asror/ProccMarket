<?php

namespace App\Http\Controllers\API\V1;

use App\Events\MessagesRead;
use App\Http\Controllers\Controller;
use App\Http\Requests\StartConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ConversationController extends Controller
{
    public function __construct(private NotificationService $notificationService)
    {
    }

    /**
     * Display a listing of conversations for the authenticated user.
     * Admins can see all conversations.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = Conversation::with(['userOne', 'userTwo', 'latestMessage.user'])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc');

        // If not admin, only show user's conversations
        if (! $user->is_admin) {
            $query->forUser($user->id);
        }

        $conversations = $query->paginate(20);

        // Add unread count for each conversation
        $conversations->getCollection()->transform(function ($conversation) use ($user) {
            $conversation->unread_count = Message::where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $user->id)
                ->whereNull('read_at')
                ->count();
            return $conversation;
        });

        return ConversationResource::collection($conversations);
    }

    /**
     * Store a newly created conversation or return existing one.
     */
    public function store(StartConversationRequest $request): JsonResponse
    {
        $user = $request->user();
        $otherUserId = $request->validated()['user_id'];

        $conversation = Conversation::findOrCreateBetween(
            $user->id,
            $otherUserId
        );

        $conversation->load(['userOne', 'userTwo', 'latestMessage.user']);

        // Check if this is a new conversation
        $isNewConversation = $conversation->wasRecentlyCreated;

        // Send notification to other user if it's a new conversation
        if ($isNewConversation) {
            $this->notificationService->sendNewConversationNotification(
                $otherUserId,
                [
                    'initiator_id' => $user->id,
                    'initiator_name' => $user->name,
                    'conversation_id' => $conversation->id,
                ]
            );
        }

        return response()->json([
            'message' => $isNewConversation ? 'Conversation created successfully' : 'Conversation already exists',
            'data' => new ConversationResource($conversation),
        ], $isNewConversation ? 201 : 200);
    }

    /**
     * Display the specified conversation with messages.
     */
    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Check authorization: user must be a participant or admin
        if (! $user->is_admin && ! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'message' => 'Unauthorized to view this conversation',
            ], 403);
        }

        $sort = $request->query('sort', 'asc');

        if ($sort !== 'asc' && $sort !== 'desc') {
            return response()->json([
                'message' => 'Invalid sort parameter',
            ], 400);
        }

        $conversation->load(['userOne', 'userTwo', 'latestMessage.user']);

        // Get messages with pagination
        $messages = Message::query()
            ->where('conversation_id', $conversation->id)
            ->with(['user', 'replyTo.user'])
            ->orderBy('created_at', $sort)
            ->paginate(50);

        // ========== BATCH READ EVENT ==========
        // Mark unread messages as read and broadcast event
        if (! $user->is_admin && $conversation->hasParticipant($user->id)) {
            $unreadMessages = Message::unreadForUser($conversation->id, $user->id)->get();
            
            if ($unreadMessages->isNotEmpty()) {
                // Barcha unread message ID larini olamiz
                $messageIds = $unreadMessages->pluck('id')->toArray();
                
                // Database da barcha xabarlarni read qilamiz (bir query bilan)
                Message::whereIn('id', $messageIds)->update(['read_at' => now()]);
                
                // Bitta batch event yuboramiz
                broadcast(new MessagesRead(
                    $messageIds,
                    $conversation->id,
                    $user->id
                ))->toOthers();
            }
        }
        // ========================================

        return response()->json([
            'conversation' => new ConversationResource($conversation),
            'messages' => MessageResource::collection($messages),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Remove the specified conversation (soft delete).
     */
    public function destroy(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Only participants or admins can delete conversations
        if (! $user->is_admin && ! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'message' => 'Unauthorized to delete this conversation',
            ], 403);
        }

        $conversation->delete();

        return response()->json([
            'message' => 'Conversation deleted successfully',
        ]);
    }

    public function verifyAccess(Conversation $conversation)
    {
        $user = auth()->user();
        
        if ($user->is_admin) {
            return response()->json(['hasAccess' => true]);
        }
        
        $hasAccess = $conversation->hasParticipant($user->id);
        
        return response()->json(['hasAccess' => $hasAccess]);
    }
}