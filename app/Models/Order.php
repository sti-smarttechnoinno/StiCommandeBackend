<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_code',
        'client_id',
        'client_name',
        'delegate_id',
        'delegate_name',
        'region',
        'wilaya',
        'total_amount',
        'status',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'delegate_id' => 'integer',
        'client_id' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function delegate()
    {
        return $this->belongsTo(User::class, 'delegate_id');
    }

    public function validationLogs()
    {
        return $this->hasMany(OrderValidationLog::class, 'order_id')->orderBy('created_at', 'desc');
    }
}
