<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DemoAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'SuperAdmin']);
        $admin = Role::firstOrCreate(['name' => 'Administrador']);
        $full = Role::firstOrCreate(['name' => 'Plan Full']);

        $perm = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'notificaciones.editar']);
        $admin->givePermissionTo($perm);
        $full->givePermissionTo($perm);
    }

    private function createEmpresaYsucursal(): array
    {
        $empresa = Empresa::create([
            'nombre' => 'Empresa Test',
            'slug' => 'empresa-test',
            'plan' => 'full',
            'licencia_activa' => true,
        ]);

        $sucursal = Sucursal::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Sucursal Central',
        ]);

        return [$empresa, $sucursal];
    }

    public function test_demo_route_returns_404_when_disabled(): void
    {
        Config::set('demo.enabled', false);

        $response = $this->get('/demo');

        $response->assertNotFound();
    }

    public function test_demo_route_logs_in_configured_demo_user_preserving_roles(): void
    {
        Config::set('demo.enabled', true);
        Config::set('demo.user_email', 'admin@bsolutions.dev');
        Config::set('demo.user_emails', ['admin@bsolutions.dev', 'demo@bsolutions.dev']);
        Config::set('demo.role', 'Plan Full');

        [$empresa, $sucursal] = $this->createEmpresaYsucursal();

        $user = User::factory()->create([
            'email' => 'admin@bsolutions.dev',
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $user->assignRole('Administrador');

        $response = $this->get('/demo');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user);

        $user->refresh();
        $this->assertTrue($user->hasRole('Administrador'));
        $this->assertTrue($user->hasRole('Plan Full'));
    }

    public function test_demo_user_is_blocked_from_write_operations_when_demo_enabled(): void
    {
        Config::set('demo.enabled', true);
        Config::set('demo.user_email', 'admin@bsolutions.dev');
        Config::set('demo.user_emails', ['admin@bsolutions.dev', 'demo@bsolutions.dev']);

        [$empresa, $sucursal] = $this->createEmpresaYsucursal();

        $user = User::factory()->create([
            'email' => 'admin@bsolutions.dev',
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $user->assignRole('Administrador');

        $response = $this->actingAs($user)->post('/notificaciones/marcar-todas');

        $response->assertStatus(403);
    }

    public function test_non_demo_user_is_not_blocked_from_write_operations(): void
    {
        Config::set('demo.enabled', true);
        Config::set('demo.user_email', 'admin@bsolutions.dev');
        Config::set('demo.user_emails', ['admin@bsolutions.dev', 'demo@bsolutions.dev']);

        [$empresa, $sucursal] = $this->createEmpresaYsucursal();

        $regularUser = User::factory()->create([
            'email' => 'reynel@bsolutions.dev',
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $regularUser->assignRole('Plan Full');

        $response = $this->actingAs($regularUser)->post('/notificaciones/marcar-todas');

        $this->assertNotEquals(403, $response->getStatusCode());
    }
}
