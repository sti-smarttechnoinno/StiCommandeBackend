<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmQuote;
use App\Models\CrmQuoteItem;
use App\Models\Client;
use App\Models\CrmLead;
use App\Models\CrmOpportunity;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CrmQuoteController extends Controller
{
    /**
     * List quotes with scoping, filters, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmQuote::with([
            'client:id,client_code,name,wilaya,region,phone',
            'lead:id,name,company_name,wilaya,region,phone',
            'opportunity:id,title,stage,amount',
            'user:id,name,role,region,wilaya',
            'convertedOrder:id,order_code,status,total_amount',
        ]);

        if ($authUser) {
            $query->forUser($authUser);
        }

        // Filter: Status
        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Filter: Client
        if ($clientId = $request->query('client_id')) {
            $query->where('client_id', $clientId);
        }

        // Filter: Lead
        if ($leadId = $request->query('lead_id')) {
            $query->where('lead_id', $leadId);
        }

        // Filter: Opportunity
        if ($oppId = $request->query('opportunity_id')) {
            $query->where('opportunity_id', $oppId);
        }

        // Filter: Commercial / User
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        // Filter: Region
        if ($region = $request->query('region')) {
            if ($region !== 'all') {
                $query->where(function ($q) use ($region) {
                    $q->where('region', $region)
                      ->orWhereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
                });
            }
        }

        // Search: Code, Client name, Notes
        if ($search = $request->query('search')) {
            $searchTerm = '%' . trim($search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('quote_code', 'like', $searchTerm)
                  ->orWhere('client_name', 'like', $searchTerm)
                  ->orWhere('notes', 'like', $searchTerm);
            });
        }

        $perPage = (int) $request->query('per_page', 15);
        $quotes = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($quotes);
    }

    /**
     * Compute Quote KPIs.
     */
    public function kpis(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmQuote::query();

        if ($authUser) {
            $query->forUser($authUser);
        }

        if ($region = $request->query('region')) {
            if ($region !== 'all') {
                $query->where(function ($q) use ($region) {
                    $q->where('region', $region)
                      ->orWhereRaw('LOWER(TRIM(region)) = ?', [strtolower(trim($region))]);
                });
            }
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        $allQuotes = (clone $query)->get();

        $activeQuotes = $allQuotes->whereIn('status', ['draft', 'sent']);
        $totalActiveValue = (float) $activeQuotes->sum('total_ttc');

        $startOfMonth = Carbon::now()->startOfMonth();
        $acceptedMonth = $allQuotes->filter(function ($q) use ($startOfMonth) {
            return in_array($q->status, ['accepted', 'converted']) &&
                Carbon::parse($q->updated_at)->gte($startOfMonth);
        });

        $acceptedAmountMonth = (float) $acceptedMonth->sum('total_ttc');

        $acceptedTotal = $allQuotes->whereIn('status', ['accepted', 'converted'])->count();
        $rejectedTotal = $allQuotes->where('status', 'rejected')->count();
        $decidedTotal = $acceptedTotal + $rejectedTotal;
        $acceptanceRate = $decidedTotal > 0 ? round(($acceptedTotal / $decidedTotal) * 100, 1) : 0;

        return response()->json([
            'total_active_value' => $totalActiveValue,
            'active_quotes_count' => $activeQuotes->count(),
            'accepted_amount_month' => $acceptedAmountMonth,
            'accepted_count_month' => $acceptedMonth->count(),
            'converted_count' => $allQuotes->where('status', 'converted')->count(),
            'acceptance_rate' => $acceptanceRate,
            'total_quotes_count' => $allQuotes->count(),
        ]);
    }

    /**
     * Store new quote with line items.
     */
    public function store(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:crm_leads,id',
            'opportunity_id' => 'nullable|exists:crm_opportunities,id',
            'user_id' => 'nullable|exists:users,id',
            'client_name' => 'required|string|max:255',
            'client_phone' => 'nullable|string|max:50',
            'client_email' => 'nullable|email|max:255',
            'region' => 'required|string|max:100',
            'wilaya' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'status' => 'nullable|in:draft,sent,accepted,rejected,converted,expired',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'issue_date' => 'nullable|date',
            'valid_until' => 'nullable|date',
            'payment_terms' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.reference' => 'nullable|string|max:100',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        if (empty($validated['client_id']) && empty($validated['lead_id'])) {
            return response()->json([
                'message' => 'Le devis doit être adressé à un client ou à un prospect.',
            ], 422);
        }

        if (empty($validated['user_id']) && $authUser) {
            $validated['user_id'] = $authUser->id;
        }

        $taxPercent = (float) ($validated['tax_percent'] ?? 19.00);
        $globalDiscountPercent = (float) ($validated['discount_percent'] ?? 0);

        return DB::transaction(function () use ($validated, $taxPercent, $globalDiscountPercent) {
            $subtotalHt = 0;
            $itemsData = [];

            foreach ($validated['items'] as $it) {
                $qty = (int) $it['quantity'];
                $price = (float) $it['unit_price'];
                $itemDiscPercent = (float) ($it['discount_percent'] ?? 0);

                $lineSubtotal = $price * $qty;
                if ($itemDiscPercent > 0) {
                    $lineSubtotal -= ($lineSubtotal * $itemDiscPercent / 100);
                }

                $subtotalHt += $lineSubtotal;

                $itemsData[] = [
                    'product_id' => $it['product_id'] ?? null,
                    'product_name' => $it['product_name'],
                    'reference' => $it['reference'] ?? null,
                    'unit_price' => $price,
                    'quantity' => $qty,
                    'discount_percent' => $itemDiscPercent,
                    'subtotal' => round($lineSubtotal, 2),
                ];
            }

            $discountAmount = 0;
            if ($globalDiscountPercent > 0) {
                $discountAmount = round($subtotalHt * $globalDiscountPercent / 100, 2);
            }

            $taxableBase = max(0, $subtotalHt - $discountAmount);
            $taxAmount = round($taxableBase * $taxPercent / 100, 2);
            $totalTtc = round($taxableBase + $taxAmount, 2);

            $quote = CrmQuote::create([
                'client_id' => $validated['client_id'] ?? null,
                'lead_id' => $validated['lead_id'] ?? null,
                'opportunity_id' => $validated['opportunity_id'] ?? null,
                'user_id' => $validated['user_id'] ?? null,
                'client_name' => $validated['client_name'],
                'client_phone' => $validated['client_phone'] ?? null,
                'client_email' => $validated['client_email'] ?? null,
                'region' => $validated['region'],
                'wilaya' => $validated['wilaya'] ?? null,
                'address' => $validated['address'] ?? null,
                'status' => $validated['status'] ?? 'draft',
                'subtotal_ht' => $subtotalHt,
                'discount_percent' => $globalDiscountPercent,
                'discount_amount' => $discountAmount,
                'tax_percent' => $taxPercent,
                'tax_amount' => $taxAmount,
                'total_ttc' => $totalTtc,
                'issue_date' => $validated['issue_date'] ?? now()->toDateString(),
                'valid_until' => $validated['valid_until'] ?? now()->addDays(30)->toDateString(),
                'payment_terms' => $validated['payment_terms'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $quote->items()->createMany($itemsData);

            // Synchronize Opportunity amount & stage if linked
            if (!empty($validated['opportunity_id'])) {
                $opp = CrmOpportunity::find($validated['opportunity_id']);
                if ($opp) {
                    $updateOpp = ['amount' => $totalTtc];
                    if ($opp->stage === 'qualification') {
                        $updateOpp['stage'] = 'proposal';
                        $updateOpp['probability'] = 50;
                    }
                    $opp->update($updateOpp);
                }
            }

            $quote->load([
                'items.product',
                'client:id,client_code,name,wilaya,region,phone',
                'lead:id,name,company_name,wilaya,region,phone',
                'opportunity:id,title,stage,amount',
                'user:id,name,role',
            ]);

            return response()->json([
                'message' => 'Devis créé avec succès.',
                'quote' => $quote,
            ], 201);
        });
    }

    /**
     * Show single quote.
     */
    public function show(int $id): JsonResponse
    {
        $quote = CrmQuote::with([
            'items.product',
            'client',
            'lead',
            'opportunity',
            'user:id,name,role,region,wilaya',
            'convertedOrder',
        ])->findOrFail($id);

        return response()->json($quote);
    }

    /**
     * Update existing quote.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $quote = CrmQuote::findOrFail($id);

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'lead_id' => 'nullable|exists:crm_leads,id',
            'opportunity_id' => 'nullable|exists:crm_opportunities,id',
            'user_id' => 'nullable|exists:users,id',
            'client_name' => 'sometimes|required|string|max:255',
            'client_phone' => 'nullable|string|max:50',
            'client_email' => 'nullable|email|max:255',
            'region' => 'sometimes|required|string|max:100',
            'wilaya' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'status' => 'sometimes|in:draft,sent,accepted,rejected,converted,expired',
            'tax_percent' => 'nullable|numeric|min:0|max:100',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'issue_date' => 'nullable|date',
            'valid_until' => 'nullable|date',
            'payment_terms' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.product_name' => 'required|string|max:255',
            'items.*.reference' => 'nullable|string|max:100',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        return DB::transaction(function () use ($quote, $validated) {
            $taxPercent = isset($validated['tax_percent']) ? (float)$validated['tax_percent'] : $quote->tax_percent;
            $globalDiscountPercent = isset($validated['discount_percent']) ? (float)$validated['discount_percent'] : $quote->discount_percent;

            if (isset($validated['items'])) {
                // Delete old items and re-create
                $quote->items()->delete();

                $subtotalHt = 0;
                $itemsData = [];

                foreach ($validated['items'] as $it) {
                    $qty = (int) $it['quantity'];
                    $price = (float) $it['unit_price'];
                    $itemDiscPercent = (float) ($it['discount_percent'] ?? 0);

                    $lineSubtotal = $price * $qty;
                    if ($itemDiscPercent > 0) {
                        $lineSubtotal -= ($lineSubtotal * $itemDiscPercent / 100);
                    }

                    $subtotalHt += $lineSubtotal;

                    $itemsData[] = [
                        'product_id' => $it['product_id'] ?? null,
                        'product_name' => $it['product_name'],
                        'reference' => $it['reference'] ?? null,
                        'unit_price' => $price,
                        'quantity' => $qty,
                        'discount_percent' => $itemDiscPercent,
                        'subtotal' => round($lineSubtotal, 2),
                    ];
                }

                $discountAmount = 0;
                if ($globalDiscountPercent > 0) {
                    $discountAmount = round($subtotalHt * $globalDiscountPercent / 100, 2);
                }

                $taxableBase = max(0, $subtotalHt - $discountAmount);
                $taxAmount = round($taxableBase * $taxPercent / 100, 2);
                $totalTtc = round($taxableBase + $taxAmount, 2);

                $validated['subtotal_ht'] = $subtotalHt;
                $validated['discount_amount'] = $discountAmount;
                $validated['tax_amount'] = $taxAmount;
                $validated['total_ttc'] = $totalTtc;

                $quote->items()->createMany($itemsData);
            }

            unset($validated['items']);
            $quote->update($validated);

            // Sync with Opportunity if linked
            if ($quote->opportunity_id && $quote->opportunity) {
                $quote->opportunity->update(['amount' => $quote->total_ttc]);
            }

            $quote->load([
                'items.product',
                'client:id,client_code,name,wilaya,region,phone',
                'lead:id,name,company_name,wilaya,region,phone',
                'opportunity:id,title,stage,amount',
                'user:id,name,role',
            ]);

            return response()->json([
                'message' => 'Devis mis à jour avec succès.',
                'quote' => $quote,
            ]);
        });
    }

    /**
     * Quick status update for quote.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $quote = CrmQuote::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:draft,sent,accepted,rejected,converted,expired',
        ]);

        $newStatus = $validated['status'];
        $quote->update(['status' => $newStatus]);

        // Link with Opportunity stage
        if ($quote->opportunity_id && $quote->opportunity) {
            $opp = $quote->opportunity;
            if ($newStatus === 'accepted') {
                $opp->update([
                    'stage' => 'negotiation',
                    'probability' => 80,
                ]);
            } elseif ($newStatus === 'rejected') {
                $opp->update([
                    'stage' => 'lost',
                    'probability' => 0,
                    'lost_reason' => 'Devis ' . $quote->quote_code . ' refusé par le client.',
                    'closed_at' => now(),
                ]);
            } elseif ($newStatus === 'sent') {
                $opp->update([
                    'stage' => 'proposal',
                    'probability' => 50,
                ]);
            }
        }

        return response()->json([
            'message' => 'Statut du devis mis à jour avec succès.',
            'quote' => $quote->fresh(['client', 'lead', 'opportunity', 'items']),
        ]);
    }

    /**
     * Convert quote into an active Order.
     */
    public function convertToOrder(Request $request, int $id): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $quote = CrmQuote::with(['items', 'lead', 'opportunity'])->findOrFail($id);

        if ($quote->status === 'converted' && $quote->converted_order_id) {
            return response()->json([
                'message' => 'Ce devis a déjà été converti en commande.',
                'order_id' => $quote->converted_order_id,
            ], 422);
        }

        $order = $quote->convertToOrder($authUser);

        return response()->json([
            'message' => 'Devis converti en commande avec succès.',
            'order' => $order->load(['items']),
            'quote' => $quote->fresh(['client', 'convertedOrder']),
        ]);
    }

    /**
     * Delete quote.
     */
    public function destroy(int $id): JsonResponse
    {
        $quote = CrmQuote::findOrFail($id);
        $quote->delete();

        return response()->json([
            'message' => 'Devis supprimé avec succès.',
        ]);
    }
}
