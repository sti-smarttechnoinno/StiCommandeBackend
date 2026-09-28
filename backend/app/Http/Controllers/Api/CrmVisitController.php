<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmVisit;
use App\Models\CrmInteraction;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CrmVisitController extends Controller
{
    /**
     * List visits with scoping, filters, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmVisit::with(['client', 'user:id,name,role,region,wilaya', 'resultingOrder:id,order_code,total_amount,status']);

        if ($authUser) {
            $query->forUser($authUser);
        }

        // Filter: Client
        if ($clientId = $request->query('client_id')) {
            $query->where('client_id', $clientId);
        }

        // Filter: Commercial / User
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        // Filter: Status
        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Filter: Purpose
        if ($purpose = $request->query('purpose')) {
            if ($purpose !== 'all') {
                $query->where('purpose', $purpose);
            }
        }

        // Filter: Region
        if ($region = $request->query('region')) {
            if ($region !== 'all') {
                $query->whereHas('client', function ($q) use ($region) {
                    $q->where('region', $region)
                      ->orWhereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
                });
            }
        }

        // Filter: Date Range / Period
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('planned_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('planned_at', '<=', $dateTo);
        }

        // Today only shortcut
        if ($request->boolean('today_only')) {
            $query->whereDate('planned_at', now()->toDateString());
        }

        // Search term
        if ($search = $request->query('search')) {
            $s = strtolower(trim($search));
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(summary) LIKE ?', ["%{$s}%"])
                  ->orWhereHas('client', function ($cq) use ($s) {
                      $cq->whereRaw('LOWER(name) LIKE ?', ["%{$s}%"])
                         ->orWhereRaw('LOWER(client_code) LIKE ?', ["%{$s}%"])
                         ->orWhereRaw('LOWER(phone) LIKE ?', ["%{$s}%"]);
                  })
                  ->orWhereHas('user', function ($uq) use ($s) {
                      $uq->whereRaw('LOWER(name) LIKE ?', ["%{$s}%"]);
                  });
            });
        }

        $sortField = $request->query('sortField', 'planned_at');
        $sortDirection = strtolower($request->query('sortDirection', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortField, $sortDirection);

        $pageSize = (int) $request->query('pageSize', 15);
        $visits = $query->paginate($pageSize);

        return response()->json([
            'data' => $visits->items(),
            'total' => $visits->total(),
            'page' => $visits->currentPage(),
            'pageSize' => $visits->perPage(),
            'totalPages' => $visits->lastPage(),
        ]);
    }

    /**
     * Get KPI summary analytics for CRM visits.
     */
    public function kpis(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $baseQuery = CrmVisit::query();

        if ($authUser) {
            $baseQuery->forUser($authUser);
        }

        if ($region = $request->query('region')) {
            if ($region !== 'all') {
                $baseQuery->whereHas('client', function ($q) use ($region) {
                    $q->where('region', $region)
                      ->orWhereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
                });
            }
        }

        $today = now()->toDateString();
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $todayPlanned = (clone $baseQuery)->whereDate('planned_at', $today)->count();
        $todayCompleted = (clone $baseQuery)->whereDate('completed_at', $today)->count();

        $monthPlanned = (clone $baseQuery)->whereBetween('planned_at', [$startOfMonth, $endOfMonth])->count();
        $monthCompleted = (clone $baseQuery)->where('status', 'completed')
            ->whereBetween('completed_at', [$startOfMonth, $endOfMonth])->count();

        $completionRate = $monthPlanned > 0 ? round(($monthCompleted / $monthPlanned) * 100, 1) : 0.0;

        // Breakdown by purpose
        $purposes = ['order_taking', 'prospecting', 'debt_collection', 'relationship', 'claim'];
        $purposeStats = [];
        foreach ($purposes as $p) {
            $purposeStats[$p] = (clone $baseQuery)->where('purpose', $p)->count();
        }

        return response()->json([
            'todayPlanned' => $todayPlanned,
            'todayCompleted' => $todayCompleted,
            'monthPlanned' => $monthPlanned,
            'monthCompleted' => $monthCompleted,
            'completionRate' => $completionRate,
            'purposeStats' => $purposeStats,
        ]);
    }

    /**
     * Plan a new CRM visit.
     */
    public function store(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'user_id' => 'nullable|exists:users,id',
            'planned_at' => 'required|date',
            'purpose' => 'required|string|in:order_taking,prospecting,debt_collection,relationship,claim',
            'summary' => 'nullable|string|max:2000',
        ]);

        $userId = $validated['user_id'] ?? $authUser?->id;
        if (!$userId) {
            return response()->json(['message' => 'Utilisateur non identifié.'], 400);
        }

        $visit = CrmVisit::create([
            'client_id' => $validated['client_id'],
            'user_id' => $userId,
            'planned_at' => $validated['planned_at'],
            'status' => 'planned',
            'purpose' => $validated['purpose'],
            'summary' => $validated['summary'] ?? null,
        ]);

        // Automatically log timeline interaction
        CrmInteraction::create([
            'client_id' => $visit->client_id,
            'user_id' => $visit->user_id,
            'type' => 'visit',
            'title' => 'Visite planifiée',
            'notes' => "Visite prévue le " . Carbon::parse($visit->planned_at)->format('d/m/Y H:i') . ($visit->summary ? " — " . $visit->summary : ""),
            'interaction_date' => $visit->planned_at,
            'crm_visit_id' => $visit->id,
        ]);

        return response()->json([
            'message' => 'Visite planifiée avec succès.',
            'data' => $visit->load(['client', 'user']),
        ], 201);
    }

    /**
     * Show visit details.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmVisit::with(['client', 'user', 'resultingOrder', 'interactions']);

        if ($authUser) {
            $query->forUser($authUser);
        }

        $visit = $query->find($id);
        if (!$visit) {
            return response()->json(['message' => 'Visite introuvable ou accès refusé.'], 404);
        }

        return response()->json(['data' => $visit]);
    }

    /**
     * Update visit planning info.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmVisit::query();
        if ($authUser) {
            $query->forUser($authUser);
        }
        $visit = $query->find($id);

        if (!$visit) {
            return response()->json(['message' => 'Visite introuvable.'], 404);
        }

        $validated = $request->validate([
            'planned_at' => 'sometimes|date',
            'purpose' => 'sometimes|string|in:order_taking,prospecting,debt_collection,relationship,claim',
            'status' => 'sometimes|string|in:planned,completed,cancelled,missed',
            'summary' => 'nullable|string|max:2000',
        ]);

        $visit->update($validated);

        return response()->json([
            'message' => 'Visite mise à jour.',
            'data' => $visit->fresh(['client', 'user']),
        ]);
    }

    /**
     * Complete a visit with report, GPS check-in, and optional resulting order.
     */
    public function complete(Request $request, $id): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmVisit::query();
        if ($authUser) {
            $query->forUser($authUser);
        }
        $visit = $query->find($id);

        if (!$visit) {
            return response()->json(['message' => 'Visite introuvable.'], 404);
        }

        $validated = $request->validate([
            'summary' => 'required|string|min:3|max:3000',
            'checkin_latitude' => 'nullable|numeric|between:-90,90',
            'checkin_longitude' => 'nullable|numeric|between:-180,180',
            'checkin_address' => 'nullable|string|max:255',
            'resulting_order_id' => 'nullable|string|exists:orders,id',
        ]);

        $visit->update([
            'status' => 'completed',
            'completed_at' => now(),
            'summary' => $validated['summary'],
            'checkin_latitude' => $validated['checkin_latitude'] ?? $visit->checkin_latitude,
            'checkin_longitude' => $validated['checkin_longitude'] ?? $visit->checkin_longitude,
            'checkin_address' => $validated['checkin_address'] ?? $visit->checkin_address,
            'resulting_order_id' => $validated['resulting_order_id'] ?? $visit->resulting_order_id,
        ]);

        // Add completed visit note to timeline
        CrmInteraction::create([
            'client_id' => $visit->client_id,
            'user_id' => $visit->user_id,
            'type' => 'visit',
            'title' => 'Visite réalisée (Compte-rendu)',
            'notes' => $visit->summary . ($visit->checkin_latitude ? " [Check-in GPS: {$visit->checkin_latitude}, {$visit->checkin_longitude}]" : ""),
            'interaction_date' => now(),
            'crm_visit_id' => $visit->id,
        ]);

        return response()->json([
            'message' => 'Compte-rendu de visite enregistré avec succès.',
            'data' => $visit->fresh(['client', 'user', 'resultingOrder']),
        ]);
    }

    /**
     * Delete / Cancel a visit.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmVisit::query();
        if ($authUser) {
            $query->forUser($authUser);
        }
        $visit = $query->find($id);

        if (!$visit) {
            return response()->json(['message' => 'Visite introuvable.'], 404);
        }

        $visit->delete();

        return response()->json(['message' => 'Visite supprimée avec succès.']);
    }
}
