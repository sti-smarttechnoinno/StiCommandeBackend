<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_code',
        'client_id',
        'client_name',
        'delegate_id',
        'delegate_name',
        'region',
        'wilaya',
        'total_amount',
        'status',
        'payment_method',
        'notes',
        'rejection_reason',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'delegate_id' => 'integer',
        'client_id' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function delegate()
    {
        return $this->belongsTo(User::class, 'delegate_id');
    }

    public function validationLogs()
    {
        return $this->hasMany(OrderValidationLog::class, 'order_id')->orderBy('created_at', 'desc');
    }

    /**
     * Scope query to data visible to the given user based on regional territory and assigned delegate ID.
     */
    public function scopeForUser($query, ?User $user)
    {
        if (!$user || !method_exists($user, 'isRestrictedByRegion') || !$user->isRestrictedByRegion()) {
            return $query;
        }

        $table = $this->getTable();
        $regions = method_exists($user, 'getAssignedRegions') ? $user->getAssignedRegions() : [];
        if (empty($regions) && !empty($user->region)) {
            $regions = array_filter(array_map('trim', explode(',', $user->region)));
        }
        $lowRegions = array_values(array_unique(array_filter(array_map('strtolower', array_map('trim', $regions)))));

        $wilayas = method_exists($user, 'getAssignedRegionWilayas') ? $user->getAssignedRegionWilayas() : [];
        $userId = $user->id;

        return $query->where(function ($q) use ($table, $lowRegions, $wilayas, $userId, $user) {
            $hasCondition = false;

            if ($userId) {
                $q->where(function ($sub) use ($table, $userId, $user) {
                    $sub->where("{$table}.delegate_id", $userId);
                    if (!empty($user->name)) {
                        $sub->orWhere("{$table}.delegate_name", $user->name);
                    }
                });
                $hasCondition = true;
            }

            if (!empty($lowRegions)) {
                $method = $hasCondition ? 'orWhere' : 'where';
                $q->$method(function ($sub) use ($table, $lowRegions) {
                    foreach ($lowRegions as $idx => $r) {
                        if ($idx === 0) {
                            $sub->whereRaw("LOWER(TRIM({$table}.region)) = ?", [$r]);
                        } else {
                            $sub->orWhereRaw("LOWER(TRIM({$table}.region)) = ?", [$r]);
                        }
                    }
                });
                $hasCondition = true;
            }

            if (!empty($wilayas)) {
                $method = $hasCondition ? 'orWhere' : 'where';
                $q->$method(function ($sub) use ($table, $wilayas) {
                    $sub->whereIn("{$table}.wilaya", $wilayas);
                    foreach ($wilayas as $w) {
                        $sub->orWhereRaw("LOWER(TRIM({$table}.wilaya)) = ?", [strtolower(trim($w))]);
                    }
                });
            }
        });
    }
}
