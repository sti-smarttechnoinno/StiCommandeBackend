<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string|null $barcode
 * @property string $category
 * @property string $operator
 * @property float $nominal_price
 * @property float $discount_percent
 * @property int $stock_quantity
 * @property int $min_stock
 * @property string $status
 * @property int $reserved
 * @property string $warehouse
 * @property int $total_sold
 * @property float $revenue
 * @property string $region
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'barcode',
        'category',
        'operator',
        'nominal_price',
        'discount_percent',
        'stock_quantity',
        'min_stock',
        'track_stock',
        'status',
        'reserved',
        'warehouse',
        'total_sold',
        'revenue',
        'region',
    ];

    protected function casts(): array
    {
        return [
            'nominal_price' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'revenue' => 'decimal:2',
            'stock_quantity' => 'integer',
            'min_stock' => 'integer',
            'track_stock' => 'boolean',
            'reserved' => 'integer',
            'total_sold' => 'integer',
        ];
    }

    /**
     * Get calculated selling price based on nominal price & discount percentage.
     * Example: nominal_price = 10,000 DZD, discount_percent = 4.0% => selling_price = 9,600 DZD.
     */
    public function getSellingPriceAttribute(): float
    {
        $nominal = (float) $this->nominal_price;
        $discount = (float) $this->discount_percent;

        return round($nominal * (1 - ($discount / 100)), 2);
    }

    /**
     * Get discount amount per unit in DZD.
     * Example: nominal_price = 10,000 DZD, discount_percent = 4.0% => discount_amount = 400 DZD.
     */
    public function getDiscountAmountAttribute(): float
    {
        $nominal = (float) $this->nominal_price;
        $discount = (float) $this->discount_percent;

        return round($nominal * ($discount / 100), 2);
    }

    protected $appends = [
        'selling_price',
        'discount_amount',
    ];
}
