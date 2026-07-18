<?php

namespace App\Services\Billing;

use App\Models\BillingPayment;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaymongoClient
{
    /**
     * @return array{id: string, checkout_url: string}
     */
    public function createQrCheckout(BillingPayment $payment): array
    {
        $secretKey = (string) config('services.paymongo.secret_key');

        if ($secretKey === '') {
            throw new RuntimeException('PayMongo is not configured yet. Add the secret key to the BerryPanel backend.');
        }

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->withBasicAuth($secretKey, '')
                ->timeout(20)
                ->post(rtrim((string) config('services.paymongo.api_url'), '/').'/v2/checkout_sessions', [
                    'data' => [
                        'attributes' => [
                            'line_items' => [[
                                'name' => $payment->plan->name.' — 1 month',
                                'description' => 'BerryPanel hosting plan renewal',
                                'amount' => $payment->amount_centavos,
                                'currency' => $payment->currency,
                                'quantity' => 1,
                            ]],
                            'payment_method_types' => ['qrph'],
                            'success_url' => $this->frontendUrl('/dashboard/billing?payment=success&reference='.$payment->reference_number),
                            'cancel_url' => $this->frontendUrl('/dashboard/billing?payment=cancelled'),
                            'reference_number' => $payment->reference_number,
                            'send_email_receipt' => true,
                            'metadata' => [
                                'berrypanel_user_id' => (string) $payment->user_id,
                                'berrypanel_plan' => $payment->plan->slug,
                            ],
                        ],
                    ],
                ]);
        } catch (ConnectionException $exception) {
            throw new RuntimeException('BerryPanel could not connect to PayMongo. Please try again.', previous: $exception);
        }

        if ($response->failed()) {
            $message = $response->json('errors.0.detail')
                ?? $response->json('errors.0.code')
                ?? 'PayMongo could not create the QR payment.';

            throw new RuntimeException((string) $message);
        }

        $id = $response->json('data.id');
        $checkoutUrl = $response->json('data.attributes.checkout_url');

        if (! is_string($id) || ! is_string($checkoutUrl) || $id === '' || $checkoutUrl === '') {
            throw new RuntimeException('PayMongo returned an incomplete checkout response.');
        }

        return ['id' => $id, 'checkout_url' => $checkoutUrl];
    }

    private function frontendUrl(string $path): string
    {
        $base = rtrim((string) config('services.paymongo.frontend_url'), '/');

        if ($base === '') {
            throw new RuntimeException('The BerryPanel frontend URL is not configured.');
        }

        return $base.'/'.ltrim($path, '/');
    }
}
