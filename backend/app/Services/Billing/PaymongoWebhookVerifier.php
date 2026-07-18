<?php

namespace App\Services\Billing;

class PaymongoWebhookVerifier
{
    public function valid(string $rawPayload, ?string $signatureHeader): bool
    {
        $secret = (string) config('services.paymongo.webhook_secret');

        if ($secret === '' || ! is_string($signatureHeader) || $signatureHeader === '') {
            return false;
        }

        $parts = [];
        foreach (explode(',', $signatureHeader) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, null);
            if (is_string($key) && is_string($value)) {
                $parts[$key] = $value;
            }
        }

        $timestamp = $parts['t'] ?? null;
        if (! is_string($timestamp) || ! ctype_digit($timestamp)) {
            return false;
        }

        $tolerance = max(0, (int) config('services.paymongo.webhook_tolerance', 300));
        if ($tolerance > 0 && abs(now()->timestamp - (int) $timestamp) > $tolerance) {
            return false;
        }

        $signatureKey = str_starts_with((string) config('services.paymongo.secret_key'), 'sk_live_') ? 'li' : 'te';
        $provided = $parts[$signatureKey] ?? null;
        if (! is_string($provided) || $provided === '') {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$rawPayload, $secret);

        return hash_equals($expected, $provided);
    }
}
