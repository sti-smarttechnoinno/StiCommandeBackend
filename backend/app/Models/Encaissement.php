<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Encaissement extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'tiers_name',
        'order_number',
        'type',
        'payment_date',
        'amount',
        'debit',
        'credit',
        'payment_mode',
        'reference',
        'status',
        'account',
        'label',
        'locked',
        'is_last',
    ];

    protected function casts(): array
    {
        return [
            'payment_date' => 'datetime',
            'amount' => 'decimal:2',
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'locked' => 'boolean',
            'is_last' => 'boolean',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
