<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DelegateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'delegate')->with('clients');

        if ($search = $request->input('search')) {
            $q = strtolower($search);
            $query->where(function ($query) use ($q) {
                $query->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(username) LIKE ?', ["%{$q}%"])
                    ->orWhere('phone', 'LIKE', "%{$q}%")
                    ->orWhereRaw('LOWER(region) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(wilaya) LIKE ?', ["%{$q}%"]);
            });
        }

        if ($statuses = $request->input('status')) {
            $statusList = (array) $statuses;
            if (in_array('online', $statusList)) {
                $query->where('last_seen_at', '>=', now()->subSeconds(90));
            } elseif (in_array('offline', $statusList)) {
                $query->where(function ($q) {
                    $q->whereNull('last_seen_at')
                      ->orWhere('last_seen_at', '<', now()->subSeconds(90));
                });
            }
        }

        if ($regions = $request->input('region')) {
            $query->whereIn('region', (array) $regions);
        }

        $sortField = $request->input('sortField', 'created_at');
        $sortDirection = $request->input('sortDirection', 'desc');
        $allowedSorts = ['name', 'username', 'region', 'status', 'created_at', 'last_seen_at'];
        if (! in_array($sortField, $allowedSorts)) {
            $sortField = 'created_at';
        }
        $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(100, (int) $request->input('pageSize', 10)));
        $total = (clone $query)->count();
        $delegates = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => $delegates->map(fn ($d) => $this->formatDelegate($d)),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => (int) ceil($total / $pageSize),
        ]);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->update(['last_seen_at' => now(), 'status' => 'online']);
            $this->broadcastDelegateStatus($user, 'online');
            return response()->json([
                'status' => 'online',
                'last_seen_at' => $user->last_seen_at->toISOString(),
            ]);
        }

        if ($identifier = $request->input('identifier')) {
            $d = User::where('id', $identifier)
                ->orWhere('username', $identifier)
                ->orWhere('phone', $identifier)
                ->orWhere('employee_id', $identifier)
                ->orWhere('name', $identifier)
                ->first();
            if ($d) {
                $d->update(['last_seen_at' => now(), 'status' => 'online']);
                $this->broadcastDelegateStatus($d, 'online');
                return response()->json([
                    'status' => 'online',
                    'last_seen_at' => $d->last_seen_at->toISOString(),
                ]);
            }
        }

        return response()->json(['message' => 'Heartbeat received']);
    }

    public function offline(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->update([
                'last_seen_at' => now()->subMinutes(10),
                'status' => 'offline',
            ]);
            $this->broadcastDelegateStatus($user, 'offline');
            return response()->json(['status' => 'offline']);
        }

        if ($identifier = $request->input('identifier')) {
            $d = User::where('id', $identifier)
                ->orWhere('username', $identifier)
                ->orWhere('phone', $identifier)
                ->orWhere('employee_id', $identifier)
                ->orWhere('name', $identifier)
                ->first();
            if ($d) {
                $d->update([
                    'last_seen_at' => now()->subMinutes(10),
                    'status' => 'offline',
                ]);
                $this->broadcastDelegateStatus($d, 'offline');
                return response()->json(['status' => 'offline']);
            }
        }

        return response()->json(['message' => 'Offline status updated']);
    }

    private function broadcastDelegateStatus(User $delegate, string $status): void
    {
        try {
            \Illuminate\Support\Facades\Http::timeout(2)->post('http://127.0.0.1:8085/broadcast', [
                'type' => 'DELEGATE_STATUS_CHANGED',
                'delegate' => [
                    'id' => (string) $delegate->id,
                    'name' => $delegate->name,
                    'status' => $status,
                    'isOnline' => $status === 'online',
                    'lastActivity' => now()->toISOString(),
                ],
            ]);
        } catch (\Throwable $e) {}
    }

    public function kpis(): JsonResponse
    {
        $totalDelegates = User::where('role', 'delegate')->count();
        $onlineDelegates = User::where('role', 'delegate')->where('last_seen_at', '>=', now()->subSeconds(90))->count();
        $busyDelegates = User::where('role', 'delegate')->where('status', 'busy')->count();
        $offlineDelegates = max(0, $totalDelegates - $onlineDelegates - $busyDelegates);
        $totalClients = Client::count();
        $totalRevenue = (float) Client::sum('total_spent');
        $totalOrders = (int) Client::sum('total_orders');
        $regionsCount = User::where('role', 'delegate')->whereNotNull('region')->where('region', '!=', '')->distinct('region')->count('region');

        $avgPerformance = $totalDelegates > 0
            ? round((($onlineDelegates + $busyDelegates) / $totalDelegates) * 100, 1)
            : 0;

        $sparkTotalDelegates = [];
        $sparkOnlineDelegates = [];
        $sparkOrders = [];
        $sparkRevenue = [];
        $sparkAvgPerformance = [];
        $sparkRegions = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->endOfDay();

            $cntDelegates = User::where('role', 'delegate')->where('created_at', '<=', $date)->count();
            $cntOnline = User::where('role', 'delegate')->where('last_seen_at', '>=', now()->subSeconds(90))->where('created_at', '<=', $date)->count();
            $cntOrders = (int) Client::where('created_at', '<=', $date)->sum('total_orders');
            $sumRev = (float) Client::where('created_at', '<=', $date)->sum('total_spent');
            $cntRegions = User::where('role', 'delegate')->whereNotNull('region')->where('region', '!=', '')->where('created_at', '<=', $date)->distinct('region')->count('region');
            $perf = $cntDelegates > 0 ? round(($cntOnline / $cntDelegates) * 100, 1) : 0;

            $sparkTotalDelegates[] = $cntDelegates;
            $sparkOnlineDelegates[] = $cntOnline;
            $sparkOrders[] = $cntOrders;
            $sparkRevenue[] = $sumRev;
            $sparkAvgPerformance[] = $perf;
            $sparkRegions[] = $cntRegions;
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
            'totalDelegates' => $totalDelegates,
            'onlineDelegates' => $onlineDelegates,
            'busyDelegates' => $busyDelegates,
            'offlineDelegates' => $offlineDelegates,
            'ordersToday' => $totalOrders,
            'revenueToday' => $totalRevenue,
            'avgPerformance' => $avgPerformance,
            'regionsCovered' => $regionsCount,
            'trends' => [
                'totalDelegates' => $calcTrend($sparkTotalDelegates),
                'onlineDelegates' => $calcTrend($sparkOnlineDelegates),
                'ordersToday' => $calcTrend($sparkOrders),
                'revenueToday' => $calcTrend($sparkRevenue),
                'avgPerformance' => $calcTrend($sparkAvgPerformance),
                'regionsCovered' => $calcTrend($sparkRegions),
            ],
            'sparklines' => [
                'totalDelegates' => $sparkTotalDelegates,
                'onlineDelegates' => $sparkOnlineDelegates,
                'ordersToday' => $sparkOrders,
                'revenueToday' => $sparkRevenue,
                'avgPerformance' => $sparkAvgPerformance,
                'regionsCovered' => $sparkRegions,
            ],
        ]);
    }

    public function analytics(): JsonResponse
    {
        $regional = User::where('role', 'delegate')
            ->whereNotNull('region')
            ->selectRaw('region as name, count(*) as value')
            ->groupBy('region')
            ->get();

        $onlineCount = User::where('role', 'delegate')->where('last_seen_at', '>=', now()->subSeconds(90))->count();
        $busyCount = User::where('role', 'delegate')->where('status', 'busy')->count();
        $totalCount = User::where('role', 'delegate')->count();
        $offlineCount = max(0, $totalCount - $onlineCount - $busyCount);

        $statusCounts = [
            'online' => $onlineCount,
            'busy' => $busyCount,
            'offline' => $offlineCount,
            'suspended' => User::where('role', 'delegate')->where('status', 'suspended')->count(),
        ];

        $topPerformers = User::where('role', 'delegate')->with('clients')->get()->map(function ($d) {
            $totalSpent = (float) $d->clients->sum('total_spent');
            $totalOrders = (int) $d->clients->sum('total_orders');
            $clientsCount = $d->clients->count();
            $activeClientsCount = $d->clients->where('status', 'active')->count();
            $completionRate = $clientsCount > 0
                ? (int) round(($activeClientsCount / $clientsCount) * 100)
                : ($totalOrders > 0 ? 100 : 0);

            return [
                'id' => (string) $d->id,
                'name' => $d->name,
                'region' => $d->region ?? 'Algiers',
                'orders' => $totalOrders,
                'revenue' => $totalSpent,
                'completionRate' => $completionRate,
            ];
        })->sortByDesc('revenue')->values()->take(5);

        return response()->json([
            'regionalDistribution' => $regional,
            'statusCounts' => $statusCounts,
            'topPerformers' => $topPerformers,
        ]);
    }

    public function show(User $delegate): JsonResponse
    {
        if ($delegate->role !== 'delegate') {
            return response()->json(['message' => 'User is not a delegate'], 404);
        }

        $delegate->load('clients');

        return response()->json([
            'data' => $this->formatDelegate($delegate),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $input = $request->all();

        $delegateCode = $input['delegateCode'] ?? $input['delegate_code'] ?? $input['employee_id'] ?? $this->generateDelegateCode();
        $input['employee_id'] = $delegateCode;

        if (empty($input['username'])) {
            $nameStr = $input['name'] ?? 'delegate';
            $baseUsername = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', str_replace(' ', '.', $nameStr)));
            $username = $baseUsername;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $baseUsername . $counter++;
            }
            $input['username'] = $username;
        } else {
            $input['username'] = trim($input['username']);
        }

        $request->merge($input);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'employee_id' => 'required|string|max:50|unique:users,employee_id',
            'phone' => 'nullable|string|max:20',
            'region' => 'nullable|string|max:255',
            'wilaya' => 'nullable|string|max:255',
            'status' => 'nullable|in:online,busy,offline,suspended',
        ]);

        $validated['role'] = 'delegate';
        $validated['password'] = bcrypt('password');
        $validated['is_active'] = true;
        $validated['status'] = 'offline';
        $validated['last_seen_at'] = null;
        $validated['last_login_at'] = null;

        $delegate = User::create($validated);

        return response()->json([
            'data' => $this->formatDelegate($delegate),
            'message' => 'Delegate created successfully',
        ], 201);
    }

    public function update(Request $request, User $delegate): JsonResponse
    {
        if ($delegate->role !== 'delegate') {
            return response()->json(['message' => 'User is not a delegate'], 404);
        }

        $input = $request->all();
        if (! empty($input['username'])) {
            $input['username'] = trim($input['username']);
        }
        if (! empty($input['delegateCode'])) {
            $input['employee_id'] = trim($input['delegateCode']);
        }
        $request->merge($input);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $delegate->id,
            'employee_id' => 'sometimes|nullable|string|max:50|unique:users,employee_id,' . $delegate->id,
            'phone' => 'nullable|string|max:20',
            'region' => 'nullable|string|max:255',
            'wilaya' => 'nullable|string|max:255',
            'status' => 'nullable|in:online,busy,offline,suspended',
            'password' => 'nullable|string|min:6',
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $delegate->update($validated);

        return response()->json([
            'data' => $this->formatDelegate($delegate),
            'message' => 'Delegate updated successfully',
        ]);
    }

    public function destroy(User $delegate): JsonResponse
    {
        if ($delegate->role !== 'delegate') {
            return response()->json(['message' => 'User is not a delegate'], 404);
        }

        $delegate->delete();

        return response()->json(['message' => 'Delegate deleted successfully']);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        $action = $request->input('action');

        if (empty($ids) || ! is_array($ids)) {
            return response()->json(['message' => 'No delegates selected'], 422);
        }

        if ($action === 'delete') {
            User::where('role', 'delegate')->whereIn('id', $ids)->delete();
        } elseif (in_array($action, ['online', 'busy', 'offline', 'suspended'])) {
            User::where('role', 'delegate')->whereIn('id', $ids)->update(['status' => $action]);
        }

        return response()->json(['message' => 'Bulk action completed successfully']);
    }

    private function generateDelegateCode(): string
    {
        $last = User::where('role', 'delegate')->latest('id')->first();
        $next = ($last?->id ?? 0) + 1;

        return 'DEL-2026-' . str_pad($next, 6, '0', STR_PAD_LEFT);
    }

    private function formatDelegate(User $delegate): array
    {
        $clients = $delegate->relationLoaded('clients') ? $delegate->clients : $delegate->clients()->get();

        // Calculate real order & revenue stats if orders relation/table exists
        $ordersQuery = \App\Models\Order::where('delegate_id', $delegate->id);
        $realTotalOrders = (int) (clone $ordersQuery)->count();
        $realTotalRevenue = (float) (clone $ordersQuery)->where('status', '!=', 'cancelled')->sum('total_amount');

        $totalOrders = $realTotalOrders > 0 ? $realTotalOrders : (int) $clients->sum('total_orders');
        $totalRevenue = $realTotalRevenue > 0 ? $realTotalRevenue : (float) $clients->sum('total_spent');
        $delegateCode = $delegate->employee_id ?? ('DEL-2026-' . str_pad($delegate->id, 6, '0', STR_PAD_LEFT));
        $username = $delegate->username ?? explode('@', $delegate->email ?? '')[0] ?? $delegate->name;

        $clientsCount = $clients->count();
        $activeClientsCount = $clients->where('status', 'active')->count();
        $completionRate = $clientsCount > 0
            ? (int) round(($activeClientsCount / $clientsCount) * 100)
            : ($totalOrders > 0 ? 100 : 0);

        // Dynamic online calculation (seen in the last 60 seconds)
        $lastSeen = $delegate->last_seen_at ?? $delegate->last_login_at;
        $hasEverConnected = $lastSeen !== null;
        $isOnline = $delegate->status !== 'offline' && $delegate->status !== 'suspended' && $hasEverConnected && $lastSeen->gt(now()->subSeconds(60));

        if ($delegate->status === 'suspended') {
            $computedStatus = 'suspended';
        } elseif ($delegate->status === 'busy') {
            $computedStatus = 'busy';
        } elseif ($isOnline) {
            $computedStatus = 'online';
        } elseif (!$hasEverConnected) {
            $computedStatus = 'never_connected';
        } else {
            $computedStatus = 'offline';
        }

        $lastActivity = $hasEverConnected ? $lastSeen->toISOString() : null;

        return [
            'id' => (string) $delegate->id,
            'delegateCode' => $delegateCode,
            'name' => $delegate->name,
            'username' => $username,
            'phone' => $delegate->phone ?? '0550000000',
            'region' => $delegate->region ?? '',
            'wilaya' => $delegate->wilaya ?? '',
            'status' => $computedStatus,
            'isOnline' => $isOnline,
            'hasEverConnected' => $hasEverConnected,
            'totalOrders' => $totalOrders,
            'totalRevenue' => $totalRevenue,
            'completionRate' => $completionRate,
            'clientCount' => $clientsCount,
            'lastActivity' => $lastActivity,
            'createdAt' => $delegate->created_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}
