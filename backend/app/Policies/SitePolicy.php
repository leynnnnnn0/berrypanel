<?php
namespace App\Policies;
use App\Models\Site;
use App\Models\User;
class SitePolicy {
    public function before(User $user): ?bool { return method_exists($user, 'isAdministrator') && $user->isAdministrator() ? true : null; }
    public function view(User $user, Site $site): bool { return $site->user_id === $user->id; }
    public function update(User $user, Site $site): bool { return $this->view($user, $site); }
    public function deploy(User $user, Site $site): bool { return $this->view($user, $site); }
    public function terminal(User $user, Site $site): bool { return $this->view($user, $site); }
    public function delete(User $user, Site $site): bool { return $this->view($user, $site); }
}
