<?php

namespace App\Services\Billing;

use App\Models\BillingPlan;
use App\Models\Site;
use App\Models\User;
use RuntimeException;

class HostingPlanAccess
{
    public function effectivePlan(User $user): BillingPlan
    {
        $subscription = $user->billingSubscription()->with('plan')->first();

        if ($subscription !== null
            && $subscription->status === 'active'
            && $subscription->current_period_end?->isFuture()
            && $subscription->plan instanceof BillingPlan) {
            return $subscription->plan;
        }

        return BillingPlan::query()
            ->where('slug', 'free')
            ->where('active', true)
            ->firstOrFail();
    }

    public function assertCanCreateLaravelSite(User $user): void
    {
        $access = $this->summary($user);
        if (! $access['laravel_sites']['can_create']) {
            throw new RuntimeException($this->limitMessage(
                $access['plan']['name'],
                $access['laravel_sites']['limit'],
                'Laravel site',
            ));
        }
    }

    public function assertCanCreateHybridSite(User $user): void
    {
        $access = $this->summary($user);
        if (! $access['hybrid_sites']['can_create']) {
            if ($access['hybrid_sites']['limit'] === 0) {
                throw new RuntimeException('Your current plan does not include Node.js + Laravel hosting. Upgrade your plan to create this project.');
            }

            throw new RuntimeException($this->limitMessage(
                $access['plan']['name'],
                $access['hybrid_sites']['limit'],
                'Node.js + Laravel site',
            ));
        }
    }

    public function assertCanUseBackgroundServices(User $user, Site $site): void
    {
        $access = $this->summary($user);
        if ($access['background_service_sites']['limit'] === 0) {
            throw new RuntimeException('Your current plan does not include background jobs or scheduled tasks. Upgrade your plan to enable them.');
        }

        if (! $this->siteUsesBackgroundServices($site)
            && $access['background_service_sites']['used'] >= $access['background_service_sites']['limit']) {
            throw new RuntimeException('Your '.$access['plan']['name'].' plan allows background services on '.$access['background_service_sites']['limit'].' site(s), and that limit is already in use.');
        }
    }

    public function assertCanUseReverb(User $user, Site $site): void
    {
        $access = $this->summary($user);
        if ($access['reverb_sites']['limit'] === 0) {
            throw new RuntimeException('Reverb requires the Pro or Premium plan.');
        }

        if (! $site->services()->where('type', 'reverb')->where('enabled', true)->exists()
            && $access['reverb_sites']['used'] >= $access['reverb_sites']['limit']) {
            throw new RuntimeException('Your '.$access['plan']['name'].' plan allows Reverb on '.$access['reverb_sites']['limit'].' site(s), and that limit is already in use.');
        }
    }

    public function assertCanUseManagedNode(User $user): void
    {
        $access = $this->summary($user);
        if ($access['hybrid_sites']['limit'] === 0) {
            throw new RuntimeException('Managed Node.js services require the Premium plan.');
        }
    }

    /**
     * @return array{
     *     active: bool,
     *     paid: bool,
     *     plan: array{slug: string, name: string},
     *     laravel_sites: array{used: int, limit: int, can_create: bool},
     *     hybrid_sites: array{used: int, limit: int, can_create: bool},
     *     background_service_sites: array{used: int, limit: int},
     *     reverb_sites: array{used: int, limit: int},
     *     background_services: bool
     * }
     */
    public function summary(User $user): array
    {
        $subscription = $user->billingSubscription()->with('plan')->first();
        $hasPaidPlan = $subscription !== null
            && $subscription->status === 'active'
            && $subscription->current_period_end?->isFuture()
            && $subscription->plan instanceof BillingPlan;
        $plan = $hasPaidPlan ? $subscription->plan : $this->effectivePlan($user);
        $laravelUsed = $user->sites()->where('stack', 'Laravel / Inertia')->count();
        $hybridUsed = $user->sites()->whereIn('stack', ['Node.js + Laravel', 'node_laravel'])->count();
        $laravelLimit = $plan->laravel_site_limit;
        $hybridLimit = $plan->hybrid_site_limit;
        $backgroundUsed = $user->sites()->whereHas('services', fn ($query) => $query
            ->whereIn('type', ['queue', 'horizon', 'scheduler', 'reverb'])
            ->where('enabled', true))->count();
        $reverbUsed = $user->sites()->whereHas('services', fn ($query) => $query
            ->where('type', 'reverb')
            ->where('enabled', true))->count();

        return [
            'active' => true,
            'paid' => $hasPaidPlan,
            'plan' => ['slug' => $plan->slug, 'name' => $plan->name],
            'laravel_sites' => [
                'used' => $laravelUsed,
                'limit' => $laravelLimit,
                'can_create' => $laravelUsed < $laravelLimit,
            ],
            'hybrid_sites' => [
                'used' => $hybridUsed,
                'limit' => $hybridLimit,
                'can_create' => $hybridUsed < $hybridLimit,
            ],
            'background_service_sites' => [
                'used' => $backgroundUsed,
                'limit' => $plan->background_service_site_limit,
            ],
            'reverb_sites' => [
                'used' => $reverbUsed,
                'limit' => $plan->reverb_site_limit,
            ],
            'background_services' => $plan->background_service_site_limit > 0,
        ];
    }

    private function siteUsesBackgroundServices(Site $site): bool
    {
        return $site->services()
            ->whereIn('type', ['queue', 'horizon', 'scheduler', 'reverb'])
            ->where('enabled', true)
            ->exists();
    }

    private function limitMessage(string $planName, int $limit, string $resource): string
    {
        $label = $limit === 1 ? $resource : $resource.'s';

        return "Your {$planName} plan includes {$limit} {$label}, and you have reached that limit. Delete an existing site or upgrade your plan.";
    }
}
