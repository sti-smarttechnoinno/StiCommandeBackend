<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::query();

        if ($search = $request->input('search')) {
            $q = strtolower($search);
            $query->where(function ($query) use ($q) {
                $query->whereRaw('LOWER(title) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(description) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(reference_id) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(user) LIKE ?', ["%{$q}%"]);
            });
        }

        if ($categories = $request->input('category')) {
            $catArray = (array) $categories;
            if (!in_array('all', $catArray)) {
                $query->whereIn('category', $catArray);
            }
        }

        if ($priorities = $request->input('priority')) {
            $priArray = (array) $priorities;
            if (!in_array('all', $priArray)) {
                $query->whereIn('priority', $priArray);
            }
        }

        if ($statuses = $request->input('status')) {
            $statArray = (array) $statuses;
            if (!in_array('all', $statArray)) {
                $query->whereIn('status', $statArray);
            }
        }

        if ($regions = $request->input('region')) {
            $regArray = (array) $regions;
            if (!in_array('all', $regArray)) {
                $query->whereIn('region', $regArray);
            }
        }

        if ($startDate = $request->input('startDate')) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate = $request->input('endDate')) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $query->orderBy('created_at', 'desc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(100, (int) $request->input('pageSize', 20)));
        $total = (clone $query)->count();
        $items = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        $orderCodes = $items->filter(fn ($n) => ($n->category === 'orders' || strtolower($n->module ?? '') === 'orders') && !empty($n->reference_id) && !\Illuminate\Support\Str::isUuid($n->reference_id))
            ->pluck('reference_id')
            ->map(fn ($r) => preg_replace('/^[#\s]+/', '', (string) $r))
            ->unique()
            ->values();

        $orderMap = $orderCodes->isNotEmpty() ? \App\Models\Order::whereIn('order_code', $orderCodes)->pluck('id', 'order_code') : collect();

        return response()->json([
            'data' => $items->map(fn ($n) => $this->formatNotification($n, $orderMap)),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => (int) ceil($total / $pageSize),
        ]);
    }

    public function kpis(): JsonResponse
    {
        $total = Notification::count();
        $unread = Notification::where('read', false)->count();
        $critical = Notification::where('priority', 'critical')->count();
        $pendingActions = Notification::where('status', 'unread')->whereIn('priority', ['critical', 'high'])->count();

        // 7-day historical sparklines
        $sparkTotal = [];
        $sparkUnread = [];
        $sparkCritical = [];
        $sparkPending = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->endOfDay();
            $sparkTotal[] = Notification::where('created_at', '<=', $date)->count();
            $sparkUnread[] = Notification::where('read', false)->where('created_at', '<=', $date)->count();
            $sparkCritical[] = Notification::where('priority', 'critical')->where('created_at', '<=', $date)->count();
            $sparkPending[] = Notification::where('status', 'unread')->whereIn('priority', ['critical', 'high'])->where('created_at', '<=', $date)->count();
        }

        $calcTrend = function (array $spark) {
            $first = $spark[0] ?? 0;
            $last = end($spark) ?: 0;
            if ($first > 0) {
                return round((($last - $first) / $first) * 100, 1);
            }
            return $last > 0 ? 100.0 : 0.0;
        };

        return response()->json([
            'totalNotifications' => $total,
            'unreadCount' => $unread,
            'criticalAlerts' => $critical,
            'pendingActions' => $pendingActions,
            'trends' => [
                'totalNotifications' => $calcTrend($sparkTotal),
                'unreadCount' => $calcTrend($sparkUnread),
                'criticalAlerts' => $calcTrend($sparkCritical),
                'pendingActions' => $calcTrend($sparkPending),
            ],
            'sparklines' => [
                'totalNotifications' => $sparkTotal,
                'unreadCount' => $sparkUnread,
                'criticalAlerts' => $sparkCritical,
                'pendingActions' => $sparkPending,
            ],
        ]);
    }

    public function analytics(): JsonResponse
    {
        $categoryColors = [
            'orders' => '#2563EB',
            'stock' => '#22C55E',
            'delegates' => '#06B6D4',
            'clients' => '#8B5CF6',
            'reports' => '#6366F1',
            'security' => '#EF4444',
            'system' => '#6B7280',
            'finance' => '#F59E0B',
        ];

        $categoryDistribution = Notification::selectRaw('category as name, count(*) as value')
            ->groupBy('category')
            ->get()
            ->map(function ($c) use ($categoryColors) {
                $catName = ucfirst($c->name);
                return [
                    'name' => $catName,
                    'value' => (int) $c->value,
                    'color' => $categoryColors[strtolower($c->name)] ?? '#6B7280',
                ];
            });

        $activitySummary = Notification::where('created_at', '>=', now()->subDays(30))
            ->selectRaw('category as name, count(*) as value')
            ->groupBy('category')
            ->get()
            ->map(function ($c) use ($categoryColors) {
                return [
                    'name' => ucfirst($c->name),
                    'value' => (int) $c->value,
                    'color' => $categoryColors[strtolower($c->name)] ?? '#6B7280',
                ];
            });

        $statusDistribution = [
            [
                'name' => 'Read',
                'value' => Notification::where('read', true)->count(),
                'color' => '#22C55E',
            ],
            [
                'name' => 'Unread',
                'value' => Notification::where('read', false)->count(),
                'color' => '#F59E0B',
            ],
            [
                'name' => 'Archived',
                'value' => Notification::where('status', 'archived')->count(),
                'color' => '#6B7280',
            ],
            [
                'name' => 'Pending Action',
                'value' => Notification::where('status', 'unread')->whereIn('priority', ['critical', 'high'])->count(),
                'color' => '#EF4444',
            ],
        ];

        return response()->json([
            'categoryDistribution' => $categoryDistribution,
            'activitySummary' => $activitySummary,
            'statusDistribution' => $statusDistribution,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:50',
            'priority' => 'nullable|string|max:50',
            'user' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'module' => 'nullable|string|max:255',
            'reference_id' => 'nullable|string|max:255',
        ]);

        $notification = Notification::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'category' => strtolower($validated['category'] ?? 'system'),
            'priority' => strtolower($validated['priority'] ?? 'medium'),
            'status' => 'unread',
            'user' => $validated['user'] ?? 'System',
            'region' => $validated['region'] ?? 'All',
            'module' => $validated['module'] ?? 'System',
            'reference_id' => $validated['reference_id'] ?? null,
            'read' => false,
        ]);

        return response()->json([
            'data' => $this->formatNotification($notification),
            'message' => 'Notification created successfully',
        ], 201);
    }

    public function markAsRead(string $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['read' => true, 'status' => 'read']);

        return response()->json([
            'data' => $this->formatNotification($notification),
            'message' => 'Notification marked as read',
        ]);
    }

    public function markAllAsRead(): JsonResponse
    {
        Notification::where('read', false)->update(['read' => true, 'status' => 'read']);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        $action = $request->input('action');

        if (empty($ids) || !is_array($ids)) {
            return response()->json(['message' => 'No notifications selected'], 422);
        }

        if ($action === 'delete') {
            Notification::whereIn('id', $ids)->delete();
        } elseif ($action === 'read' || $action === 'mark_read') {
            Notification::whereIn('id', $ids)->update(['read' => true, 'status' => 'read']);
        } elseif ($action === 'archive') {
            Notification::whereIn('id', $ids)->update(['status' => 'archived']);
        }

        return response()->json(['message' => 'Bulk action executed successfully']);
    }

    public function announcements(): JsonResponse
    {
        $announcements = Announcement::orderBy('created_at', 'desc')->get()->map(function ($a) {
            return [
                'id' => (string) $a->id,
                'title' => $a->title,
                'description' => $a->description,
                'date' => $a->created_at->format('M d, H:i'),
                'status' => $a->status,
                'createdBy' => $a->created_by,
            ];
        });

        return response()->json(['data' => $announcements]);
    }

    public function storeAnnouncement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|max:50',
            'scheduled_at' => 'nullable|date',
        ]);

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? '',
            'status' => $validated['status'] ?? 'published',
            'scheduled_at' => $validated['scheduled_at'] ?? now(),
            'created_by' => auth()->user()?->name ?? 'Administrator',
        ]);

        // Also broadcast an internal system notification for the announcement
        Notification::create([
            'title' => 'Announcement: ' . $announcement->title,
            'description' => $announcement->description ?: $announcement->title,
            'category' => 'system',
            'priority' => 'high',
            'status' => 'unread',
            'user' => $announcement->created_by,
            'region' => 'All',
            'module' => 'Announcements',
            'reference_id' => 'ANC-' . $announcement->id,
            'read' => false,
        ]);

        return response()->json([
            'data' => [
                'id' => (string) $announcement->id,
                'title' => $announcement->title,
                'description' => $announcement->description,
                'date' => $announcement->created_at->format('M d, H:i'),
                'status' => $announcement->status,
                'createdBy' => $announcement->created_by,
            ],
            'message' => 'Announcement published successfully',
        ], 201);
    }

    public function updateFcmToken(Request $request): JsonResponse
    {
        $fcmToken = $request->input('fcm_token');
        $userId = $request->input('user_id') ?: auth()->id();
        $locale = $request->input('locale', 'fr');

        if (!$fcmToken) {
            return response()->json(['message' => 'FCM token is required'], 422);
        }

        $user = null;
        if ($userId) {
            $user = \App\Models\User::find($userId);
        }
        if (!$user && auth()->check()) {
            $user = auth()->user();
        }

        if ($user) {
            $user->fcm_token = $fcmToken;
            if ($locale) {
                $user->locale = $locale;
            }
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'FCM Token and locale registered successfully',
            'user_id' => $user?->id,
        ], 200);
    }

    public function sentBroadcasts(Request $request): JsonResponse
    {
        $totalDelegatesCount = \App\Models\User::where('role', 'delegate')->count();
        $activeDelegatesCount = \App\Models\User::where('role', 'delegate')
            ->where(function ($q) {
                $q->where('status', 'online')
                  ->orWhere('last_seen_at', '>=', now()->subDays(7));
            })->count();
        $activeDevicesCount = max(1, $activeDelegatesCount);

        // Fetch notifications representing sent broadcasts and alert dispatches
        $notifications = Notification::orderBy('created_at', 'desc')->get();

        $sentItems = $notifications->map(function ($n) use ($totalDelegatesCount, $activeDevicesCount) {
            $module = strtolower($n->module ?? '');
            $titleLower = strtolower($n->title ?? '');
            $descLower = strtolower($n->description ?? '');

            // Classify if sent to delegate or received by admin
            $isSentToDelegate = in_array($module, ['objectives', 'broadcast', 'announcements', 'push']) 
                || str_contains($titleLower, 'objectif') 
                || str_contains($titleLower, 'announcement')
                || str_contains($titleLower, 'diffusion')
                || str_contains($titleLower, 'valid')
                || str_contains($titleLower, 'livr')
                || str_contains($descLower, 'fixed enter to see');

            $direction = $isSentToDelegate ? 'sent_to_delegate' : 'received_from_system';
            $isAll = (empty($n->region) || strtolower($n->region) === 'all') && (empty($n->user) || strtolower($n->user) === 'all' || strtolower($n->user) === 'all delegates');
            
            if ($isSentToDelegate) {
                if (!empty($n->user) && strtolower($n->user) !== 'all' && strtolower($n->user) !== 'all delegates') {
                    // Specific individual delegate target
                    $targetAudience = 'Délégué: ' . $n->user . (!empty($n->region) && strtolower($n->region) !== 'all' ? " ({$n->region})" : '');
                    $targetDevices = 1;
                    $receivedDevices = 1;
                } elseif (!empty($n->region) && strtolower($n->region) !== 'all') {
                    $regionCount = \App\Models\User::where('role', 'delegate')
                        ->where(function ($q) use ($n) {
                            $q->where('region', $n->region)->orWhere('wilaya', 'LIKE', "%{$n->region}%");
                        })->count();
                    $targetAudience = 'Région: ' . $n->region;
                    $targetDevices = max(1, $regionCount);
                    $receivedDevices = max(1, min($targetDevices, $regionCount));
                } else {
                    $targetAudience = 'Tous les Délégués';
                    $targetDevices = max(1, $totalDelegatesCount);
                    $receivedDevices = max(1, min($targetDevices, $activeDevicesCount));
                }
            } else {
                $targetAudience = 'Admin (Émetteur: ' . ($n->user ?: 'Système/Client') . ')';
                $targetDevices = 1;
                $receivedDevices = 1;
            }

            $deliveryRate = round(($receivedDevices / max(1, $targetDevices)) * 100, 1);

            return [
                'id' => (string) $n->id,
                'title' => $n->title,
                'body' => $n->description ?? $n->title,
                'category' => $n->category ?? 'system',
                'priority' => $n->priority ?? 'high',
                'status' => 'delivered',
                'direction' => $direction,
                'directionLabel' => $isSentToDelegate ? 'Envoyé au Délégué' : "Reçu par l'Admin",
                'targetAudience' => $targetAudience,
                'targetType' => $isAll ? 'all' : (!empty($n->region) ? 'region' : 'delegate'),
                'targetDevices' => $targetDevices,
                'receivedDevices' => $receivedDevices,
                'deliveryRate' => $deliveryRate,
                'channels' => $isSentToDelegate ? ['FCM Push', 'In-App Toast', 'Feed'] : ['Dashboard Alert', 'Feed'],
                'sender' => $n->user ?: 'Système STI',
                'referenceId' => $n->reference_id ?: ('NOTIF-' . str_pad($n->id, 5, '0', STR_PAD_LEFT)),
                'createdAt' => $n->created_at->toISOString(),
                'dateFormatted' => $n->created_at->diffForHumans(),
                'exactDate' => $n->created_at->format('d/m/Y H:i'),
            ];
        });

        $totalReached = $sentItems->sum('receivedDevices');
        $avgRate = $sentItems->count() > 0 ? round($sentItems->avg('deliveryRate'), 1) : 100.0;

        return response()->json([
            'data' => $sentItems,
            'kpis' => [
                'totalSent' => $sentItems->count(),
                'totalReached' => $totalReached,
                'avgDeliveryRate' => $avgRate,
                'activeDevices' => $activeDevicesCount,
                'registeredDelegates' => max(1, $totalDelegatesCount),
            ],
        ]);
    }

    public function sendBroadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'target_type' => 'required|string|in:all,region,delegate',
            'target_id' => 'nullable|string',
            'category' => 'nullable|string',
            'priority' => 'nullable|string|in:low,normal,high,critical',
        ]);

        $targetType = $validated['target_type'];
        $targetId = $validated['target_id'] ?? null;
        $category = $validated['category'] ?? 'system';
        $priority = $validated['priority'] ?? 'high';

        $region = 'All';
        $userTarget = 'All Delegates';
        $recipientToken = '/topics/sti_delegates';

        if ($targetType === 'region' && $targetId) {
            $region = $targetId;
            $userTarget = 'Région: ' . $targetId;
        } elseif ($targetType === 'delegate' && $targetId) {
            $delegateUser = \App\Models\User::find($targetId);
            if ($delegateUser) {
                $userTarget = $delegateUser->name;
                $region = $delegateUser->region ?? 'All';
                $recipientToken = $delegateUser->fcm_token ?? '/topics/sti_delegates';
            }
        }

        $notification = Notification::create([
            'title' => $validated['title'],
            'description' => $validated['body'],
            'category' => $category,
            'priority' => $priority,
            'status' => 'unread',
            'user' => $userTarget,
            'region' => $region,
            'module' => 'Broadcast',
            'reference_id' => 'BRD-' . strtoupper(substr(uniqid(), -6)),
            'read' => false,
        ]);

        // Dispatch FCM Push Notification (HTTP v1)
        try {
            app(\App\Services\FirebaseService::class)->sendPush(
                $recipientToken,
                $validated['title'],
                $validated['body'],
                [
                    'type' => 'broadcast_message',
                    'broadcast_id' => (string) $notification->id,
                    'category' => $category,
                    'priority' => $priority,
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ]
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Broadcast FCM push dispatch error: " . $e->getMessage());
        }

        return response()->json([
            'data' => [
                'id' => (string) $notification->id,
                'title' => $notification->title,
                'body' => $notification->description,
                'category' => $notification->category,
                'priority' => $notification->priority,
                'targetAudience' => $userTarget,
                'status' => 'delivered',
                'createdAt' => $notification->created_at->toISOString(),
            ],
            'message' => 'Notification push diffusée avec succès à tous les appareils ciblés',
        ], 201);
    }

    private function formatNotification(Notification $n, $orderMap = null): array
    {
        $orderId = null;
        $isOrder = ($n->category === 'orders' || strtolower($n->module ?? '') === 'orders');
        if ($isOrder && !empty($n->reference_id)) {
            if (\Illuminate\Support\Str::isUuid($n->reference_id)) {
                $orderId = $n->reference_id;
            } elseif ($orderMap && isset($orderMap[$n->reference_id])) {
                $orderId = $orderMap[$n->reference_id];
            } else {
                $cleanRef = preg_replace('/^[#\s]+/', '', (string) $n->reference_id);
                $found = \App\Models\Order::where('order_code', $cleanRef)->value('id');
                $orderId = $found ?: $n->reference_id;
            }
        }

        return [
            'id' => (string) $n->id,
            'title' => $n->title,
            'description' => $n->description ?? '',
            'category' => $n->category,
            'priority' => $n->priority,
            'status' => $n->status,
            'user' => $n->user,
            'region' => $n->region,
            'module' => $n->module,
            'referenceId' => $n->reference_id,
            'orderId' => $orderId,
            'timestamp' => $n->created_at->toISOString(),
            'dateFormatted' => $n->created_at->diffForHumans(),
            'read' => (bool) $n->read,
        ];
    }
}
