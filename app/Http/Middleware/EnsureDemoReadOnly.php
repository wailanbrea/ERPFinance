<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDemoReadOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $demoEmails = (array) config('demo.user_emails', []);
        if (empty($demoEmails)) {
            $single = (string) config('demo.user_email', '');
            if ($single !== '') {
                $demoEmails = [$single];
            }
        }

        $isDemo = false;
        foreach ($demoEmails as $email) {
            if ($user->email && strcasecmp((string) $user->email, (string) $email) === 0) {
                $isDemo = true;
                break;
            }
        }

        if (! $isDemo) {
            return $next($request);
        }

        $method = strtoupper($request->method());
        $esSeguro = in_array($method, ['GET', 'HEAD', 'OPTIONS'], true);

        if (! $esSeguro && ! $request->routeIs('logout')) {
            abort(403, 'DEMO: solo navegación. Acciones de escritura están deshabilitadas.');
        }

        return $next($request);
    }
}
