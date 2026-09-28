<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmInteraction extends Model
{
    use HasFactory;

    protected $table = 'crm_interactions';

    protected $fillable = [
        'client_id',
        'user_id',
        'type',
        'title',
        'notes',
        'interaction_date',
        'crm_visit_id',
    ];

    protected $casts = [
        'interaction_date' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(CrmVisit::class, 'crm_visit_id');
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

            // Also include interactions for any client inside the user's assigned territory
            $q->orWhereHas('client', function ($cq) use ($user) {
                $cq->forUser($user);
            });
        });
    }
}
