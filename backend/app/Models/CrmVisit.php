<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrmVisit extends Model
{
    use HasFactory;

    protected $table = 'crm_visits';

    protected $fillable = [
        'client_id',
        'user_id',
        'planned_at',
        'completed_at',
        'status',
        'purpose',
        'summary',
        'checkin_latitude',
        'checkin_longitude',
        'checkin_address',
        'resulting_order_id',
    ];

    protected $casts = [
        'planned_at' => 'datetime',
        'completed_at' => 'datetime',
        'checkin_latitude' => 'float',
        'checkin_longitude' => 'float',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function resultingOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'resulting_order_id', 'id');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(CrmInteraction::class, 'crm_visit_id');
    }

    /**
     * Scope query to data visible to the given user based on regional territory and assigned delegate ID.
     */
    public function scopeForUser($query, ?User $user)
    {
        if (!$user || !method_exists($user, 'isRestrictedByRegion') || !$user->isRestrictedByRegion()) {
            return $query;
        }

        $userId = $user->id;

        return $query->where(function ($q) use ($userId, $user) {
            if ($userId) {
                $q->where('user_id', $userId);
            }

            // Also include visits for any client inside the user's assigned territory
            $q->orWhereHas('client', function ($cq) use ($user) {
                $cq->forUser($user);
            });
        });
    }
}
