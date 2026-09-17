<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    /**
     * Display a listing of roles with user counts.
     */
    public function index(): JsonResponse
    {
        $roles = Role::orderBy('id', 'asc')->get()->map(function ($role) {
            $slug = $role->slug;
            // Count matching users in database
            $countQuery = User::query();
            if ($slug === 'admin') {
                $count = $countQuery->whereIn('role', ['admin', 'administrator'])->count();
            } elseif ($slug === 'commercial') {
                $count = $countQuery->whereIn('role', ['commercial', 'delegate'])->count();
            } elseif ($slug === 'viewer') {
                $count = $countQuery->whereIn('role', ['viewer', 'user'])->count();
            } else {
                $count = $countQuery->where('role', $slug)->count();
            }

            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'has_region_restriction' => (bool) $role->has_region_restriction,
                'permissions' => (array) ($role->permissions ?? []),
                'is_system' => (bool) $role->is_system,
                'users_count' => $count,
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return response()->json([
            'data' => $roles,
        ]);
    }

    /**
     * Return catalog of available permission modules and actions.
     */
    public function modules(): JsonResponse
    {
        $modules = [
            [
                'id' => 'orders',
                'name' => 'Commandes & Ventes',
                'description' => 'Gestion du cycle de vie des commandes et validations',
                'permissions' => [
                    ['key' => 'orders.view', 'label' => 'Consulter les commandes', 'description' => 'Accès aux listes et détails des commandes'],
                    ['key' => 'orders.create', 'label' => 'Créer des commandes', 'description' => 'Passer de nouvelles commandes pour les clients'],
                    ['key' => 'orders.update', 'label' => 'Valider & Mettre à jour les statuts', 'description' => 'Validation administrative, partiel et changement de statut'],
                    ['key' => 'orders.delete', 'label' => 'Annuler ou supprimer', 'description' => 'Rejet ou suppression de commandes'],
                ],
            ],
            [
                'id' => 'clients',
                'name' => 'Clients & Points de Vente',
                'description' => 'Portefeuille clients et points de vente partenaires',
                'permissions' => [
                    ['key' => 'clients.view', 'label' => 'Consulter les clients', 'description' => 'Voir les fiches et l\'historique des clients'],
                    ['key' => 'clients.create', 'label' => 'Créer des clients', 'description' => 'Ajouter de nouveaux points de vente'],
                    ['key' => 'clients.update', 'label' => 'Modifier les fiches clients', 'description' => 'Mise à jour des coordonnées et plafonds de crédit'],
                    ['key' => 'clients.delete', 'label' => 'Supprimer des clients', 'description' => 'Désactiver ou supprimer des comptes clients'],
                ],
            ],
            [
                'id' => 'catalog',
                'name' => 'Catalogue & Stocks',
                'description' => 'Articles, recharges, puces SIM et niveaux de stock',
                'permissions' => [
                    ['key' => 'products.view', 'label' => 'Consulter les produits et stocks', 'description' => 'Voir les prix, références et disponibilités'],
                    ['key' => 'products.manage', 'label' => 'Gérer le catalogue', 'description' => 'Ajouter ou modifier des produits, catégories et opérateurs'],
                ],
            ],
            [
                'id' => 'reports',
                'name' => 'Rapports & Statistiques',
                'description' => 'Analyses financières, chiffres d\'affaires et performances',
                'permissions' => [
                    ['key' => 'reports.view', 'label' => 'Consulter les tableaux de bord', 'description' => 'Visualiser les indicateurs clés et graphiques'],
                    ['key' => 'reports.export', 'label' => 'Exporter les rapports', 'description' => 'Téléchargement Excel, PDF et CSV'],
                ],
            ],
            [
                'id' => 'administration',
                'name' => 'Administration & Sécurité',
                'description' => 'Gestion globale de l\'ERP et des accès utilisateurs',
                'permissions' => [
                    ['key' => 'users.manage', 'label' => 'Gérer les utilisateurs', 'description' => 'Créer des comptes, réinitialiser des mots de passe'],
                    ['key' => 'settings.manage', 'label' => 'Gérer les paramètres et rôles', 'description' => 'Configuration du système, sécurité et droits d\'accès'],
                ],
            ],
        ];

        return response()->json([
            'data' => $modules,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:100|unique:roles,slug',
            'description' => 'nullable|string',
            'has_region_restriction' => 'nullable|boolean',
            'permissions' => 'nullable|array',
        ]);

        $slug = !empty($validated['slug'])
            ? Str::slug($validated['slug'], '_')
            : Str::slug($validated['name'], '_');

        // Check unique slug fallback
        $baseSlug = $slug;
        $counter = 1;
        while (Role::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}_{$counter}";
            $counter++;
        }

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'has_region_restriction' => (bool) ($validated['has_region_restriction'] ?? false),
            'permissions' => $validated['permissions'] ?? [],
            'is_system' => false,
        ]);

        return response()->json([
            'message' => "Rôle \"{$role->name}\" créé avec succès.",
            'data' => $role,
        ], 201);
    }

    /**
     * Update an existing role.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Rôle introuvable.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'has_region_restriction' => 'nullable|boolean',
            'permissions' => 'nullable|array',
        ]);

        if (isset($validated['name'])) {
            $role->name = $validated['name'];
        }
        if (array_key_exists('description', $validated)) {
            $role->description = $validated['description'];
        }
        if (array_key_exists('has_region_restriction', $validated)) {
            $role->has_region_restriction = (bool) $validated['has_region_restriction'];
        }
        if (isset($validated['permissions'])) {
            $role->permissions = $validated['permissions'];
        }

        $role->save();

        return response()->json([
            'message' => "Rôle \"{$role->name}\" mis à jour avec succès.",
            'data' => $role,
        ]);
    }

    /**
     * Remove the specified role.
     */
    public function destroy($id): JsonResponse
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Rôle introuvable.'], 404);
        }

        if ($role->is_system) {
            return response()->json(['message' => 'Ce rôle système est protégé et ne peut pas être supprimé.'], 403);
        }

        $usersCount = User::where('role', $role->slug)->count();
        if ($usersCount > 0) {
            return response()->json([
                'message' => "Impossible de supprimer ce rôle car {$usersCount} utilisateur(s) lui sont actuellement assigné(s). Veuillez d'abord réassigner ces utilisateurs.",
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Rôle supprimé avec succès.',
        ]);
    }
}
