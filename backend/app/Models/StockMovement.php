<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $reference
 * @property int|null $product_id
 * @property string $product_name
 * @property string $movement_type
 * @property int $quantity
 * @property string $warehouse
 * @property string|null $destination_warehouse
 * @property string|null $delegate_name
 * @property int|null $user_id
 * @property string $status
 * @property \Illuminate\Support\Carbon $date
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\User|null $user
 */
class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'product_id',
        'product_name',
        'movement_type',
        'quantity',
        'warehouse',
        'destination_warehouse',
        'delegate_name',
        'user_id',
        'status',
        'date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'date' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
