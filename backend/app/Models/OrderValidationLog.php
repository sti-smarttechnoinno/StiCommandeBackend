<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class OrderValidationLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'batch_number',
        'status',
        'validated_by',
        'total_quantity',
        'total_amount',
        'items_payload',
        'notes',
    ];

    protected $casts = [
        'batch_number' => 'integer',
        'total_quantity' => 'integer',
        'total_amount' => 'float',
        'items_payload' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
