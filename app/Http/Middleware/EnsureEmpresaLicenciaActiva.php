<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmpresaLicenciaActiva
{
    /**
     * Bloquea el acceso si la empresa del usuario no tiene licencia activa.
     * Excepción: el dueño SuperAdmin (SUPERADMIN_OWNER_EMAIL) puede entrar para administrar.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        // El dueño siempre puede entrar al panel para corregir licencias.
        $ownerEmail = (string) env('SUPERADMIN_OWNER_EMAIL', '');
        if ($ownerEmail !== '' && strcasecmp((string) $user->email, $ownerEmail) === 0 && $user->hasRole('SuperAdmin')) {
            return $next($request);
        }

        $empresa = $user->empresa ?: ($user->sucursal?->empresa);
        if (! $empresa) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->with('status', 'Tu usuario no tiene una empresa asignada. Contacta al administrador.');
        }

        if (! (bool) $empresa->licencia_activa) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->with('status', 'Licencia inactiva. Contacta al administrador para reactivar el servicio.');
        }

        return $next($request);
    }
}

