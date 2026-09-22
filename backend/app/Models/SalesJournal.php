<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesJournal extends Model
{
    use HasFactory;

    protected $fillable = [
        'import_id',
        'client_id',
        'delegate_id',
        'reference',
        'type',
        'status',
        'operation_date',
        'tiers_name',
        'client_code',
        'wilaya',
        'region',
        'amount_ht',
        'discount_pct',
        'net_ht',
        'tva',
        'timbre',
        'total_ttc',
        'paid_amount',
        'remaining_amount',
        'payment_mode',
        'currency',
        'depot_source',
        'depot_destination',
        'created_by_erp',
        'created_at_erp',
        'locked',
    ];

    protected function casts(): array
    {
        return [
            'operation_date' => 'datetime',
            'created_at_erp' => 'datetime',
            'amount_ht' => 'float',
            'discount_pct' => 'float',
            'net_ht' => 'float',
            'tva' => 'float',
            'timbre' => 'float',
            'total_ttc' => 'float',
            'paid_amount' => 'float',
            'remaining_amount' => 'float',
            'locked' => 'boolean',
        ];
    }

    public function import(): BelongsTo
    {
        return $this->belongsTo(SalesJournalImport::class, 'import_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function delegate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegate_id');
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
                $method = $hasCondition ? 'orWhere' : 'where';
                $q->$method(function ($wQ) use ($table, $wilayas) {
                    $firstW = true;
                    foreach ($wilayas as $w) {
                        $wTrimmed = strtolower(trim($w));
                        if ($firstW) {
                            $wQ->whereRaw("LOWER(TRIM({$table}.wilaya)) = ?", [$wTrimmed]);
                            $firstW = false;
                        } else {
                            $wQ->orWhereRaw("LOWER(TRIM({$table}.wilaya)) = ?", [$wTrimmed]);
                        }
                    }
                });
            }
        });
    }
}
