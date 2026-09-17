<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DeliveryNoteItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'delivery_note_id',
        'order_item_id',
        'product_id',
        'product_name',
        'reference',
        'quantity',
        'discount_percent',
        'unit_price',
        'subtotal',
        'is_gift',
        'notes',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'quantity' => 'integer',
        'discount_percent' => 'float',
        'unit_price' => 'float',
        'subtotal' => 'float',
        'is_gift' => 'boolean',
    ];

    public function deliveryNote()
    {
        return $this->belongsTo(DeliveryNote::class, 'delivery_note_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
