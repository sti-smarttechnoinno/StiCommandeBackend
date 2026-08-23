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
}
