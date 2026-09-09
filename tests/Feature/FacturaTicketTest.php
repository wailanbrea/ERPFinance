<?php

namespace Tests\Feature;

use App\Models\{Almacen, Empresa, Sucursal, User, Venta};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class FacturaTicketTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(string $slug): array
    {
        $empresa = Empresa::create(['nombre' => 'Empresa '.$slug, 'slug' => $slug, 'plan' => 'full', 'licencia_activa' => true]);
        $sucursal = Sucursal::create(['empresa_id' => $empresa->id, 'nombre' => 'Sucursal '.$slug]);
        $user = User::factory()->create(['empresa_id' => $empresa->id, 'sucursal_id' => $sucursal->id]);
        $almacen = Almacen::create(['sucursal_id' => $sucursal->id, 'nombre' => 'Principal']);
        $venta = Venta::create(['sucursal_id' => $sucursal->id, 'usuario_id' => $user->id, 'almacen_id' => $almacen->id,
            'tipo' => 'contado', 'fecha' => '2026-09-08', 'subtotal' => '100.00', 'impuesto' => '18.00', 'total' => '118.00']);
        $user->givePermissionTo(Permission::findOrCreate('facturas.imprimir', 'web'));
        return [$user, $venta];
    }

    public function test_authorized_user_gets_ticket_with_real_amounts(): void
    {
        [$user, $venta] = $this->fixture('a');
        $response = $this->actingAs($user)->getJson(route('facturas.ticket', $venta));
        $response->assertOk();
        $this->assertStringContainsString('TOTAL: RD$ 118.00', $response->json('content'));
        $this->assertStringContainsString('Empresa a', $response->json('content'));
        $this->assertStringNotContainsString('B0100000024', $response->json('content'));
    }

    public function test_other_company_cannot_read_ticket(): void
    {
        [$user] = $this->fixture('a');
        [, $venta] = $this->fixture('b');
        $this->actingAs($user)->getJson(route('facturas.ticket', $venta))->assertNotFound();
    }

    public function test_print_permission_is_required(): void
    {
        [$user, $venta] = $this->fixture('a');
        $user->revokePermissionTo('facturas.imprimir');
        $this->actingAs($user)->getJson(route('facturas.ticket', $venta))->assertForbidden();
    }

    public function test_guest_cannot_read_ticket(): void
    {
        [, $venta] = $this->fixture('a');
        $this->getJson(route('facturas.ticket', $venta))->assertUnauthorized();
    }
}
