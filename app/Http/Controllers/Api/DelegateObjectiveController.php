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

        // Check if current month objective exists, if not construct a virtual one
        $hasCurrentMonth = $objectives->contains(function ($obj) use ($currentYear, $currentMonth) {
            return $obj->year === $currentYear && $obj->month === $currentMonth;
        });

        $monthNamesFr = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
        ];

        $computeMonthStats = function (int $year, int $month, ?DelegateObjective $obj) use ($delegate, $currentYear, $currentMonth, $monthNamesFr) {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

            $ordersQuery = Order::where(function ($q) use ($delegate) {
                $q->where('delegate_id', $delegate->id)
                  ->orWhere('delegate_name', $delegate->name);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled');

            $achievedRevenue = (float) (clone $ordersQuery)->sum('total_amount');
            $achievedOrders = (int) (clone $ordersQuery)->count();

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
            $isPast = ($year < $currentYear || ($year === $currentYear && $month < $currentMonth));
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
                'achievedRevenue' => $achievedRevenue,
                'remainingRevenue' => max(0, $targetRevenue - $achievedRevenue),
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

        // If current month is not in DB, compute default view
        if (!$hasCurrentMonth) {
            $currentMonthData = $computeMonthStats($currentYear, $currentMonth, null);
            $archive[] = $currentMonthData;
        }

        foreach ($objectives as $obj) {
            $stats = $computeMonthStats($obj->year, $obj->month, $obj);
            if ($obj->year === $currentYear && $obj->month === $currentMonth) {
                $currentMonthData = $stats;
            }
            $archive[] = $stats;
        }

        // Sort archive by year desc, month desc
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
            'totalObjectivesCount' => count($objectives),
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

        return response()->json([
            'data' => $objective,
            'message' => 'Objectif mensuel enregistré avec succès',
        ], 200);
    }
}
