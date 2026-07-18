<?php

namespace App\Http\Controllers;

use App\Services\Billing\BillingManager;
use App\Services\Billing\PaymongoWebhookVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymongoWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        PaymongoWebhookVerifier $verifier,
        BillingManager $billing,
    ): JsonResponse {
        $rawPayload = $request->getContent();

        if (! $verifier->valid($rawPayload, $request->header('Paymongo-Signature'))) {
            return response()->json(['message' => 'Invalid PayMongo signature.'], 401);
        }

        $payload = json_decode($rawPayload, true);
        if (! is_array($payload)) {
            return response()->json(['message' => 'Invalid webhook payload.'], 400);
        }

        $billing->processPaidCheckout($payload, $rawPayload);

        return response()->json(['received' => true]);
    }
}
