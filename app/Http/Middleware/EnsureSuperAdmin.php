<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user) {
            abort(403, 'Solo SuperAdmin.');
        }

        // Bloqueo duro: SOLO el dueño puede ver el panel privado, aunque existan roles.
        $ownerEmail = (string) env('SUPERADMIN_OWNER_EMAIL', 'wailandkey@gmail.com');
        if ($ownerEmail !== '' && strcasecmp((string) $user->email, $ownerEmail) !== 0) {
            abort(403, 'Solo el dueño del sistema.');
        }

        if (! $user->hasRole('SuperAdmin')) {
            abort(403, 'Solo SuperAdmin.');
        }

        return $next($request);
    }
}

