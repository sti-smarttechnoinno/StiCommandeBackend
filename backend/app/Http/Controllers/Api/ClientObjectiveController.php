<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientObjective;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClientObjectiveController extends Controller
{
    public function index(Request $request, $client): JsonResponse
    {
        $client = $client instanceof Client ? $client : Client::findOrFail($client);

        $currentYear = (int) now()->year;
        $currentMonth = (int) now()->month;

        // Fetch all defined objectives for this client
        $objectives = ClientObjective::where('client_id', $client->id)
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

        // Gather all relevant periods
        $orderDates = Order::where(function ($q) use ($client) {
            $q->where('client_id', $client->id)
              ->orWhere('client_name', $client->name);
        })
        ->where('status', '!=', 'cancelled')
        ->pluck('created_at');

        $periods = collect();

        // Always include current month
        $periods->put("{$currentYear}-{$currentMonth}", [
            'year' => $currentYear,
            'month' => $currentMonth,
        ]);

        foreach ($objectives as $obj) {
            $periods->put("{$obj->year}-{$obj->month}", [
                'year' => (int) $obj->year,
                'month' => (int) $obj->month,
            ]);
        }

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

        $computeMonthStats = function (int $year, int $month, ?ClientObjective $obj) use ($client, $currentYear, $currentMonth, $monthNamesFr) {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

            $orders = Order::where(function ($q) use ($client) {
                $q->where('client_id', $client->id)
                  ->orWhere('client_name', $client->name);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->with(['items.product'])
            ->get();

            $achievedOrders = $orders->count();
            $achievedRevenue = 0.0;

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
            $isPast = ($year < $currentYear || ($year === $currentYear && $month < $currentMonth));
            $isUpcoming = ($year > $currentYear || ($year === $currentYear && $month > $currentMonth));

            if ($targetRevenue > 0 && $achievedRevenue >= $targetRevenue) {
                $status = 'completed'; // Atteint
            } elseif ($isCurrent) {
                $status = 'in_progress'; // En cours
            } elseif ($isUpcoming) {
                $status = 'upcoming'; // À venir
            } else {
                $status = $targetRevenue > 0 ? 'missed' : 'not_set';
            }

            return [
                'id' => $objectiveId,
                'year' => $year,
                'month' => $month,
                'monthName' => ($monthNamesFr[$month] ?? "Mois $month") . " $year",
                'targetRevenue' => $targetRevenue,
                'achievedRevenue' => round($achievedRevenue, 2),
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

        usort($archive, function ($a, $b) {
            if ($a['year'] === $b['year']) {
                return $b['month'] <=> $a['month'];
            }
            return $b['year'] <=> $a['year'];
        });

        return response()->json([
            'clientId' => (string) $client->id,
            'clientName' => $client->name,
            'currentMonth' => $currentMonthData ?? $computeMonthStats($currentYear, $currentMonth, null),
            'archive' => $archive,
            'totalObjectivesCount' => count($archive),
        ]);
    }

    public function storeOrUpdate(Request $request, $client): JsonResponse
    {
        $client = $client instanceof Client ? $client : Client::findOrFail($client);

        $input = $request->json()->all() ?: $request->all();
        if (isset($input['targetRevenue']) && !isset($input['target_revenue'])) {
            $input['target_revenue'] = $input['targetRevenue'];
        }
        if (isset($input['targetOrders']) && !isset($input['target_orders'])) {
            $input['target_orders'] = $input['targetOrders'];
        }

        $validator = Validator::make($input, [
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

        $objective = ClientObjective::updateOrCreate(
            [
                'client_id' => $client->id,
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
            'message' => 'Objectif mensuel du client enregistré avec succès',
        ], 200);
    }
}
