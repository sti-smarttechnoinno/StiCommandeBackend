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

        $query->orderBy('created_at', 'desc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(100, (int) $request->input('pageSize', 20)));
        $total = (clone $query)->count();
        $items = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => $items->map(fn ($n) => $this->formatNotification($n)),
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

    private function formatNotification(Notification $n): array
    {
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
            'timestamp' => $n->created_at->toISOString(),
            'dateFormatted' => $n->created_at->diffForHumans(),
            'read' => (bool) $n->read,
        ];
    }
}
