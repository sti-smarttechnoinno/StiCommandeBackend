<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index(Request $request)
    {
        $query = Category::query();

        if ($request->has('active_only') && $request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $categories = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'icon' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'workflow_type' => 'nullable|string|in:virtual,physical',
            'requires_delivery' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name'], '_');
        $workflowType = $validated['workflow_type'] ?? 'physical';
        $requiresDelivery = $validated['requires_delivery'] ?? ($workflowType === 'physical');

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'icon' => $validated['icon'] ?? 'package',
            'description' => $validated['description'] ?? null,
            'workflow_type' => $workflowType,
            'requires_delivery' => $requiresDelivery,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Product category created successfully.',
            'data' => $category,
        ], 201);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('categories')->ignore($category->id)],
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('categories')->ignore($category->id)],
            'icon' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'workflow_type' => 'nullable|string|in:virtual,physical',
            'requires_delivery' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['name']) && !isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name'], '_');
        }

        if (isset($validated['workflow_type']) && !isset($validated['requires_delivery'])) {
            $validated['requires_delivery'] = ($validated['workflow_type'] === 'physical');
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Product category updated successfully.',
            'data' => $category,
        ]);
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json([
            'message' => 'Product category deleted successfully.',
        ]);
    }
}
