<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmLead;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CrmLeadController extends Controller
{
    /**
     * List leads with scoping, search, filters, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmLead::with(['user:id,name,role,region,wilaya', 'convertedClient:id,client_code,name,status']);

        if ($authUser) {
            $query->forUser($authUser);
        }

        // Filter: Status
        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Filter: Source
        if ($source = $request->query('source')) {
            if ($source !== 'all') {
                $query->where('source', $source);
            }
        }

        // Filter: User / Commercial
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

        // Search: Name, Company, Phone
        if ($search = $request->query('search')) {
            $searchTerm = '%' . trim($search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('company_name', 'like', $searchTerm)
                  ->orWhere('phone', 'like', $searchTerm)
                  ->orWhere('email', 'like', $searchTerm)
                  ->orWhere('wilaya', 'like', $searchTerm);
            });
        }

        $perPage = (int) $request->query('per_page', 15);
        $leads = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($leads);
    }

    /**
     * Create a new lead (prospect).
     */
    public function store(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'region' => 'required|string|max:100',
            'wilaya' => 'required|string|max:100',
            'user_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:new,contacted,qualified,converted,lost',
            'source' => 'nullable|in:field_prospection,inbound_call,recommendation,event,other',
            'estimated_budget' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['user_id']) && $authUser) {
            $validated['user_id'] = $authUser->id;
        }

        if (empty($validated['status'])) {
            $validated['status'] = 'new';
        }

        if (empty($validated['source'])) {
            $validated['source'] = 'field_prospection';
        }

        $lead = CrmLead::create($validated);
        $lead->load(['user:id,name,role,region,wilaya']);

        return response()->json([
            'message' => 'Prospect créé avec succès.',
            'lead' => $lead,
        ], 201);
    }

    /**
     * Show a lead.
     */
    public function show(int $id): JsonResponse
    {
        $lead = CrmLead::with(['user:id,name,role,region,wilaya', 'convertedClient', 'opportunities'])
            ->findOrFail($id);

        return response()->json($lead);
    }

    /**
     * Update lead details.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $lead = CrmLead::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'company_name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'region' => 'sometimes|required|string|max:100',
            'wilaya' => 'sometimes|required|string|max:100',
            'user_id' => 'nullable|exists:users,id',
            'status' => 'sometimes|in:new,contacted,qualified,converted,lost',
            'source' => 'sometimes|in:field_prospection,inbound_call,recommendation,event,other',
            'estimated_budget' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $lead->update($validated);
        $lead->load(['user:id,name,role,region,wilaya', 'convertedClient']);

        return response()->json([
            'message' => 'Prospect mis à jour avec succès.',
            'lead' => $lead,
        ]);
    }

    /**
     * Convert lead into an active Client.
     */
    public function convert(Request $request, int $id): JsonResponse
    {
        $lead = CrmLead::findOrFail($id);

        if ($lead->status === 'converted' && $lead->converted_client_id) {
            return response()->json([
                'message' => 'Ce prospect a déjà été converti en client.',
                'client_id' => $lead->converted_client_id,
            ], 422);
        }

        $validated = $request->validate([
            'client_code' => 'nullable|string|unique:clients,client_code',
            'client_type' => 'nullable|in:retail,wholesale,corporate,government',
            'delegate_id' => 'nullable|exists:users,id',
            'notes' => 'nullable|string',
        ]);

        $client = $lead->convertToClient($validated);

        return response()->json([
            'message' => 'Prospect converti en client avec succès.',
            'client' => $client,
            'lead' => $lead->fresh(['convertedClient']),
        ]);
    }

    /**
     * Delete lead.
     */
    public function destroy(int $id): JsonResponse
    {
        $lead = CrmLead::findOrFail($id);
        $lead->delete();

        return response()->json([
            'message' => 'Prospect supprimé avec succès.',
        ]);
    }
}
