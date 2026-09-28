<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CrmQuote extends Model
{
    use HasFactory;

    protected $table = 'crm_quotes';

    protected $fillable = [
        'quote_code',
        'client_id',
        'lead_id',
        'opportunity_id',
        'user_id',
        'client_name',
        'client_phone',
        'client_email',
        'region',
        'wilaya',
        'address',
        'status',
        'subtotal_ht',
        'discount_percent',
        'discount_amount',
        'tax_percent',
        'tax_amount',
        'total_ttc',
        'issue_date',
        'valid_until',
        'converted_order_id',
        'payment_terms',
        'notes',
    ];

    protected $casts = [
        'subtotal_ht' => 'float',
        'discount_percent' => 'float',
        'discount_amount' => 'float',
        'tax_percent' => 'float',
        'tax_amount' => 'float',
        'total_ttc' => 'float',
        'issue_date' => 'date:Y-m-d',
        'valid_until' => 'date:Y-m-d',
    ];

    protected static function booted(): void
    {
        static::creating(function (CrmQuote $quote) {
            if (empty($quote->quote_code)) {
                $year = now()->year;
                $count = static::whereYear('created_at', $year)->count() + 1;
                $quote->quote_code = sprintf('DEV-%d-%05d', $year, $count);
            }

            if (empty($quote->issue_date)) {
                $quote->issue_date = now()->toDateString();
            }

            if (empty($quote->valid_until)) {
                $quote->valid_until = now()->addDays(30)->toDateString();
            }
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(CrmLead::class, 'lead_id');
    }

    public function opportunity(): BelongsTo
    {
        return $this->belongsTo(CrmOpportunity::class, 'opportunity_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CrmQuoteItem::class, 'quote_id');
    }

    public function convertedOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'converted_order_id', 'id');
    }

    /**
     * Scope query to data visible to the given user based on regional territory or assignment.
     */
    public function scopeForUser($query, ?User $user)
    {
        if (!$user || !method_exists($user, 'isRestrictedByRegion') || !$user->isRestrictedByRegion()) {
            return $query;
        }

        $userId = $user->id;

        return $query->where(function ($q) use ($userId, $user) {
            if ($userId) {
                $q->where('user_id', $userId);
            }

            $q->orWhereHas('client', function ($cq) use ($user) {
                $cq->forUser($user);
            });

            $q->orWhereHas('lead', function ($lq) use ($user) {
                $lq->forUser($user);
            });
        });
    }

    /**
     * Convert this quote into an official Order.
     */
    public function convertToOrder(?User $actingUser = null): Order
    {
        return DB::transaction(function () use ($actingUser) {
            $clientId = $this->client_id;
            $clientName = $this->client_name;

            // If quote was made for a Lead, convert the lead to a client first
            if (!$clientId && $this->lead_id) {
                $lead = $this->lead;
                if ($lead && $lead->status !== 'converted') {
                    $newClient = $lead->convertToClient();
                    $clientId = $newClient->id;
                    $clientName = $newClient->name;
                    $this->update(['client_id' => $clientId]);
                } elseif ($lead && $lead->converted_client_id) {
                    $clientId = $lead->converted_client_id;
                }
            }

            $year = now()->year;
            $nextNum = Order::count() + 1;
            $orderCode = sprintf('ORD-%d-%06d', $year, $nextNum);

            $delegateId = $this->user_id;
            $delegateName = $this->user?->name ?? 'Commercial STI';

            $order = Order::create([
                'order_code' => $orderCode,
                'client_id' => $clientId,
                'client_name' => $clientName,
                'delegate_id' => $delegateId,
                'delegate_name' => $delegateName,
                'region' => $this->region,
                'wilaya' => $this->wilaya,
                'total_amount' => $this->total_ttc,
                'status' => 'pending',
                'payment_method' => $this->payment_terms ?: 'Cash on Delivery',
                'notes' => 'Générée depuis le Devis ' . $this->quote_code . ($this->notes ? " — " . $this->notes : ''),
            ]);

            // Copy items to order_items
            foreach ($this->items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'reference' => $item->reference,
                    'unit_price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->subtotal,
                ]);
            }

            // Update Quote status
            $this->update([
                'status' => 'converted',
                'converted_order_id' => $order->id,
            ]);

            // Update linked opportunity to won
            if ($this->opportunity_id && $this->opportunity) {
                $this->opportunity->update([
                    'stage' => 'won',
                    'probability' => 100,
                    'closed_at' => now(),
                    'converted_order_id' => $order->id,
                ]);
            }

            // Create CRM Interaction in timeline if client exists
            if ($clientId) {
                CrmInteraction::create([
                    'client_id' => $clientId,
                    'user_id' => $actingUser?->id ?? $this->user_id ?? 1,
                    'type' => 'note',
                    'title' => 'Devis ' . $this->quote_code . ' validé et converti en commande',
                    'notes' => 'Commande ' . $orderCode . ' créée pour un montant de ' . number_format($this->total_ttc, 2) . ' DZD.',
                    'interaction_date' => now(),
                ]);
            }

            return $order;
        });
    }
}
