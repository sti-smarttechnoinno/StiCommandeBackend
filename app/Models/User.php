<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string $username
 * @property string|null $email
 * @property string|null $phone
 * @property string $role
 * @property bool $is_active
 * @property Carbon|null $last_login_at
 * @property Carbon|null $last_seen_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['employee_id', 'name', 'username', 'email', 'phone', 'password', 'role', 'is_active', 'region', 'wilaya', 'department', 'status', 'two_factor_enabled', 'fcm_token', 'locale', 'last_login_at', 'last_seen_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'last_login_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOnline(): bool
    {
        return $this->last_seen_at && $this->last_seen_at->gt(now()->subSeconds(90));
    }

    public function clients()
    {
        return $this->hasMany(Client::class, 'delegate_id');
    }

    public function objectives()
    {
        return $this->hasMany(DelegateObjective::class, 'user_id');
    }

    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role', 'slug');
    }

    public function getEffectivePermissions(): array
    {
        if ($this->isAdmin()) {
            return [
                'orders.view', 'orders.create', 'orders.update', 'orders.delete',
                'clients.view', 'clients.create', 'clients.update', 'clients.delete',
                'products.view', 'products.manage',
                'reports.view', 'reports.export',
                'users.manage', 'settings.manage', '*'
            ];
        }

        $role = $this->roleModel;
        if ($role && is_array($role->permissions)) {
            return $role->permissions;
        }

        // Fallbacks for standard legacy roles if not configured in table
        if ($this->role === 'commercial' || $this->role === 'delegate') {
            return [
                'orders.view', 'orders.create', 'orders.update',
                'clients.view', 'clients.create', 'clients.update',
                'products.view'
            ];
        }

        if ($this->role === 'charge_compte') {
            return [
                'orders.view', 'orders.update',
                'clients.view',
                'products.view'
            ];
        }

        if ($this->role === 'warehouse') {
            return [
                'orders.view', 'orders.update',
                'products.view'
            ];
        }

        return ['orders.view', 'clients.view', 'products.view'];
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $permissions = $this->getEffectivePermissions();
        return in_array('*', $permissions) || in_array($permission, $permissions);
    }

    public function isRestrictedByRegion(): bool
    {
        if ($this->isAdmin()) {
            return false;
        }
        if ($this->role === 'commercial' || $this->role === 'delegate') {
            return true;
        }
        return (bool) ($this->roleModel?->has_region_restriction ?? false);
    }
}
