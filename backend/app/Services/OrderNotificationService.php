<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class OrderNotificationService
{
    protected FirebaseService $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    /**
     * Notify concerned delegate and mobile app when an order status changes.
     * Triggers specifically on: validated, partially_validated, cancelled.
     *
     * @param Order $order
     * @param string $newStatus
     * @param string|null $oldStatus
     * @param User|null $actor
     * @return bool
     */
    public function notifyOrderStatusChanged(Order $order, string $newStatus, ?string $oldStatus = null, ?User $actor = null): bool
    {
        $trackedStatuses = ['validated', 'partially_validated', 'cancelled'];
        if (!in_array($newStatus, $trackedStatuses)) {
            return false;
        }

        if ($oldStatus !== null && $oldStatus === $newStatus) {
            return false;
        }

        $orderCode = $order->order_code ?: "CMD-{$order->id}";
        $clientName = $order->client_name ?: 'Client';
        $totalFormatted = number_format((float) ($order->total_amount ?? 0), 0, ',', ' ') . ' DA';

        // 1. Build Title and Body
        switch ($newStatus) {
            case 'validated':
                $title = "Commande #{$orderCode} Validée";
                $body = "La commande de {$clientName} d'un montant de {$totalFormatted} a été validée avec succès.";
                $priority = 'high';
                break;

            case 'partially_validated':
                $title = "Commande #{$orderCode} Partiellement Validée";
                $body = "La commande de {$clientName} a été partiellement validée. Consultez les quantités approuvées.";
                $priority = 'high';
                break;

            case 'cancelled':
                $title = "Commande #{$orderCode} Annulée";
                $body = "La commande de {$clientName} a été annulée.";
                $priority = 'critical';
                break;

            default:
                return false;
        }

        // 2. Identify the assigned delegate / sales representative
        $delegate = $order->delegate;
        if (!$delegate && $order->delegate_id) {
            $delegate = User::find($order->delegate_id);
        }
        if (!$delegate && $order->client && $order->client->delegate_id) {
            $delegate = User::find($order->client->delegate_id);
        }

        $delegateName = $delegate ? $delegate->name : ($order->delegate_name ?: 'Délégué Commercial');
        $region = $order->region ?: ($delegate?->region ?? 'All');

        // 3. Persist notification in database for in-app notification center
        try {
            Notification::create([
                'title' => $title,
                'description' => $body,
                'category' => 'orders',
                'priority' => $priority,
                'status' => 'unread',
                'user' => $delegateName,
                'region' => $region,
                'module' => 'Orders',
                'reference_id' => (string) $order->id,
                'read' => false,
            ]);
            Log::info("Order status notification recorded in DB: #{$orderCode} -> {$newStatus} for {$delegateName}");
        } catch (\Throwable $e) {
            Log::warning("Failed to save order notification in DB: " . $e->getMessage());
        }

        // 4. Construct FCM payload
        $fcmData = [
            'type' => 'order_' . $newStatus,
            'order_id' => (string) $order->id,
            'order_code' => (string) $orderCode,
            'status' => (string) $newStatus,
            'client_name' => (string) $clientName,
            'total_amount' => (string) $order->total_amount,
            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
        ];

        // 5. Send FCM Push Notification
        $dispatched = false;

        // 5a. Direct push to delegate device token if available
        if ($delegate && !empty($delegate->fcm_token)) {
            try {
                $dispatched = $this->firebase->sendPush($delegate->fcm_token, $title, $body, $fcmData);
                if ($dispatched) {
                    Log::info("FCM push sent directly to delegate [{$delegate->name}] token for order #{$orderCode}");
                }
            } catch (\Throwable $e) {
                Log::warning("FCM push error to delegate token: " . $e->getMessage());
            }
        }

        // 5b. Fallback or additional topic dispatch so app always receives event
        try {
            // Send to general delegates topic as fallback or sync channel
            $topic = '/topics/sti_delegates';
            $this->firebase->sendPush($topic, $title, $body, $fcmData);
            Log::info("FCM push sent to topic {$topic} for order #{$orderCode} ({$newStatus})");
            $dispatched = true;
        } catch (\Throwable $e) {
            Log::warning("FCM push error to topic: " . $e->getMessage());
        }

        return $dispatched;
    }
}
