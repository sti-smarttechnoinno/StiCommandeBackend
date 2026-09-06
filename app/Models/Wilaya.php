<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wilaya extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'region_id',
        'region_name',
        'custom_region_id',
        'rank',
        'delegate_id',
        'clients_count',
        'active_clients_count',
        'orders_today',
        'orders_month',
        'monthly_revenue',
        'yearly_revenue',
        'avg_order',
        'growth',
        'performance',
        'performance_score',
        'top_product',
        'status',
        'revenue_trend',
        'orders_trend',
    ];

    protected $casts = [
        'rank' => 'integer',
        'delegate_id' => 'integer',
        'clients_count' => 'integer',
        'active_clients_count' => 'integer',
        'orders_today' => 'integer',
        'orders_month' => 'integer',
        'monthly_revenue' => 'float',
        'yearly_revenue' => 'float',
        'avg_order' => 'float',
        'growth' => 'float',
        'performance_score' => 'integer',
        'revenue_trend' => 'array',
        'orders_trend' => 'array',
    ];

    public function delegate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegate_id');
    }

    public static array $defaultRegions = [
        '01' => ['id' => 'south', 'name' => 'South'],
        '02' => ['id' => 'center', 'name' => 'Center'],
        '03' => ['id' => 'south', 'name' => 'South'],
        '04' => ['id' => 'east', 'name' => 'East'],
        '05' => ['id' => 'east', 'name' => 'East'],
        '06' => ['id' => 'east', 'name' => 'East'],
        '07' => ['id' => 'south', 'name' => 'South'],
        '08' => ['id' => 'south', 'name' => 'South'],
        '09' => ['id' => 'center', 'name' => 'Center'],
        '10' => ['id' => 'center', 'name' => 'Center'],
        '11' => ['id' => 'south', 'name' => 'South'],
        '12' => ['id' => 'east', 'name' => 'East'],
        '13' => ['id' => 'west', 'name' => 'West'],
        '14' => ['id' => 'west', 'name' => 'West'],
        '15' => ['id' => 'center', 'name' => 'Center'],
        '16' => ['id' => 'center', 'name' => 'Center'],
        '17' => ['id' => 'south', 'name' => 'South'],
        '18' => ['id' => 'east', 'name' => 'East'],
        '19' => ['id' => 'east', 'name' => 'East'],
        '20' => ['id' => 'west', 'name' => 'West'],
        '21' => ['id' => 'east', 'name' => 'East'],
        '22' => ['id' => 'west', 'name' => 'West'],
        '23' => ['id' => 'east', 'name' => 'East'],
        '24' => ['id' => 'east', 'name' => 'East'],
        '25' => ['id' => 'east', 'name' => 'East'],
        '26' => ['id' => 'center', 'name' => 'Center'],
        '27' => ['id' => 'west', 'name' => 'West'],
        '28' => ['id' => 'center', 'name' => 'Center'],
        '29' => ['id' => 'west', 'name' => 'West'],
        '30' => ['id' => 'south', 'name' => 'South'],
        '31' => ['id' => 'west', 'name' => 'West'],
        '32' => ['id' => 'south', 'name' => 'South'],
        '33' => ['id' => 'south', 'name' => 'South'],
        '34' => ['id' => 'east', 'name' => 'East'],
        '35' => ['id' => 'center', 'name' => 'Center'],
        '36' => ['id' => 'east', 'name' => 'East'],
        '37' => ['id' => 'south', 'name' => 'South'],
        '38' => ['id' => 'center', 'name' => 'Center'],
        '39' => ['id' => 'south', 'name' => 'South'],
        '40' => ['id' => 'east', 'name' => 'East'],
        '41' => ['id' => 'east', 'name' => 'East'],
        '42' => ['id' => 'center', 'name' => 'Center'],
        '43' => ['id' => 'east', 'name' => 'East'],
        '44' => ['id' => 'center', 'name' => 'Center'],
        '45' => ['id' => 'west', 'name' => 'West'],
        '46' => ['id' => 'west', 'name' => 'West'],
        '47' => ['id' => 'south', 'name' => 'South'],
        '48' => ['id' => 'west', 'name' => 'West'],
        '49' => ['id' => 'south', 'name' => 'South'],
        '50' => ['id' => 'south', 'name' => 'South'],
        '51' => ['id' => 'south', 'name' => 'South'],
        '52' => ['id' => 'south', 'name' => 'South'],
        '53' => ['id' => 'south', 'name' => 'South'],
        '54' => ['id' => 'south', 'name' => 'South'],
        '55' => ['id' => 'south', 'name' => 'South'],
        '56' => ['id' => 'south', 'name' => 'South'],
        '57' => ['id' => 'south', 'name' => 'South'],
        '58' => ['id' => 'south', 'name' => 'South'],
    ];

    public static function resetToDefaults(?array $codes = null): void
    {
        $query = static::query();
        if ($codes !== null) {
            $query->whereIn('code', $codes);
        }
        $wilayas = $query->get();
        foreach ($wilayas as $w) {
            $def = static::$defaultRegions[$w->code] ?? ['id' => 'center', 'name' => 'Center'];
            $w->update([
                'custom_region_id' => null,
                'region_id' => $def['id'],
                'region_name' => $def['name'],
            ]);
        }
    }
}
