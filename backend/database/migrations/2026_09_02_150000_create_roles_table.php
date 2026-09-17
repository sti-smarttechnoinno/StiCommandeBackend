<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('has_region_restriction')->default(false);
            $table->json('permissions')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();

            $table->index('slug');
        });

        // Seed default system & standard roles
        $defaultRoles = [
            [
                'name' => 'Administrateur',
                'slug' => 'admin',
                'description' => 'Accès complet à tous les modules, données et paramètres du système.',
                'has_region_restriction' => false,
                'permissions' => json_encode([
                    'orders.view', 'orders.create', 'orders.update', 'orders.delete',
                    'clients.view', 'clients.create', 'clients.update', 'clients.delete',
                    'products.view', 'products.manage',
                    'reports.view', 'reports.export',
                    'users.manage', 'settings.manage'
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Chargé de Compte',
                'slug' => 'charge_compte',
                'description' => 'Consultation et mise à jour / validation des commandes. Consultation des fiches clients.',
                'has_region_restriction' => false,
                'permissions' => json_encode([
                    'orders.view', 'orders.update',
                    'clients.view',
                    'products.view'
                ]),
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Commercial',
                'slug' => 'commercial',
                'description' => 'Création et suivi des commandes et clients assignés exclusivement à sa région.',
                'has_region_restriction' => true,
                'permissions' => json_encode([
                    'orders.view', 'orders.create', 'orders.update',
                    'clients.view', 'clients.create', 'clients.update',
                    'products.view'
                ]),
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Magasinier / Logistique',
                'slug' => 'warehouse',
                'description' => 'Gestion de la préparation des commandes physiques et suivi des stocks.',
                'has_region_restriction' => false,
                'permissions' => json_encode([
                    'orders.view', 'orders.update',
                    'products.view'
                ]),
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Lecteur / Consultation',
                'slug' => 'viewer',
                'description' => 'Consultation en lecture seule sans droit de modification.',
                'has_region_restriction' => false,
                'permissions' => json_encode([
                    'orders.view',
                    'clients.view',
                    'products.view',
                    'reports.view'
                ]),
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('roles')->insert($defaultRoles);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
