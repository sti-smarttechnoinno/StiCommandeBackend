<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmInteraction;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CrmInteractionController extends Controller
{
    /**
     * List interactions with scoping and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmInteraction::with(['user:id,name,role', 'client:id,name,client_code,phone,region,wilaya']);

        if ($authUser) {
            $query->forUser($authUser);
        }

        // Filter: Client
        if ($clientId = $request->query('client_id')) {
            $query->where('client_id', $clientId);
        }

        // Filter: Type
        if ($type = $request->query('type')) {
            if ($type !== 'all') {
                $query->where('type', $type);
            }
        }

        $query->orderBy('interaction_date', 'desc');

        $pageSize = (int) $request->query('pageSize', 20);
        $interactions = $query->paginate($pageSize);

        return response()->json([
            'data' => $interactions->items(),
            'total' => $interactions->total(),
            'page' => $interactions->currentPage(),
            'pageSize' => $interactions->perPage(),
            'totalPages' => $interactions->lastPage(),
        ]);
    }

    /**
     * Store a new CRM interaction (Call, WhatsApp, Email, Note, Complaint).
     */
    public function store(Request $request): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'type' => 'required|string|in:call,visit,whatsapp,email,note,complaint',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string|max:3000',
            'interaction_date' => 'nullable|date',
        ]);

        $userId = $authUser?->id;
        if (!$userId) {
            return response()->json(['message' => 'Utilisateur non identifié.'], 400);
        }

        $interaction = CrmInteraction::create([
            'client_id' => $validated['client_id'],
            'user_id' => $userId,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'notes' => $validated['notes'] ?? null,
            'interaction_date' => $validated['interaction_date'] ?? now(),
        ]);

        return response()->json([
            'message' => 'Échange enregistré avec succès.',
            'data' => $interaction->load(['user', 'client']),
        ], 201);
    }

    /**
     * Delete an interaction.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $authUser = auth('sanctum')->user() ?: $request->user();
        $query = CrmInteraction::query();
        if ($authUser) {
            $query->forUser($authUser);
        }

        $interaction = $query->find($id);
        if (!$interaction) {
            return response()->json(['message' => 'Échange introuvable.'], 404);
        }

        $interaction->delete();

        return response()->json(['message' => 'Échange supprimé avec succès.']);
    }
}
