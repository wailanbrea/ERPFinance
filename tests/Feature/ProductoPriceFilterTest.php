<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ProductoPriceFilterTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        $empresa = Empresa::create([
            'nombre' => 'Empresa de prueba',
            'slug' => 'empresa-filtros-precio',
            'plan' => 'full',
            'licencia_activa' => true,
        ]);
        $sucursal = Sucursal::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Principal',
            'activa' => true,
        ]);
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);
        $user->givePermissionTo(Permission::findOrCreate('productos.ver', 'web'));

        foreach ([
            ['nombre' => 'Económico', 'precio_contado' => 10000, 'precio_financiado' => 13000],
            ['nombre' => 'Intermedio', 'precio_contado' => 25000, 'precio_financiado' => 32000],
            ['nombre' => 'Premium', 'precio_contado' => 50000, 'precio_financiado' => 65000],
        ] as $producto) {
            Producto::create($producto + ['empresa_id' => $empresa->id, 'activo' => true]);
        }

        return $user;
    }

    public function test_filters_products_by_financed_price_range(): void
    {
        $this->actingAs($this->user())
            ->get(route('productos.index', [
                'precio_financiado_desde' => 30000,
                'precio_financiado_hasta' => 40000,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Productos/Index')
                ->has('productos.data', 1)
                ->where('productos.data.0.nombre', 'Intermedio'));
    }

    public function test_filters_products_by_cash_price_range(): void
    {
        $this->actingAs($this->user())
            ->get(route('productos.index', [
                'precio_contado_desde' => 20000,
                'precio_contado_hasta' => 30000,
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Productos/Index')
                ->has('productos.data', 1)
                ->where('productos.data.0.nombre', 'Intermedio'));
    }

    public function test_reversed_ranges_are_normalized_and_legacy_parameters_still_work(): void
    {
        $this->actingAs($this->user())
            ->get(route('productos.index', ['precio_min' => 40000, 'precio_max' => 30000]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('productos.data', 1)
                ->where('productos.data.0.nombre', 'Intermedio')
                ->where('filtros.precio_financiado_desde', 30000)
                ->where('filtros.precio_financiado_hasta', 40000));
    }
}
