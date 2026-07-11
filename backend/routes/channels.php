<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('hosting.site.{siteId}', function ($user, int $siteId) {
    return $user->sites()->whereKey($siteId)->exists();
});
