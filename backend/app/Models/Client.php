<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $client_code
 * @property string $name
 * @property string|null $email
 * @property string $phone
 * @property string|null $personal_phone
 * @property string|null $storm_phone
 * @property string|null $rc_number
 * @property string $address
 * @property string $region
 * @property string $wilaya
 * @property int|null $delegate_id
 * @property string $client_type
 * @property string $status
 * @property float $credit_limit
 * @property float $outstanding_balance
 * @property int $total_orders
 * @property float $total_spent
 * @property \Illuminate\Support\Carbon|null $last_order_at
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $delegate
 */
class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_code',
        'name',
        'email',
        'phone',
        'personal_phone',
        'storm_phone',
        'rc_number',
        'address',
        'region',
        'wilaya',
        'delegate_id',
        'client_type',
        'status',
        'credit_limit',
        'outstanding_balance',
        'total_orders',
        'total_spent',
        'last_order_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:2',
            'outstanding_balance' => 'decimal:2',
            'total_spent' => 'decimal:2',
            'total_orders' => 'integer',
            'last_order_at' => 'datetime',
            'last_payment_date' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Client $client) {
            if (empty($client->client_code)) {
                $maxId = (int) (static::max('id') ?? 0);
                $client->client_code = sprintf('CLT-%05d', $maxId + 1);
            }
        });
    }

    public function delegate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegate_id');
    }

    public function objectives()
    {
        return $this->hasMany(ClientObjective::class, 'client_id');
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

        return $query->where(function ($q) use ($table, $lowRegions, $wilayas, $userId) {
            $hasCondition = false;

            if ($userId) {
                $q->where("{$table}.delegate_id", $userId);
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
