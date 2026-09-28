<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmQuoteItem extends Model
{
    use HasFactory;

    protected $table = 'crm_quote_items';

    protected $fillable = [
        'quote_id',
        'product_id',
        'product_name',
        'reference',
        'unit_price',
        'quantity',
        'discount_percent',
        'subtotal',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'quantity' => 'integer',
        'discount_percent' => 'float',
        'subtotal' => 'float',
    ];

    public function quote(): BelongsTo
    {
        return $this->belongsTo(CrmQuote::class, 'quote_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
