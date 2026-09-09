<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class DemoController extends Controller
{
    public function enter(): RedirectResponse
    {
        if (! config('demo.enabled', false)) {
            abort(404);
        }

        $email = (string) config('demo.user_email');
        if ($email === '') {
            abort(500, 'DEMO_USER_EMAIL no configurado.');
        }

        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            abort(404, 'Usuario demo no encontrado. Ejecuta seeders o crea el usuario.');
        }

        // Evitar bloqueo por middleware 'verified'
        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $rol = (string) config('demo.role', 'Plan Full');
        if ($rol !== '') {
            Role::firstOrCreate(['name' => $rol]);
            $user->syncRoles([$rol]);
        }

        Auth::login($user, remember: true);
        request()->session()->regenerate();

        return redirect()->route('dashboard');
    }
}
