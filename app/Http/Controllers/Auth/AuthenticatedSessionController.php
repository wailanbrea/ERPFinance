<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Empresa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // No permitir entrar si la licencia de la empresa está inactiva.
        // Excepción: el dueño SuperAdmin puede entrar para administrar licencias.
        $user = $request->user();
        if ($user) {
            $ownerEmail = (string) env('SUPERADMIN_OWNER_EMAIL', '');
            $isOwner = $ownerEmail !== '' && strcasecmp((string) $user->email, $ownerEmail) === 0;
            $isOwnerSuperAdmin = $isOwner && $user->hasRole('SuperAdmin');

            if (! $isOwnerSuperAdmin) {
                $empresa = $user->empresa ?: ($user->sucursal?->empresa);
                $licActiva = $empresa instanceof Empresa ? (bool) $empresa->licencia_activa : false;
                if (! $licActiva) {
                    Auth::guard('web')->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    return redirect()
                        ->route('login')
                        ->with('status', 'Licencia inactiva. Contacta al administrador para reactivar el servicio.');
                }
            }
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
