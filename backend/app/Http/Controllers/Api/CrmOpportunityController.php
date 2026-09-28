<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmOpportunity;
use App\Models\Client;
use App\Models\CrmLead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CrmOpportunityController extends Controller
{
    /**
     * List opportunities with scoping, filters, and optional Kanban grouping.
     */
    public function index(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmOpportunity::with([
            'client:id,client_code,name,wilaya,region,phone',
            'lead:id,name,company_name,wilaya,region,phone',
            'user:id,name,role,region,wilaya',
            'convertedOrder:id,order_code,status,total_amount',
        ]);

        if ($authUser) {
            $query->forUser($authUser);
        }

        // Filter: Stage
        if ($stage = $request->query('stage')) {
            if ($stage !== 'all') {
                $query->where('stage', $stage);
            }
        }

        // Filter: Priority
        if ($priority = $request->query('priority')) {
            if ($priority !== 'all') {
                $query->where('priority', $priority);
            }
        }

        // Filter: Commercial / User
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        // Filter: Client
        if ($clientId = $request->query('client_id')) {
            $query->where('client_id', $clientId);
        }

        // Filter: Lead
        if ($leadId = $request->query('lead_id')) {
            $query->where('lead_id', $leadId);
        }

        // Filter: Region (via client or lead)
        if ($region = $request->query('region')) {
            if ($region !== 'all') {
                $query->where(function ($q) use ($region) {
                    $q->whereHas('client', function ($cq) use ($region) {
                        $cq->where('region', $region)
                           ->orWhereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
                    })->orWhereHas('lead', function ($lq) use ($region) {
                        $lq->where('region', $region)
                           ->orWhereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
                    });
                });
            }
        }

        // Search: Title, Client name, Lead company
        if ($search = $request->query('search')) {
            $searchTerm = '%' . trim($search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', $searchTerm)
                  ->orWhereHas('client', function ($cq) use ($searchTerm) {
                      $cq->where('name', 'like', $searchTerm);
                  })
                  ->orWhereHas('lead', function ($lq) use ($searchTerm) {
                      $lq->where('company_name', 'like', $searchTerm)
                         ->orWhere('name', 'like', $searchTerm);
                  });
            });
        }

        // If requesting Kanban grouped format
        if ($request->boolean('grouped', true)) {
            $all = $query->orderBy('created_at', 'desc')->get();

            $grouped = [
                'qualification' => [],
                'proposal' => [],
                'negotiation' => [],
                'won' => [],
                'lost' => [],
            ];

            foreach ($all as $opp) {
                $st = $opp->stage;
                if (isset($grouped[$st])) {
                    $grouped[$st][] = $opp;
                }
            }

            return response()->json([
                'columns' => $grouped,
                'total' => $all->count(),
            ]);
        }

        $perPage = (int) $request->query('per_page', 20);
        $opportunities = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($opportunities);
    }

    /**
     * Compute Kanban & Pipeline KPIs.
     */
    public function kpis(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmOpportunity::query();

        if ($authUser) {
            $query->forUser($authUser);
        }

        if ($region = $request->query('region')) {
            if ($region !== 'all') {
                $query->where(function ($q) use ($region) {
                    $q->whereHas('client', function ($cq) use ($region) {
                        $cq->where('region', $region)
                           ->orWhereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
                    })->orWhereHas('lead', function ($lq) use ($region) {
                        $lq->where('region', $region)
                           ->orWhereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
                    });
                });
            }
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        $allDeals = (clone $query)->get();

        $activeStages = ['qualification', 'proposal', 'negotiation'];
        $activeDeals = $allDeals->whereIn('stage', $activeStages);

        $totalActiveValue = (float) $activeDeals->sum('amount');
        $weightedPipelineValue = (float) $activeDeals->reduce(function ($carry, $deal) {
            return $carry + (($deal->amount * ($deal->probability ?? 0)) / 100);
        }, 0);

        $startOfMonth = Carbon::now()->startOfMonth();
        $wonThisMonth = $allDeals->filter(function ($deal) use ($startOfMonth) {
            return $deal->stage === 'won' && $deal->closed_at && Carbon::parse($deal->closed_at)->gte($startOfMonth);
        });
        $wonAmountMonth = (float) $wonThisMonth->sum('amount');

        $wonCount = $allDeals->where('stage', 'won')->count();
        $lostCount = $allDeals->where('stage', 'lost')->count();
        $closedTotal = $wonCount + $lostCount;
        $winRate = $closedTotal > 0 ? round(($wonCount / $closedTotal) * 100, 1) : 0;

        return response()->json([
            'total_active_value' => $totalActiveValue,
            'weighted_pipeline_value' => round($weightedPipelineValue, 2),
            'won_amount_month' => $wonAmountMonth,
            'won_count_month' => $wonThisMonth->count(),
            'win_rate' => $winRate,
            'active_deals_count' => $activeDeals->count(),
            'total_deals_count' => $allDeals->count(),
        ]);
    }

    /**
     * Store new opportunity.
     */
    public function store(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:crm_leads,id',
            'user_id' => 'nullable|exists:users,id',
            'amount' => 'required|numeric|min:0',
            'stage' => 'nullable|in:qualification,proposal,negotiation,won,lost',
            'probability' => 'nullable|integer|min:0|max:100',
            'priority' => 'nullable|in:low,medium,high',
            'expected_closing_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['client_id']) && empty($validated['lead_id'])) {
            return response()->json([
                'message' => 'L’opportunité doit être rattachée à un client existant ou à un prospect.',
            ], 422);
        }

        if (empty($validated['user_id']) && $authUser) {
            $validated['user_id'] = $authUser->id;
        }

        $stage = $validated['stage'] ?? 'qualification';
        $validated['stage'] = $stage;

        if (!isset($validated['probability'])) {
            $validated['probability'] = match ($stage) {
                'qualification' => 20,
                'proposal' => 50,
                'negotiation' => 80,
                'won' => 100,
                'lost' => 0,
                default => 20,
            };
        }

        if ($stage === 'won' || $stage === 'lost') {
            $validated['closed_at'] = now();
        }

        $opportunity = CrmOpportunity::create($validated);
        $opportunity->load([
            'client:id,client_code,name,wilaya,region,phone',
            'lead:id,name,company_name,wilaya,region,phone',
            'user:id,name,role',
        ]);

        return response()->json([
            'message' => 'Opportunité créée avec succès.',
            'opportunity' => $opportunity,
        ], 201);
    }

    /**
     * Show single opportunity.
     */
    public function show(int $id): JsonResponse
    {
        $opportunity = CrmOpportunity::with([
            'client',
            'lead',
            'user:id,name,role,region,wilaya',
            'convertedOrder',
        ])->findOrFail($id);

        return response()->json($opportunity);
    }

    /**
     * Update details of an opportunity.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $opportunity = CrmOpportunity::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:crm_leads,id',
            'user_id' => 'nullable|exists:users,id',
            'amount' => 'sometimes|required|numeric|min:0',
            'stage' => 'sometimes|in:qualification,proposal,negotiation,won,lost',
            'probability' => 'nullable|integer|min:0|max:100',
            'priority' => 'sometimes|in:low,medium,high',
            'expected_closing_date' => 'nullable|date',
            'lost_reason' => 'nullable|string',
            'converted_order_id' => 'nullable|uuid',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['stage']) && $validated['stage'] !== $opportunity->stage) {
            if ($validated['stage'] === 'won' || $validated['stage'] === 'lost') {
                $validated['closed_at'] = now();
            } else {
                $validated['closed_at'] = null;
            }
        }

        $opportunity->update($validated);
        $opportunity->load([
            'client:id,client_code,name,wilaya,region,phone',
            'lead:id,name,company_name,wilaya,region,phone',
            'user:id,name,role',
            'convertedOrder',
        ]);

        return response()->json([
            'message' => 'Opportunité mise à jour avec succès.',
            'opportunity' => $opportunity,
        ]);
    }

    /**
     * Quick stage update (Drag and Drop in Kanban).
     */
    public function updateStage(Request $request, int $id): JsonResponse
    {
        $opportunity = CrmOpportunity::findOrFail($id);

        $validated = $request->validate([
            'stage' => 'required|in:qualification,proposal,negotiation,won,lost',
            'lost_reason' => 'nullable|string|max:255',
            'converted_order_id' => 'nullable|uuid',
        ]);

        $stage = $validated['stage'];
        $updateData = ['stage' => $stage];

        if ($stage === 'lost') {
            $updateData['lost_reason'] = $validated['lost_reason'] ?? null;
            $updateData['probability'] = 0;
            $updateData['closed_at'] = now();
        } elseif ($stage === 'won') {
            $updateData['probability'] = 100;
            $updateData['closed_at'] = now();
            if (!empty($validated['converted_order_id'])) {
                $updateData['converted_order_id'] = $validated['converted_order_id'];
            }
        } else {
            $updateData['probability'] = match ($stage) {
                'qualification' => 20,
                'proposal' => 50,
                'negotiation' => 80,
                default => 20,
            };
            $updateData['closed_at'] = null;
            $updateData['lost_reason'] = null;
        }

        $opportunity->update($updateData);
        $opportunity->load([
            'client:id,client_code,name,wilaya,region,phone',
            'lead:id,name,company_name,wilaya,region,phone',
            'user:id,name,role',
        ]);

        return response()->json([
            'message' => 'Étape mise à jour avec succès.',
            'opportunity' => $opportunity,
        ]);
    }

    /**
     * Delete opportunity.
     */
    public function destroy(int $id): JsonResponse
    {
        $opportunity = CrmOpportunity::findOrFail($id);
        $opportunity->delete();

        return response()->json([
            'message' => 'Opportunité supprimée avec succès.',
        ]);
    }
}
