<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DeliveryNote extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'delivery_note_code',
        'order_id',
        'order_code',
        'client_id',
        'client_name',
        'delegate_id',
        'delegate_name',
        'region',
        'wilaya',
        'delivery_address',
        'status',
        'validation_type',
        'batch_number',
        'total_quantity',
        'total_amount',
        'validated_by',
        'validated_at',
        'delivered_at',
        'notes',
    ];

    protected $casts = [
        'total_quantity' => 'integer',
        'total_amount' => 'float',
        'batch_number' => 'integer',
        'client_id' => 'integer',
        'delegate_id' => 'integer',
        'validated_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function delegate()
    {
        return $this->belongsTo(User::class, 'delegate_id');
    }

    public function items()
    {
        return $this->hasMany(DeliveryNoteItem::class, 'delivery_note_id');
    }

    public static function generateCode(): string
    {
        $year = now()->year;
        $count = self::whereYear('created_at', $year)->count() + 1;
        return sprintf('BL-%d-%05d', $year, $count);
    }

    /**
     * Scope query to data visible to the given user based on their regional territory and role.
     */
    public function scopeForUser($query, ?User $user)
    {
        if (!$user || !$user->isRestrictedByRegion()) {
            return $query;
        }

        $table = $this->getTable();
        $region = strtolower(trim($user->region ?? ''));
        $wilayas = $user->getAssignedRegionWilayas();
        $userId = $user->id;

        return $query->where(function ($q) use ($table, $region, $wilayas, $userId) {
            $hasCondition = false;

            if ($userId) {
                $q->where("{$table}.delegate_id", $userId);
                $hasCondition = true;
            }

            if (!empty($region)) {
                $method = $hasCondition ? 'orWhereRaw' : 'whereRaw';
                $q->$method("LOWER(TRIM({$table}.region)) = ?", [$region]);
                $hasCondition = true;
            }

            if (!empty($wilayas)) {
                $lowerWilayas = array_map(function ($w) {
                    return strtolower(trim($w));
                }, $wilayas);

                $method = $hasCondition ? 'orWhereIn' : 'whereIn';
                $q->$method(\Illuminate\Support\Facades\DB::raw("LOWER(TRIM({$table}.wilaya))"), $lowerWilayas);
                $hasCondition = true;
            }

            if (!$hasCondition) {
                $q->whereRaw('1 = 0');
            }
        });
    }
}
