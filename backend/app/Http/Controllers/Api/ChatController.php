<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\Conversation;
use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * List contacts available for chat with presence and unread counts.
     */
    public function contacts(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $isDelegate = in_array($currentUser->role, ['commercial', 'delegate']);

        $query = User::where('id', '!=', $currentUser->id)
            ->where('is_active', true);

        // All active users are discoverable so teammates can communicate across all roles
        $users = $query->orderBy('name')->get();

        $contacts = $users->map(function ($u) use ($currentUser) {
            // Find existing conversation between currentUser and $u
            $conversation = Conversation::where(function ($q) use ($currentUser, $u) {
                $q->where('staff_id', $currentUser->id)->where('delegate_id', $u->id);
            })->orWhere(function ($q) use ($currentUser, $u) {
                $q->where('staff_id', $u->id)->where('delegate_id', $currentUser->id);
            })->first();

            $unreadCount = 0;
            $latestMessage = null;

            if ($conversation) {
                $unreadCount = ChatMessage::where('conversation_id', $conversation->id)
                    ->where('sender_id', $u->id)
                    ->where('is_read', false)
                    ->count();

                $latest = $conversation->latestMessage;
                if ($latest) {
                    $latestMessage = [
                        'id' => $latest->id,
                        'body' => $latest->body,
                        'sender_id' => $latest->sender_id,
                        'is_read' => $latest->is_read,
                        'read_at' => $latest->read_at?->toISOString(),
                        'created_at' => $latest->created_at?->toISOString(),
                    ];
                }
            }

            return [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'phone' => $u->phone,
                'role' => $u->role,
                'department' => $u->department,
                'region' => $u->region,
                'wilaya' => $u->wilaya,
                'is_online' => $u->isOnline(),
                'last_seen_at' => $u->last_seen_at?->toISOString(),
                'conversation_id' => $conversation?->id,
                'unread_count' => $unreadCount,
                'latest_message' => $latestMessage,
            ];
        });

        // Sort contacts: first by those with recent messages, then alphabetically
        $sorted = $contacts->sort(function ($a, $b) {
            $timeA = $a['latest_message']['created_at'] ?? null;
            $timeB = $b['latest_message']['created_at'] ?? null;

            if ($timeA && $timeB) {
                return strcmp($timeB, $timeA);
            }
            if ($timeA) return -1;
            if ($timeB) return 1;

            return strcasecmp($a['name'], $b['name']);
        })->values();

        return response()->json([
            'contacts' => $sorted,
            'total_unread' => $contacts->sum('unread_count'),
        ]);
    }

    /**
     * List user's active conversations.
     */
    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $conversations = Conversation::where('staff_id', $userId)
            ->orWhere('delegate_id', $userId)
            ->with(['staff', 'delegate', 'latestMessage'])
            ->orderByDesc('last_message_at')
            ->get();

        $data = $conversations->map(function ($conv) use ($userId) {
            $partner = $conv->getPartner($userId);
            $unreadCount = $conv->unreadCountForUser($userId);
            $latest = $conv->latestMessage;

            return [
                'id' => $conv->id,
                'partner' => [
                    'id' => $partner?->id,
                    'name' => $partner?->name ?? 'Utilisateur',
                    'role' => $partner?->role,
                    'is_online' => $partner ? $partner->isOnline() : false,
                    'last_seen_at' => $partner?->last_seen_at?->toISOString(),
                ],
                'unread_count' => $unreadCount,
                'last_message' => $latest ? [
                    'id' => $latest->id,
                    'body' => $latest->body,
                    'sender_id' => $latest->sender_id,
                    'is_read' => $latest->is_read,
                    'read_at' => $latest->read_at?->toISOString(),
                    'created_at' => $latest->created_at?->toISOString(),
                ] : null,
                'last_message_at' => $conv->last_message_at?->toISOString(),
            ];
        });

        return response()->json(['conversations' => $data]);
    }

    /**
     * Get or create a direct conversation with another user.
     */
    public function directConversation(Request $request, int $userId): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser->id === $userId) {
            return response()->json(['error' => 'Cannot create conversation with yourself'], 422);
        }

        $recipient = User::findOrFail($userId);

        // Determine staff_id and delegate_id roles cleanly
        $isCurrentDelegate = in_array($currentUser->role, ['commercial', 'delegate']);
        $isRecipientDelegate = in_array($recipient->role, ['commercial', 'delegate']);

        if ($isCurrentDelegate && !$isRecipientDelegate) {
            $staffId = $recipient->id;
            $delegateId = $currentUser->id;
        } elseif (!$isCurrentDelegate && $isRecipientDelegate) {
            $staffId = $currentUser->id;
            $delegateId = $recipient->id;
        } else {
            // Both are staff or both are delegates: order by ID
            $staffId = min($currentUser->id, $recipient->id);
            $delegateId = max($currentUser->id, $recipient->id);
        }

        $conversation = Conversation::firstOrCreate(
            ['staff_id' => $staffId, 'delegate_id' => $delegateId],
            ['last_message_at' => now()]
        );

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'partner' => [
                    'id' => $recipient->id,
                    'name' => $recipient->name,
                    'role' => $recipient->role,
                    'is_online' => $recipient->isOnline(),
                    'last_seen_at' => $recipient->last_seen_at?->toISOString(),
                ],
                'last_message_at' => $conversation->last_message_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Get messages for a conversation.
     */
    public function messages(Request $request, int $conversationId): JsonResponse
    {
        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        // Security check: must be a participant or admin
        if ($conversation->staff_id !== $user->id && $conversation->delegate_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $messages = ChatMessage::where('conversation_id', $conversationId)
            ->with('sender:id,name,role')
            ->orderBy('created_at', 'asc')
            ->limit(200)
            ->get();

        $formatted = $messages->map(function ($msg) {
            return [
                'id' => $msg->id,
                'conversation_id' => $msg->conversation_id,
                'sender_id' => $msg->sender_id,
                'body' => $msg->body,
                'attachment_url' => $msg->attachment_url,
                'attachment_type' => $msg->attachment_type,
                'is_read' => (bool) $msg->is_read,
                'read_at' => $msg->read_at?->toISOString(),
                'delivered_at' => $msg->delivered_at?->toISOString(),
                'created_at' => $msg->created_at?->toISOString(),
                'sender' => [
                    'id' => $msg->sender?->id,
                    'name' => $msg->sender?->name,
                    'role' => $msg->sender?->role,
                ],
            ];
        });

        return response()->json(['messages' => $formatted]);
    }

    /**
     * Send a new message.
     */
    public function sendMessage(Request $request, int $conversationId): JsonResponse
    {
        $request->validate([
            'body' => 'required|string|max:5000',
            'attachment_url' => 'nullable|string|url|max:1000',
            'attachment_type' => 'nullable|string|max:50',
        ]);

        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->staff_id !== $user->id && $conversation->delegate_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $partner = $conversation->getPartner($user->id);

        $message = ChatMessage::create([
            'conversation_id' => $conversationId,
            'sender_id' => $user->id,
            'body' => trim($request->input('body')),
            'attachment_url' => $request->input('attachment_url'),
            'attachment_type' => $request->input('attachment_type'),
            'is_read' => false,
            'delivered_at' => now(),
        ]);

        $conversation->update(['last_message_at' => now()]);

        $messageData = [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'body' => $message->body,
            'attachment_url' => $message->attachment_url,
            'attachment_type' => $message->attachment_type,
            'is_read' => false,
            'read_at' => null,
            'delivered_at' => $message->delivered_at?->toISOString(),
            'created_at' => $message->created_at->toISOString(),
            'sender' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ],
        ];

        // Broadcast to WebSocket hub
        try {
            Http::timeout(2)->post('http://127.0.0.1:8085/broadcast', [
                'type' => 'CHAT_MESSAGE_SENT',
                'conversation_id' => $conversation->id,
                'recipient_id' => $partner?->id,
                'message' => $messageData,
            ]);
        } catch (\Throwable $e) {
            Log::warning('WebSocket chat broadcast error: ' . $e->getMessage());
        }

        // Dispatch FCM Push Notification to recipient
        if ($partner && !empty($partner->fcm_token)) {
            try {
                $firebaseService = app(FirebaseService::class);
                $firebaseService->sendPush(
                    $partner->fcm_token,
                    $user->name,
                    $message->body,
                    [
                        'type' => 'chat_message',
                        'conversation_id' => (string) $conversation->id,
                        'sender_id' => (string) $user->id,
                        'sender_name' => (string) $user->name,
                        'sender_role' => (string) ($user->role ?? ''),
                        'sender_avatar' => (string) ($user->avatar_url ?? ''),
                        'message_id' => (string) $message->id,
                        'message_body' => (string) $message->body,
                        'created_at' => $message->created_at->toISOString(),
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning('FCM chat push dispatch error: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => $messageData], 201);
    }

    /**
     * Mark all unread messages in conversation as read (viewed).
     */
    public function markAsRead(Request $request, int $conversationId): JsonResponse
    {
        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        if ((int) $conversation->staff_id !== (int) $user->id && (int) $conversation->delegate_id !== (int) $user->id && !$user->isAdmin()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $now = now();

        $unreadIds = ChatMessage::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->pluck('id')
            ->toArray();

        if (!empty($unreadIds)) {
            ChatMessage::whereIn('id', $unreadIds)->update([
                'is_read' => true,
                'read_at' => $now,
            ]);

            $partner = $conversation->getPartner($user->id);

            // Broadcast viewed status to WebSocket hub
            try {
                Http::timeout(2)->post('http://127.0.0.1:8085/broadcast', [
                    'type' => 'CHAT_MESSAGES_VIEWED',
                    'conversation_id' => $conversation->id,
                    'reader_id' => $user->id,
                    'recipient_id' => $partner?->id,
                    'read_at' => $now->toISOString(),
                    'message_ids' => $unreadIds,
                ]);
            } catch (\Throwable $e) {
                Log::warning('WebSocket chat viewed broadcast error: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'viewed_count' => count($unreadIds),
            'read_at' => $now->toISOString(),
            'message_ids' => $unreadIds,
        ]);
    }

    /**
     * Presence ping for active user (Staff & Delegates).
     */
    public function pingPresence(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update([
            'last_seen_at' => now(),
            'status' => 'online',
        ]);

        try {
            Http::timeout(2)->post('http://127.0.0.1:8085/broadcast', [
                'type' => 'USER_STATUS_CHANGED',
                'user' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'status' => 'online',
                    'isOnline' => true,
                    'last_seen_at' => $user->last_seen_at->toISOString(),
                ],
            ]);
        } catch (\Throwable $e) {
            // non-blocking
        }

        return response()->json([
            'status' => 'online',
            'last_seen_at' => $user->last_seen_at->toISOString(),
        ]);
    }
}
