<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DelegateObjective;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DelegateObjectiveController extends Controller
{
    public function index(Request $request, $delegate): JsonResponse
    {
        $delegate = $delegate instanceof User ? $delegate : User::findOrFail($delegate);

        if ($delegate->role !== 'delegate') {
            return response()->json(['message' => 'User is not a delegate'], 404);
        }

        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;

        // Fetch all defined objectives for this delegate
        $objectives = DelegateObjective::where('user_id', $delegate->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        $objectivesByPeriod = $objectives->keyBy(function ($obj) {
            return "{$obj->year}-{$obj->month}";
        });

        $monthNamesFr = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
        ];

        // Gather all relevant periods (current month, defined objectives, and past months with orders)
        $orderDates = Order::where(function ($q) use ($delegate) {
            $q->where('delegate_id', $delegate->id)
              ->orWhere('delegate_name', $delegate->name);
        })
        ->where('status', '!=', 'cancelled')
        ->pluck('created_at');

        $periods = collect();

        // Always include current month
        $periods->put("{$currentYear}-{$currentMonth}", [
            'year' => $currentYear,
            'month' => $currentMonth,
        ]);

        // Include all configured objective periods
        foreach ($objectives as $obj) {
            $periods->put("{$obj->year}-{$obj->month}", [
                'year' => (int) $obj->year,
                'month' => (int) $obj->month,
            ]);
        }

        // Include any past month where delegate had orders
        foreach ($orderDates as $date) {
            if ($date) {
                $cDate = Carbon::parse($date);
                $y = (int) $cDate->year;
                $m = (int) $cDate->month;
                $periods->put("{$y}-{$m}", [
                    'year' => $y,
                    'month' => $m,
                ]);
            }
        }

        $computeMonthStats = function (int $year, int $month, ?DelegateObjective $obj) use ($delegate, $currentYear, $currentMonth, $monthNamesFr) {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

            $orders = Order::where(function ($q) use ($delegate) {
                $q->where('delegate_id', $delegate->id)
                  ->orWhere('delegate_name', $delegate->name);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->with(['items.product'])
            ->get();

            $achievedOrders = $orders->count();
            $achievedRevenue = 0.0;
            $actualRevenue = (float) $orders->sum('total_amount');

            // Calculate achieved revenue using Catalogue Nominal Unit Price: Quantity * Product Nominal Price
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

            $targetRevenue = $obj ? (float) $obj->target_revenue : 0.0;
            $targetOrders = $obj ? (int) $obj->target_orders : 0;
            $notes = $obj ? $obj->notes : null;
            $objectiveId = $obj ? $obj->id : null;

            $revenuePercentage = $targetRevenue > 0
                ? round(($achievedRevenue / $targetRevenue) * 100, 1)
                : ($achievedRevenue > 0 ? 100.0 : 0.0);

            $ordersPercentage = $targetOrders > 0
                ? round(($achievedOrders / $targetOrders) * 100, 1)
                : ($achievedOrders > 0 ? 100.0 : 0.0);

            $isCurrent = ($year === $currentYear && $month === $currentMonth);
            $isUpcoming = ($year > $currentYear || ($year === $currentYear && $month > $currentMonth));

            if ($targetRevenue > 0 && $achievedRevenue >= $targetRevenue) {
                $status = 'completed'; // Atteint (100%+)
            } elseif ($isCurrent) {
                $status = 'in_progress'; // En cours
            } elseif ($isUpcoming) {
                $status = 'upcoming'; // À venir
            } else {
                $status = $targetRevenue > 0 ? 'missed' : 'not_set'; // Non atteint ou Non défini
            }

            return [
                'id' => $objectiveId,
                'year' => $year,
                'month' => $month,
                'monthName' => ($monthNamesFr[$month] ?? "Mois $month") . " $year",
                'targetRevenue' => $targetRevenue,
                'achievedRevenue' => round($achievedRevenue, 2),
                'actualRevenue' => round($actualRevenue, 2),
                'remainingRevenue' => max(0, round($targetRevenue - $achievedRevenue, 2)),
                'revenuePercentage' => $revenuePercentage,
                'targetOrders' => $targetOrders,
                'achievedOrders' => $achievedOrders,
                'ordersPercentage' => $ordersPercentage,
                'notes' => $notes,
                'status' => $status,
                'isCurrent' => $isCurrent,
                'isConfigured' => ($obj !== null && $targetRevenue > 0),
            ];
        };

        $archive = [];
        $currentMonthData = null;

        foreach ($periods as $key => $p) {
            $obj = $objectivesByPeriod->get($key);
            $stats = $computeMonthStats($p['year'], $p['month'], $obj);
            if ($p['year'] === $currentYear && $p['month'] === $currentMonth) {
                $currentMonthData = $stats;
            }
            $archive[] = $stats;
        }

        // Sort archive chronologically: year desc, month desc
        usort($archive, function ($a, $b) {
            if ($a['year'] === $b['year']) {
                return $b['month'] <=> $a['month'];
            }
            return $b['year'] <=> $a['year'];
        });

        return response()->json([
            'delegateId' => (string) $delegate->id,
            'delegateName' => $delegate->name,
            'currentMonth' => $currentMonthData ?? $computeMonthStats($currentYear, $currentMonth, null),
            'archive' => $archive,
            'totalObjectivesCount' => count($archive),
        ]);
    }

    public function storeOrUpdate(Request $request, $delegate): JsonResponse
    {
        $delegate = $delegate instanceof User ? $delegate : User::findOrFail($delegate);

        if ($delegate->role !== 'delegate') {
            return response()->json(['message' => 'User is not a delegate'], 404);
        }

        $input = $request->json()->all() ?: $request->all();
        if (isset($input['targetRevenue']) && !isset($input['target_revenue'])) {
            $input['target_revenue'] = $input['targetRevenue'];
        }
        if (isset($input['targetOrders']) && !isset($input['target_orders'])) {
            $input['target_orders'] = $input['targetOrders'];
        }

        $validator = \Illuminate\Support\Facades\Validator::make($input, [
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

        $objective = DelegateObjective::updateOrCreate(
            [
                'user_id' => $delegate->id,
                'year' => (int) $validated['year'],
                'month' => (int) $validated['month'],
            ],
            [
                'target_revenue' => (float) $validated['target_revenue'],
                'target_orders' => (int) ($validated['target_orders'] ?? 0),
                'notes' => $validated['notes'] ?? null,
            ]
        );

        $monthNamesFr = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
        ];
        $monthName = $monthNamesFr[(int) $validated['month']] ?? 'Mois ' . $validated['month'];

        $userLocale = strtolower($delegate->locale ?? 'fr');
        if ($userLocale === 'ar') {
            $notifTitle = "تم تحديد الهدف الشهري ({$validated['month']}/{$validated['year']})";
            $notifBody = 'تم تحديد هدف هذا الشهر، اضغط للاطلاع عليه.';
        } elseif ($userLocale === 'en') {
            $notifTitle = "Monthly Objective Set ({$validated['month']}/{$validated['year']})";
            $notifBody = 'The objective for this month has been set. Tap to view it.';
        } else {
            $notifTitle = "Objectif Mensuel Fixé ({$monthName} {$validated['year']})";
            $notifBody = "Votre objectif pour ce mois a été fixé. Cliquez pour le consulter.";
        }

        // 1. Create in-app system notification record
        try {
            \App\Models\Notification::create([
                'title' => $notifTitle,
                'description' => $notifBody,
                'category' => 'system',
                'priority' => 'high',
                'status' => 'unread',
                'user' => $delegate->name,
                'region' => $delegate->region ?? 'All',
                'module' => 'Objectives',
                'reference_id' => "OBJ-{$objective->id}",
                'read' => false,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Could not create objective notification record: " . $e->getMessage());
        }

        // 2. Dispatch FCM Push Notification (HTTP v1)
        try {
            $targetRecipient = !empty($delegate->fcm_token) ? $delegate->fcm_token : '/topics/sti_delegates';
            app(\App\Services\FirebaseService::class)->sendPush(
                $targetRecipient,
                $notifTitle,
                $notifBody,
                [
                    'type' => 'monthly_objective',
                    'delegate_id' => (string) $delegate->id,
                    'delegate_name' => (string) $delegate->name,
                    'year' => (string) $validated['year'],
                    'month' => (string) $validated['month'],
                    'target_revenue' => (string) $validated['target_revenue'],
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ]
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("FCM objective push failed: " . $e->getMessage());
        }

        return response()->json([
            'data' => $objective,
            'message' => 'Objectif mensuel enregistré avec succès',
        ], 200);
    }
}
