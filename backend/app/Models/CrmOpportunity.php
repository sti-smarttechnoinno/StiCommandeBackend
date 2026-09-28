<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrmOpportunity extends Model
{
    use HasFactory;

    protected $table = 'crm_opportunities';

    protected $fillable = [
        'title',
        'client_id',
        'lead_id',
        'user_id',
        'amount',
        'stage',
        'probability',
        'priority',
        'expected_closing_date',
        'closed_at',
        'lost_reason',
        'converted_order_id',
        'notes',
    ];

    protected $casts = [
        'amount' => 'float',
        'probability' => 'integer',
        'expected_closing_date' => 'date:Y-m-d',
        'closed_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(CrmLead::class, 'lead_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function convertedOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'converted_order_id', 'id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(CrmQuote::class, 'opportunity_id')->orderBy('created_at', 'desc');
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

        return $query->where(function ($q) use ($userId, $user) {
            if ($userId) {
                $q->where('user_id', $userId);
            }

            // Include deals where client belongs to user's territory
            $q->orWhereHas('client', function ($cq) use ($user) {
                $cq->forUser($user);
            });

            // Include deals where lead belongs to user's territory
            $q->orWhereHas('lead', function ($lq) use ($user) {
                $lq->forUser($user);
            });
        });
    }
}
