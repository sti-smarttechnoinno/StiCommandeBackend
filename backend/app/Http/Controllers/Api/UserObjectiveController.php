<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DelegateObjective;
use App\Models\Notification;
use App\Models\Order;
use App\Models\User;
use App\Services\FirebaseService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class UserObjectiveController extends Controller
{
    /**
     * Get list of users that the current user is authorized to assign objectives/tasks to.
     */
    public function assignableUsers(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $users = $this->resolveAssignableSubordinates($currentUser);

        $data = $users->map(function ($u) {
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
            ];
        });

        return response()->json([
            'users' => $data,
            'current_user_role' => $currentUser->role,
        ]);
    }

    /**
     * List objectives with actual progress and achievement rates.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $year = (int) ($request->query('year') ?? now()->year);
        $month = $request->query('month') ? (int) $request->query('month') : (int) now()->month;

        $query = DelegateObjective::with(['user', 'assignedBy'])
            ->where('year', $year);

        if ($month) {
            $query->where('month', $month);
        }

        // Role-based visibility
        if ($currentUser->isAdmin() || $currentUser->role === 'directeur') {
            // Admins & Directeurs see all objectives
            if ($request->query('user_id')) {
                $query->where('user_id', (int) $request->query('user_id'));
            }
        } elseif ($currentUser->role === 'responsable_commercial') {
            // Responsables see their subordinates or objectives assigned by them
            $subordinateIds = $this->resolveAssignableSubordinates($currentUser)->pluck('id')->toArray();
            $subordinateIds[] = $currentUser->id;
            $query->whereIn('user_id', $subordinateIds);
        } elseif ($currentUser->role === 'commercial') {
            // Commerciaux see their assigned delegates or their own
            $delegateIds = $this->resolveAssignableSubordinates($currentUser)->pluck('id')->toArray();
            $delegateIds[] = $currentUser->id;
            $query->whereIn('user_id', $delegateIds);
        } else {
            // Délégués see only their own
            $query->where('user_id', $currentUser->id);
        }

        $objectives = $query->orderBy('month', 'desc')->get();

        $monthNamesFr = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
        ];

        $data = $objectives->map(function ($obj) use ($monthNamesFr) {
            $targetUser = $obj->user;
            $startDate = Carbon::createFromDate($obj->year, $obj->month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($obj->year, $obj->month, 1)->endOfMonth();

            // Calculate actual sales from orders
            $achievedOrders = 0;
            $achievedRevenue = 0.0;

            if ($targetUser) {
                $orders = Order::where(function ($q) use ($targetUser) {
                    $q->where('delegate_id', $targetUser->id)
                      ->orWhere('delegate_name', $targetUser->name);
                })
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('status', '!=', 'cancelled')
                ->with(['items.product'])
                ->get();

                $achievedOrders = $orders->count();
                foreach ($orders as $order) {
                    if ($order->items->isNotEmpty()) {
                        foreach ($order->items as $item) {
                            $nominalPrice = (float) ($item->product?->nominal_price ?? $item->unit_price);
                            $qty = (int) ($item->quantity ?? 1);
                            $achievedRevenue += ($nominalPrice * $qty);
                        }
                    } else {
                        $achievedRevenue += (float) $order->total_amount;
                    }
                }
            }

            $targetRev = (float) $obj->target_revenue;
            $targetOrd = (int) $obj->target_orders;

            $revPercent = $targetRev > 0
                ? round(($achievedRevenue / $targetRev) * 100, 1)
                : ($achievedRevenue > 0 ? 100.0 : 0.0);

            $ordPercent = $targetOrd > 0
                ? round(($achievedOrders / $targetOrd) * 100, 1)
                : ($achievedOrders > 0 ? 100.0 : 0.0);

            return [
                'id' => $obj->id,
                'user_id' => $obj->user_id,
                'user_name' => $targetUser?->name ?? 'Utilisateur',
                'assignee_name' => $targetUser?->name ?? 'Utilisateur',
                'user_role' => $targetUser?->role ?? 'delegate',
                'assignee_role' => $targetUser?->role ?? 'delegate',
                'user_region' => $targetUser?->region ?? '',
                'region_name' => $targetUser?->region ?? '',
                'user_wilaya' => $targetUser?->wilaya ?? '',
                'assigned_by_name' => $obj->assignedBy?->name ?? 'Direction',
                'assigned_by' => $obj->assignedBy ? [
                    'id' => $obj->assignedBy->id,
                    'name' => $obj->assignedBy->name,
                    'role' => $obj->assignedBy->role,
                ] : null,
                'year' => $obj->year,
                'month' => $obj->month,
                'month_name' => $monthNamesFr[$obj->month] ?? "Mois {$obj->month}",
                'target_revenue' => $targetRev,
                'achieved_revenue' => round($achievedRevenue, 2),
                'actual_revenue' => round($achievedRevenue, 2),
                'revenue_percentage' => $revPercent,
                'revenue_progress' => $revPercent,
                'target_orders' => $targetOrd,
                'achieved_orders' => $achievedOrders,
                'actual_orders' => $achievedOrders,
                'orders_percentage' => $ordPercent,
                'orders_progress' => $ordPercent,
                'notes' => $obj->notes,
                'updated_at' => $obj->updated_at?->toISOString(),
            ];
        });

        return response()->json([
            'objectives' => $data,
            'data' => $data,
            'year' => $year,
            'month' => $month,
        ]);
    }

    /**
     * Batch assign monthly objectives to one or multiple selected persons concerned.
     */
    public function batchAssign(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|integer|exists:users,id',
            'year' => 'required|integer|min:2020|max:2040',
            'month' => 'required|integer|min:1|max:12',
            'target_revenue' => 'required|numeric|min:0',
            'target_orders' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $targetUserIds = $validated['user_ids'];

        // Enforce hierarchy: ensure caller is authorized to assign to these users
        $assignableUserIds = $this->resolveAssignableSubordinates($currentUser)->pluck('id')->toArray();

        foreach ($targetUserIds as $targetId) {
            if (!in_array($targetId, $assignableUserIds) && !$currentUser->isAdmin()) {
                $unauthorizedUser = User::find($targetId);
                return response()->json([
                    'error' => "Non autorisé à assigner des objectifs à {$unauthorizedUser?->name}",
                ], 403);
            }
        }

        $monthNamesFr = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
        ];
        $monthName = $monthNamesFr[(int) $validated['month']] ?? 'Mois ' . $validated['month'];

        $createdObjectives = [];

        foreach ($targetUserIds as $targetId) {
            $targetUser = User::find($targetId);
            if (!$targetUser) continue;

            $objective = DelegateObjective::updateOrCreate(
                [
                    'user_id' => $targetUser->id,
                    'year' => (int) $validated['year'],
                    'month' => (int) $validated['month'],
                ],
                [
                    'assigned_by' => $currentUser->id,
                    'target_revenue' => (float) $validated['target_revenue'],
                    'target_orders' => (int) ($validated['target_orders'] ?? 0),
                    'notes' => $validated['notes'] ?? null,
                ]
            );

            $createdObjectives[] = $objective;

            // Notifications localized
            $userLocale = strtolower($targetUser->locale ?? 'fr');
            if ($userLocale === 'ar') {
                $notifTitle = "تم تحديد الهدف الشهري ({$validated['month']}/{$validated['year']})";
                $notifBody = "حدد {$currentUser->name} هدفك لهذا الشهر. اضغط للاطلاع عليه.";
            } elseif ($userLocale === 'en') {
                $notifTitle = "Monthly Objective Set ({$validated['month']}/{$validated['year']})";
                $notifBody = "{$currentUser->name} has set your objective for this month. Tap to view.";
            } else {
                $notifTitle = "Objectif Mensuel Fixé ({$monthName} {$validated['year']})";
                $notifBody = "{$currentUser->name} a fixé votre objectif pour ce mois. Cliquez pour consulter.";
            }

            // In-app system notification
            try {
                Notification::create([
                    'title' => $notifTitle,
                    'description' => $notifBody,
                    'category' => 'system',
                    'priority' => 'high',
                    'status' => 'unread',
                    'user' => $targetUser->name,
                    'region' => $targetUser->region ?? 'All',
                    'module' => 'Objectives',
                    'reference_id' => "OBJ-{$objective->id}",
                    'read' => false,
                ]);
            } catch (\Throwable $e) {
                Log::warning("Could not create objective notification record: " . $e->getMessage());
            }

            // Dispatch FCM Push Notification (HTTP v1)
            try {
                $targetRecipient = !empty($targetUser->fcm_token) ? $targetUser->fcm_token : '/topics/sti_delegates';
                app(FirebaseService::class)->sendPush(
                    $targetRecipient,
                    $notifTitle,
                    $notifBody,
                    [
                        'type' => 'monthly_objective',
                        'delegate_id' => (string) $targetUser->id,
                        'delegate_name' => (string) $targetUser->name,
                        'assigned_by' => (string) $currentUser->name,
                        'year' => (string) $validated['year'],
                        'month' => (string) $validated['month'],
                        'target_revenue' => (string) $validated['target_revenue'],
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ]
                );
            } catch (\Throwable $e) {
                Log::warning("FCM objective push failed: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($createdObjectives) . ' objectif(s) mensuel(s) assigné(s) avec succès.',
            'count' => count($createdObjectives),
        ]);
    }

    /**
     * Resolve subordinates according to STI organizational hierarchy.
     */
    protected function resolveAssignableSubordinates(User $currentUser)
    {
        $role = $currentUser->role;

        // Level 1: Directeur or Admin -> can assign to everyone
        if ($currentUser->isAdmin() || $role === 'directeur') {
            return User::where('id', '!=', $currentUser->id)
                ->where('is_active', true)
                ->orderBy('role')
                ->orderBy('name')
                ->get();
        }

        // Level 2: Responsable Commercial -> Commerciaux and Délégués
        if ($role === 'responsable_commercial') {
            return User::where('id', '!=', $currentUser->id)
                ->where('is_active', true)
                ->whereIn('role', ['commercial', 'delegate'])
                ->orderBy('role')
                ->orderBy('name')
                ->get();
        }

        // Level 3: Commercial -> Délégués in their region/scope
        if ($role === 'commercial') {
            $query = User::where('id', '!=', $currentUser->id)
                ->where('is_active', true)
                ->where('role', 'delegate');

            // If commercial has a designated region, filter delegates belonging to that region
            if (!empty($currentUser->region)) {
                $reg = trim(strtolower($currentUser->region));
                $query->where(function ($q) use ($reg) {
                    $q->whereRaw('LOWER(TRIM(region)) = ?', [$reg])
                      ->orWhereNull('region')
                      ->orWhere('region', '');
                });
            }

            return $query->orderBy('name')->get();
        }

        // Level 4: Délégués -> cannot assign to others
        return collect();
    }
}
