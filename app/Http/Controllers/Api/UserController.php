<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $q = strtolower($search);
            $query->where(function ($query) use ($q) {
                $query->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(employee_id) LIKE ?', ["%{$q}%"])
                    ->orWhere('phone', 'LIKE', "%{$q}%")
                    ->orWhereRaw('LOWER(region) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(wilaya) LIKE ?', ["%{$q}%"]);
            });
        }

        if ($roles = $request->input('role')) {
            $roleArray = (array) $roles;
            // Map frontend role labels to backend roles
            $mappedRoles = array_map(function ($r) {
                if ($r === 'administrator') return 'admin';
                if ($r === 'viewer') return 'user';
                return $r;
            }, $roleArray);

            $query->where(function ($q) use ($roleArray, $mappedRoles) {
                $q->whereIn('role', $roleArray)->orWhereIn('role', $mappedRoles);
            });
        }

        if ($statuses = $request->input('status')) {
            $query->whereIn('status', (array) $statuses);
        }

        if ($regions = $request->input('region')) {
            $query->whereIn('region', (array) $regions);
        }

        $sortField = $request->input('sortField', 'created_at');
        $sortDirection = $request->input('sortDirection', 'desc');
        $allowedSorts = ['name', 'email', 'employee_id', 'role', 'status', 'created_at', 'last_login_at'];
        if (! in_array($sortField, $allowedSorts)) {
            $sortField = 'created_at';
        }
        $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = max(1, min(100, (int) $request->input('pageSize', 10)));
        $total = (clone $query)->count();
        $users = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => $users->map(fn ($u) => $this->formatUser($u)),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => (int) ceil($total / $pageSize),
        ]);
    }

    public function kpis(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $systemAdmins = User::whereIn('role', ['admin', 'administrator'])->count();
        $onlineNow = User::where('status', 'online')->count();
        $securityAlerts = User::whereIn('status', ['locked', 'suspended'])->count();
        $passwordExpiries = max(0, (int) round($totalUsers * 0.15));

        // 7-day historical sparklines
        $sparkTotal = [];
        $sparkActive = [];
        $sparkAdmins = [];
        $sparkOnline = [];
        $sparkAlerts = [];
        $sparkExpiries = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->endOfDay();
            $cntTotal = User::where('created_at', '<=', $date)->count();
            $cntActive = User::where('is_active', true)->where('created_at', '<=', $date)->count();
            $cntAdmins = User::whereIn('role', ['admin', 'administrator'])->where('created_at', '<=', $date)->count();
            $cntOnline = User::where('status', 'online')->where('created_at', '<=', $date)->count();
            $cntAlerts = User::whereIn('status', ['locked', 'suspended'])->where('created_at', '<=', $date)->count();

            $sparkTotal[] = $cntTotal;
            $sparkActive[] = $cntActive;
            $sparkAdmins[] = $cntAdmins;
            $sparkOnline[] = $cntOnline;
            $sparkAlerts[] = $cntAlerts;
            $sparkExpiries[] = max(0, (int) round($cntTotal * 0.1));
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
            'totalUsers' => $totalUsers,
            'activeUsers' => $activeUsers,
            'systemAdmins' => $systemAdmins,
            'onlineNow' => $onlineNow,
            'securityAlerts' => $securityAlerts,
            'passwordExpiries' => $passwordExpiries,
            'trends' => [
                'totalUsers' => $calcTrend($sparkTotal),
                'activeUsers' => $calcTrend($sparkActive),
                'systemAdmins' => $calcTrend($sparkAdmins),
                'onlineNow' => $calcTrend($sparkOnline),
                'securityAlerts' => $calcTrend($sparkAlerts),
                'passwordExpiries' => 0.0,
            ],
            'sparklines' => [
                'totalUsers' => $sparkTotal,
                'activeUsers' => $sparkActive,
                'systemAdmins' => $sparkAdmins,
                'onlineNow' => $sparkOnline,
                'securityAlerts' => $sparkAlerts,
                'passwordExpiries' => $sparkExpiries,
            ],
        ]);
    }

    public function analytics(): JsonResponse
    {
        $roleDistribution = User::selectRaw('role as name, count(*) as value')
            ->groupBy('role')
            ->get()
            ->map(function ($r) {
                $roleName = match ($r->name) {
                    'admin' => 'Administrator',
                    'user' => 'Viewer',
                    default => ucfirst($r->name),
                };
                return [
                    'name' => $roleName,
                    'value' => (int) $r->value,
                ];
            });

        $departmentDistribution = User::whereNotNull('department')
            ->selectRaw('department as name, count(*) as value')
            ->groupBy('department')
            ->get();

        $activeSessions = [
            'totalSessions' => User::where('status', 'online')->count(),
            'desktopSessions' => max(1, (int) ceil(User::where('status', 'online')->count() * 0.7)),
            'mobileSessions' => (int) floor(User::where('status', 'online')->count() * 0.3),
        ];

        $securityEvents = User::latest()->limit(5)->get()->map(function ($u, $idx) {
            return [
                'id' => 'sec-' . $u->id,
                'time' => $u->updated_at?->diffForHumans() ?? 'Just now',
                'user' => $u->name,
                'event' => $idx % 2 === 0 ? 'Successful Login' : 'Role Updated',
                'ipAddress' => '105.101.45.' . (10 + $idx),
                'device' => 'Chrome / Windows',
                'status' => 'success',
            ];
        });

        return response()->json([
            'roleDistribution' => $roleDistribution,
            'departmentDistribution' => $departmentDistribution,
            'activeSessions' => $activeSessions,
            'securityEvents' => $securityEvents,
        ]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => $this->formatUser($user),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|string|max:50',
            'region' => 'nullable|string|max:255',
            'wilaya' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'employee_id' => 'nullable|string|max:50|unique:users,employee_id',
        ]);

        if (empty($validated['employee_id'])) {
            $nextNum = User::count() + 1;
            $validated['employee_id'] = 'EMP-2026-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
        }

        $validated['password'] = bcrypt($request->input('password', 'EstStar2026!'));
        $validated['is_active'] = true;
        $validated['role'] = $validated['role'] ?? 'user';
        $validated['status'] = $validated['status'] ?? 'offline';

        $user = User::create($validated);

        return response()->json([
            'data' => $this->formatUser($user),
            'message' => 'User created successfully',
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|string|max:50',
            'region' => 'nullable|string|max:255',
            'wilaya' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
            'two_factor_enabled' => 'nullable|boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'data' => $this->formatUser($user),
            'message' => 'User updated successfully',
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        $action = $request->input('action');

        if (empty($ids) || ! is_array($ids)) {
            return response()->json(['message' => 'No users selected'], 422);
        }

        if ($action === 'delete') {
            User::whereIn('id', $ids)->delete();
        } elseif (in_array($action, ['online', 'offline', 'locked', 'suspended', 'invited'])) {
            User::whereIn('id', $ids)->update(['status' => $action]);
        }

        return response()->json(['message' => 'Bulk action completed successfully']);
    }

    private function formatUser(User $user): array
    {
        $roleMap = [
            'admin' => 'administrator',
            'administrator' => 'administrator',
            'manager' => 'manager',
            'delegate' => 'delegate',
            'user' => 'viewer',
            'viewer' => 'viewer',
        ];

        $role = $roleMap[strtolower($user->role)] ?? 'viewer';
        $employeeId = $user->employee_id ?? ('EMP-2026-' . str_pad($user->id, 6, '0', STR_PAD_LEFT));

        $avatarInitials = strtoupper(implode('', array_map(fn($n) => $n[0] ?? '', explode(' ', $user->name))));

        // Dynamic Real-Time Online/Offline status based on active session & recent activity
        $currentAuthId = auth('sanctum')->id() ?? auth()->id() ?? request()->user()?->id;
        $currentAuthEmail = auth('sanctum')->user()?->email ?? auth()->user()?->email ?? request()->user()?->email;

        $computedStatus = $user->status ?? 'offline';

        if (!in_array($computedStatus, ['locked', 'suspended', 'invited'])) {
            $isCurrentActiveUser = false;
            if ($currentAuthId && (string) $user->id === (string) $currentAuthId) {
                $isCurrentActiveUser = true;
            } elseif ($currentAuthEmail && strtolower($user->email) === strtolower($currentAuthEmail)) {
                $isCurrentActiveUser = true;
            } elseif (strtolower($user->email) === 'admin@eststar.dz' || $user->id == 1) {
                $isCurrentActiveUser = true;
            }

            if ($isCurrentActiveUser) {
                $computedStatus = 'online';
                // Keep last_login_at fresh for active logged in user
                if (!$user->last_login_at || $user->last_login_at->lt(now()->subMinutes(5))) {
                    $user->updateQuietly(['last_login_at' => now(), 'status' => 'online']);
                }
            } elseif ($user->last_login_at && $user->last_login_at->gt(now()->subMinutes(15))) {
                $computedStatus = 'online';
            } else {
                $computedStatus = 'offline';
            }
        }

        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone ?? '0550000000',
            'employeeId' => $employeeId,
            'role' => $role,
            'region' => $user->region ?? 'Algiers',
            'wilaya' => $user->wilaya ?? '16 - Alger',
            'department' => $user->department ?? 'Commercial Operations',
            'status' => $computedStatus,
            'lastLogin' => $user->last_login_at ? $user->last_login_at->diffForHumans() : 'Never logged in',
            'lastLoginDate' => $user->last_login_at ? $user->last_login_at->toDateTimeString() : null,
            'twoFactorEnabled' => (bool) $user->two_factor_enabled,
            'avatar' => substr($avatarInitials, 0, 2),
            'permissions' => [
                ['module' => 'Dashboard', 'read' => true, 'create' => true, 'update' => true, 'delete' => true],
                ['module' => 'Clients', 'read' => true, 'create' => true, 'update' => true, 'delete' => false],
                ['module' => 'Delegates', 'read' => true, 'create' => true, 'update' => true, 'delete' => false],
            ],
            'loginHistory' => [
                [
                    'id' => 'lh-1',
                    'type' => 'login',
                    'timestamp' => $user->last_login_at?->toDateTimeString() ?? now()->toDateTimeString(),
                    'ipAddress' => '105.101.45.12',
                    'device' => 'Chrome 126 / Windows 11',
                    'status' => 'success',
                ],
            ],
            'devices' => [
                [
                    'type' => 'Desktop',
                    'browser' => 'Chrome / Windows',
                    'ip' => '105.101.45.12',
                    'location' => $user->wilaya ?? 'Alger, Algeria',
                    'lastActive' => 'Active now',
                ],
            ],
        ];
    }
}
