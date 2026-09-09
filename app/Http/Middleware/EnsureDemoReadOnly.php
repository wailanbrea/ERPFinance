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

        if (! $user || ! config('demo.enabled', false)) {
            return $next($request);
        }

        $demoEmail = (string) config('demo.user_email', '');
        $isDemo = $demoEmail !== '' && strcasecmp((string) $user->email, $demoEmail) === 0;

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
