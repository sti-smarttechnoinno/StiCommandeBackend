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

    public function objectivesAssignedByMe()
    {
        return $this->hasMany(DelegateObjective::class, 'assigned_by');
    }

    public function tasksAssignedToMe()
    {
        return $this->hasMany(UserTask::class, 'assigned_to');
    }

    public function tasksCreatedByMe()
    {
        return $this->hasMany(UserTask::class, 'assigned_by');
    }

    public function crmVisits()
    {
        return $this->hasMany(CrmVisit::class, 'user_id');
    }

    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role', 'slug');
    }

    public function conversationsAsStaff()
    {
        return $this->hasMany(Conversation::class, 'staff_id');
    }

    public function conversationsAsDelegate()
    {
        return $this->hasMany(Conversation::class, 'delegate_id');
    }


    public function crmLeads()
    {
        return $this->hasMany(CrmLead::class, 'user_id');
    }

    public function crmOpportunities()
    {
        return $this->hasMany(CrmOpportunity::class, 'user_id');
    }

    public function crmQuotes()
    {
        return $this->hasMany(CrmQuote::class, 'user_id');
    }

    public function sentMessages()
    {
        return $this->hasMany(ChatMessage::class, 'sender_id');
    }

    public function unreadChatMessagesCount(): int
    {
        return ChatMessage::where('sender_id', '!=', $this->id)
            ->where('is_read', false)
            ->whereHas('conversation', function ($query) {
                $query->where('staff_id', $this->id)
                    ->orWhere('delegate_id', $this->id);
            })
            ->count();
    }

    public function getEffectivePermissions(): array
    {
        if ($this->isAdmin()) {
            return [
                'orders.view', 'orders.create', 'orders.update', 'orders.validate', 'orders.reject', 'orders.delete',
                'clients.view', 'clients.create', 'clients.update', 'clients.delete',
                'clients.update_solde', 'clients.update_encaissement',
                'products.view', 'products.manage',
                'reports.view', 'reports.export',
                'users.manage', 'settings.manage', '*'
            ];
        }

        $slug = strtolower($this->role ?? '');
        if (in_array($slug, ['delegate', 'delegue'])) {
            $slug = 'commercial';
        }

        $role = Role::where('slug', $slug)->first() ?? $this->roleModel;
        if ($role && is_array($role->permissions)) {
            return $role->permissions;
        }

        // Fallbacks for standard legacy roles if not configured in table
        if ($this->role === 'commercial' || $this->role === 'delegate' || $slug === 'commercial') {
            return [
                'orders.view', 'orders.create',
                'clients.view', 'clients.create', 'clients.update',
                'products.view'
            ];
        }

        if ($this->role === 'charge_compte') {
            return [
                'orders.view', 'orders.update', 'orders.validate', 'orders.reject',
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
        if (in_array(strtolower($this->role ?? ''), ['commercial', 'delegate', 'delegue'])) {
            return true;
        }
        return (bool) ($this->roleModel?->has_region_restriction ?? false);
    }

    public function getAssignedRegions(): array
    {
        $regions = [];

        // 1. Direct regions from $this->region (handles single or comma-separated tokens)
        if (!empty($this->region)) {
            $tokens = array_filter(array_map('trim', explode(',', $this->region)));
            foreach ($tokens as $token) {
                $regions[] = $token;
                $low = strtolower($token);

                $matched = Region::whereRaw('LOWER(TRIM(name)) = ?', [$low])
                    ->orWhereRaw('LOWER(TRIM(code)) = ?', [$low])
                    ->orWhereRaw('LOWER(TRIM(name_fr)) = ?', [$low])
                    ->get();

                foreach ($matched as $r) {
                    $regions[] = $r->name;
                    if ($r->code) $regions[] = $r->code;
                    if ($r->name_fr) $regions[] = $r->name_fr;
                }
            }
        }

        // 2. Regions derived from assigned wilayas (if user has $this->wilaya)
        if (!empty($this->wilaya)) {
            $wTokens = array_filter(array_map('trim', explode(',', $this->wilaya)));
            foreach ($wTokens as $wToken) {
                $pureName = trim(preg_replace('/^\d+\s*-\s*/', '', $wToken));
                $code = preg_match('/^(\d+)/', $wToken, $m) ? str_pad($m[1], 2, '0', STR_PAD_LEFT) : null;

                $wQuery = Wilaya::query();
                if ($code) {
                    $wQuery->where('code', $code);
                } else {
                    $wQuery->whereRaw('LOWER(TRIM(name)) = ?', [strtolower($pureName)]);
                }
                $foundWilayas = $wQuery->with('regions')->get();
                foreach ($foundWilayas as $fw) {
                    if ($fw->region_name) $regions[] = $fw->region_name;
                    if ($fw->region_id) $regions[] = $fw->region_id;
                    foreach ($fw->regions as $r) {
                        $regions[] = $r->name;
                        if ($r->code) $regions[] = $r->code;
                    }
                }
            }
        }

        // 3. For any regions matched, also include their default regional aliases
        if (!empty($regions)) {
            $lowRegions = array_unique(array_map('strtolower', array_map('trim', $regions)));
            $regModels = Region::where(function ($q) use ($lowRegions) {
                foreach ($lowRegions as $lr) {
                    $q->orWhereRaw('LOWER(TRIM(name)) = ?', [$lr])
                      ->orWhereRaw('LOWER(TRIM(code)) = ?', [$lr]);
                }
            })->with('wilayas')->get();

            foreach ($regModels as $rm) {
                $regions[] = $rm->name;
                if ($rm->code) $regions[] = $rm->code;
                if ($rm->name_fr) $regions[] = $rm->name_fr;
                foreach ($rm->wilayas as $w) {
                    if ($w->region_name) $regions[] = $w->region_name;
                    if ($w->region_id) $regions[] = $w->region_id;
                }
            }
        }

        return array_values(array_unique(array_filter(array_map('trim', $regions))));
    }

    public function getAssignedRegionWilayas(): array
    {
        $wilayaList = [];

        // 1. Direct wilayas from $this->wilaya
        if (!empty($this->wilaya)) {
            $rawTokens = array_filter(array_map('trim', explode(',', $this->wilaya)));
            foreach ($rawTokens as $t) {
                $wilayaList[] = $t;
                $pure = trim(preg_replace('/^\d+\s*-\s*/', '', $t));
                if (!empty($pure)) $wilayaList[] = $pure;
                if (preg_match('/^(\d+)/', $t, $m)) {
                    $wilayaList[] = $m[1];
                    $wilayaList[] = str_pad($m[1], 2, '0', STR_PAD_LEFT);
                }
            }
        }

        // 2. Wilayas belonging to any of the user's assigned regions
        $assignedRegions = $this->getAssignedRegions();
        if (!empty($assignedRegions)) {
            $lowRegions = array_unique(array_map('strtolower', array_map('trim', $assignedRegions)));

            $matchedRegionIds = Region::where(function ($q) use ($lowRegions) {
                foreach ($lowRegions as $lr) {
                    $q->orWhereRaw('LOWER(TRIM(name)) = ?', [$lr])
                      ->orWhereRaw('LOWER(TRIM(code)) = ?', [$lr])
                      ->orWhereRaw('LOWER(TRIM(name_fr)) = ?', [$lr]);
                }
            })->pluck('id')->toArray();

            $wilayasFromRegions = Wilaya::query()
                ->where(function ($query) use ($lowRegions, $matchedRegionIds) {
                    foreach ($lowRegions as $lr) {
                        $query->orWhereRaw('LOWER(TRIM(region_name)) = ?', [$lr])
                              ->orWhereRaw('LOWER(TRIM(CAST(region_id AS TEXT))) = ?', [$lr]);
                    }

                    if (!empty($matchedRegionIds)) {
                        if (\Illuminate\Support\Facades\Schema::hasColumn('wilayas', 'custom_region_id')) {
                            $query->orWhereIn('custom_region_id', $matchedRegionIds);
                        }
                        if (\Illuminate\Support\Facades\Schema::hasTable('region_wilaya')) {
                            $query->orWhereHas('regions', function ($rq) use ($matchedRegionIds) {
                                $rq->whereIn('regions.id', $matchedRegionIds);
                            });
                        }
                    }
                })
                ->get();

            foreach ($wilayasFromRegions as $w) {
                $wilayaList[] = $w->name;
                $wilayaList[] = $w->code;
                $wilayaList[] = "{$w->code} - {$w->name}";
                $wilayaList[] = ((int)$w->code) . " - {$w->name}";
            }
        }

        return array_values(array_unique(array_filter(array_map('trim', $wilayaList))));
    }
}
