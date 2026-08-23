<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Operator;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OperatorController extends Controller
{
    /**
     * Display a listing of operators.
     */
    public function index(Request $request)
    {
        $query = Operator::query();

        if ($request->has('active_only') && $request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $operators = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'data' => $operators,
        ]);
    }

    /**
     * Store a newly created operator in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:operators,name',
            'code' => 'required|string|max:50|unique:operators,code',
            'color' => 'nullable|string|max:50',
            'logo_url' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $operator = Operator::create([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'color' => $validated['color'] ?? '#10b981',
            'logo_url' => $validated['logo_url'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Telecom operator created successfully.',
            'data' => $operator,
        ], 201);
    }

    /**
     * Update the specified operator in storage.
     */
    public function update(Request $request, Operator $operator)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('operators')->ignore($operator->id)],
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('operators')->ignore($operator->id)],
            'color' => 'nullable|string|max:50',
            'logo_url' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $operator->update($validated);

        return response()->json([
            'message' => 'Telecom operator updated successfully.',
            'data' => $operator,
        ]);
    }

    /**
     * Remove the specified operator from storage.
     */
    public function destroy(Operator $operator)
    {
        $operator->delete();

        return response()->json([
            'message' => 'Telecom operator deleted successfully.',
        ]);
    }
}
