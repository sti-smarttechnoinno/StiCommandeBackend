<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CrmLead extends Model
{
    use HasFactory;

    protected $table = 'crm_leads';

    protected $fillable = [
        'name',
        'company_name',
        'phone',
        'email',
        'address',
        'region',
        'wilaya',
        'user_id',
        'status',
        'source',
        'estimated_budget',
        'converted_client_id',
        'converted_at',
        'notes',
    ];

    protected $casts = [
        'estimated_budget' => 'float',
        'converted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function convertedClient(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'converted_client_id');
    }

    public function opportunities(): HasMany
    {
        return $this->hasMany(CrmOpportunity::class, 'lead_id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(CrmQuote::class, 'lead_id')->orderBy('created_at', 'desc');
    }

    /**
     * Scope query to data visible to the given user based on regional territory or assignment.
     */
    public function scopeForUser($query, ?User $user)
    {
        if (!$user || !method_exists($user, 'isRestrictedByRegion') || !$user->isRestrictedByRegion()) {
            return $query;
        }

        $userId = $user->id;
        $assignedRegions = method_exists($user, 'getAssignedRegions') ? $user->getAssignedRegions() : [];
        $assignedWilayas = method_exists($user, 'getAssignedRegionWilayas') ? $user->getAssignedRegionWilayas() : [];

        return $query->where(function ($q) use ($userId, $assignedRegions, $assignedWilayas) {
            if ($userId) {
                $q->where('user_id', $userId);
            }

            if (!empty($assignedRegions)) {
                $regionsLower = array_map('mb_strtolower', $assignedRegions);
                $q->orWhereIn(\DB::raw('LOWER(region)'), $regionsLower);
            }

            if (!empty($assignedWilayas)) {
                $wilayasLower = array_map('mb_strtolower', $assignedWilayas);
                $q->orWhereIn(\DB::raw('LOWER(wilaya)'), $wilayasLower);
            }
        });
    }

    /**
     * Convert this lead into an official client in the clients table.
     */
    public function convertToClient(array $attributes = []): Client
    {
        $clientCode = $attributes['client_code'] ?? null;
        if (!$clientCode) {
            $lastClient = Client::orderBy('id', 'desc')->first();
            $nextNum = $lastClient ? ($lastClient->id + 1) : 1;
            $clientCode = 'CLT-' . str_pad((string)$nextNum, 5, '0', STR_PAD_LEFT);
        }

        $client = Client::create([
            'client_code' => $clientCode,
            'name' => $attributes['name'] ?? $this->company_name ?: $this->name,
            'email' => $attributes['email'] ?? $this->email,
            'phone' => $attributes['phone'] ?? $this->phone,
            'address' => $attributes['address'] ?? ($this->address ?: 'Non renseignée'),
            'region' => $attributes['region'] ?? $this->region,
            'wilaya' => $attributes['wilaya'] ?? $this->wilaya,
            'delegate_id' => $attributes['delegate_id'] ?? $this->user_id,
            'client_type' => $attributes['client_type'] ?? 'retail',
            'status' => 'active',
            'notes' => $this->notes ? "Converti depuis Prospect: " . $this->notes : "Converti depuis Prospect",
        ]);

        $this->update([
            'status' => 'converted',
            'converted_client_id' => $client->id,
            'converted_at' => now(),
        ]);

        // Link existing opportunities to this new client as well
        $this->opportunities()->whereNull('client_id')->update([
            'client_id' => $client->id,
        ]);

        return $client;
    }
}
