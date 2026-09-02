<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseService
{
    protected string $projectId;
    protected ?string $credentialsPath;

    public function __construct()
    {
        $this->projectId = env('FIREBASE_PROJECT_ID', 'dz-sti-commande');
        $this->credentialsPath = $this->resolveCredentialsPath();

        // Dynamically detect project ID from credentials JSON if available
        if ($this->credentialsPath && file_exists($this->credentialsPath)) {
            try {
                $creds = json_decode(file_get_contents($this->credentialsPath), true);
                if (!empty($creds['project_id'])) {
                    $this->projectId = $creds['project_id'];
                }
            } catch (\Throwable $e) {}
        }
    }

    /**
     * Resolve the absolute path to Firebase credentials JSON
     */
    protected function resolveCredentialsPath(): ?string
    {
        $envPath = env('FIREBASE_CREDENTIALS');
        if ($envPath) {
            $envPath = trim($envPath, " \t\n\r\0\x0B\"'");
            if (file_exists($envPath)) return $envPath;
            if (file_exists(base_path($envPath))) return base_path($envPath);
            if (file_exists(storage_path($envPath))) return storage_path($envPath);
        }

        // Check specific named files
        $candidates = [
            storage_path('app/private/firebase-credentials.json'),
            storage_path('app/firebase-credentials.json'),
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) return $candidate;
        }

        // Auto-discover any .json service account in storage/app/private
        $privateJsons = glob(storage_path('app/private/*.json'));
        if ($privateJsons) {
            foreach ($privateJsons as $file) {
                if (str_contains($file, 'firebase') || str_contains($file, 'adminsdk')) {
                    return $file;
                }
            }
            if (!empty($privateJsons[0])) {
                return $privateJsons[0];
            }
        }

        // Auto-discover in storage/app
        $appJsons = glob(storage_path('app/*.json'));
        if ($appJsons) {
            foreach ($appJsons as $file) {
                if (str_contains($file, 'firebase') || str_contains($file, 'adminsdk')) {
                    return $file;
                }
            }
        }

        return null;
    }

    /**
     * Send push notification using FCM HTTP v1 API
     */
    public function sendPush(string $recipient, string $title, string $body, array $data = []): bool
    {
        $stringData = [];
        foreach ($data as $k => $v) {
            $stringData[$k] = is_null($v) ? '' : (string) $v;
        }

        $targetKey = 'token';
        $targetVal = $recipient;

        if (str_starts_with($recipient, '/topics/')) {
            $targetKey = 'topic';
            $targetVal = substr($recipient, 8);
        } elseif (str_starts_with($recipient, 'topics/')) {
            $targetKey = 'topic';
            $targetVal = substr($recipient, 7);
        }

        $accessToken = $this->getAccessToken();
        if ($accessToken) {
            try {
                $messagePayload = [
                    'message' => [
                        $targetKey => $targetVal,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                        'android' => [
                            'priority' => 'HIGH',
                            'notification' => [
                                'channel_id' => 'sti_notifications_channel',
                                'sound' => 'default',
                                'default_sound' => true,
                                'default_vibrate_timings' => true,
                                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                            ],
                        ],
                        'data' => array_merge($stringData, [
                            'title' => $title,
                            'body' => $body,
                            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                        ]),
                    ],
                ];

                $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

                $response = Http::withoutVerifying()->withHeaders([
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ])->post($url, $messagePayload);

                if ($response->successful()) {
                    Log::info("FCM v1 Push successfully dispatched to {$recipient}", ['response' => $response->json()]);
                    return true;
                } else {
                    Log::warning("FCM v1 Push returned error: " . $response->status() . " " . $response->body());
                }
            } catch (\Throwable $e) {
                Log::warning("FCM v1 Push exception: " . $e->getMessage());
            }
        } else {
            Log::info("Firebase service account credentials not found at {$this->credentialsPath}.");
        }

        return false;
    }

    /**
     * Generate or retrieve cached OAuth2 access token for Google FCM HTTP v1
     */
    public function getAccessToken(): ?string
    {
        $cached = Cache::get('firebase_oauth2_access_token');
        if (!empty($cached)) {
            return $cached;
        }

        if (!$this->credentialsPath || !file_exists($this->credentialsPath)) {
            return null;
        }

        try {
            $credentials = json_decode(file_get_contents($this->credentialsPath), true);
            if (empty($credentials['client_email']) || empty($credentials['private_key'])) {
                return null;
            }

            $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $now = time();
            $payload = $this->base64UrlEncode(json_encode([
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now,
            ]));

            $signature = '';
            $signingSuccess = openssl_sign(
                $header . '.' . $payload,
                $signature,
                $credentials['private_key'],
                OPENSSL_ALGO_SHA256
            );

            if (!$signingSuccess) {
                Log::error("Failed to sign Google Service Account JWT with OpenSSL");
                return null;
            }

            $jwt = $header . '.' . $payload . '.' . $this->base64UrlEncode($signature);

            $response = Http::withoutVerifying()->asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if ($response->successful() && !empty($response->json('access_token'))) {
                $token = $response->json('access_token');
                Cache::put('firebase_oauth2_access_token', $token, 3300);
                return $token;
            }

            Log::error("Failed to retrieve Google OAuth2 access token: " . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::error("Firebase OAuth2 token generation error: " . $e->getMessage());
            return null;
        }
    }

    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
