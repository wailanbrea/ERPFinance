<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\Empresa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $empresa = Empresa::create(['nombre' => 'Pruebas', 'slug' => 'pruebas', 'plan' => 'full', 'licencia_activa' => true]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect(route('login'));
    }

    public function test_inactive_company_cannot_log_in(): void
    {
        $empresa = Empresa::create(['nombre' => 'Inactiva', 'slug' => 'inactiva', 'plan' => 'full', 'licencia_activa' => false]);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('login'))->assertSessionHas('status');
        $this->assertGuest();
    }

    public function test_user_without_company_cannot_log_in(): void
    {
        $user = User::factory()->create();
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect(route('login'))->assertSessionHas('status');
        $this->assertGuest();
    }

    public function test_owner_with_superadmin_role_can_enter_without_company(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.test']);
        $user->assignRole(\Spatie\Permission\Models\Role::findOrCreate('SuperAdmin', 'web'));
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_owner_email_alone_does_not_bypass_license(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.test']);
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect(route('login'));
        $this->assertGuest();
    }
}
