<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::query();

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($search = $request->input('search')) {
            $q = strtolower($search);
            $query->where(function ($sub) use ($q) {
                $sub->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(code) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(wilaya) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(region) LIKE ?', ["%{$q}%"]);
            });
        }

        $warehouses = $query->orderByDesc('is_default')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $warehouses,
            'total' => $warehouses->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:50|unique:warehouses,code',
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'wilaya' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:100',
            'capacity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'is_default' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['code'])) {
            $count = Warehouse::count() + 1;
            $validated['code'] = 'DEP-' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);
        }

        $isDefault = (bool) ($validated['is_default'] ?? false);

        if ($isDefault) {
            Warehouse::where('is_default', true)->update(['is_default' => false]);
        } elseif (Warehouse::count() === 0) {
            $validated['is_default'] = true;
        }

        $warehouse = Warehouse::create($validated);

        return response()->json([
            'message' => 'Dépôt créé avec succès',
            'data' => $warehouse,
        ], 201);
    }

    public function show(Warehouse $warehouse): JsonResponse
    {
        return response()->json([
            'data' => $warehouse,
        ]);
    }

    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:50|unique:warehouses,code,' . $warehouse->id,
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'wilaya' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:100',
            'capacity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'is_default' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        if (! empty($validated['is_default']) && $validated['is_default'] == true) {
            Warehouse::where('id', '!=', $warehouse->id)->update(['is_default' => false]);
        }

        $warehouse->update($validated);

        return response()->json([
            'message' => 'Dépôt mis à jour avec succès',
            'data' => $warehouse,
        ]);
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $wasDefault = $warehouse->is_default;
        $warehouse->delete();

        if ($wasDefault) {
            $first = Warehouse::first();
            if ($first) {
                $first->update(['is_default' => true]);
            }
        }

        return response()->json([
            'message' => 'Dépôt supprimé avec succès',
        ]);
    }

    public function setDefault(Warehouse $warehouse): JsonResponse
    {
        Warehouse::where('id', '!=', $warehouse->id)->update(['is_default' => false]);
        $warehouse->update([
            'is_default' => true,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Dépôt défini comme principal par défaut',
            'data' => $warehouse,
        ]);
    }
}
