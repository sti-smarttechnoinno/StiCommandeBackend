<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $client_code
 * @property string $name
 * @property string|null $email
 * @property string $phone
 * @property string $address
 * @property string $region
 * @property string $wilaya
 * @property int|null $delegate_id
 * @property string $client_type
 * @property string $status
 * @property float $credit_limit
 * @property float $outstanding_balance
 * @property int $total_orders
 * @property float $total_spent
 * @property \Illuminate\Support\Carbon|null $last_order_at
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $delegate
 */
class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_code',
        'name',
        'email',
        'phone',
        'address',
        'region',
        'wilaya',
        'delegate_id',
        'client_type',
        'status',
        'credit_limit',
        'outstanding_balance',
        'total_orders',
        'total_spent',
        'last_order_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:2',
            'outstanding_balance' => 'decimal:2',
            'total_spent' => 'decimal:2',
            'total_orders' => 'integer',
            'last_order_at' => 'datetime',
        ];
    }

    public function delegate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegate_id');
    }
}
