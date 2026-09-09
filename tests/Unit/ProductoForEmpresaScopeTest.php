<?php

namespace Tests\Unit;

use App\Models\Empresa;
use App\Models\Producto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductoForEmpresaScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_for_empresa_scope_limits_query(): void
    {
        $slugA = 'a-'.uniqid();
        $slugB = 'b-'.uniqid();
        $empresaA = Empresa::query()->create([
            'nombre' => 'Empresa A',
            'slug' => $slugA,
            'plan' => 'full',
            'licencia_activa' => true,
            'max_usuarios_empleados' => 10,
            'estado_pago' => 'al_dia',
        ]);
        $empresaB = Empresa::query()->create([
            'nombre' => 'Empresa B',
            'slug' => $slugB,
            'plan' => 'full',
            'licencia_activa' => true,
            'max_usuarios_empleados' => 10,
            'estado_pago' => 'al_dia',
        ]);

        Producto::query()->create([
            'empresa_id' => $empresaA->id,
            'nombre' => 'Producto A',
            'sku' => 'SKU-A-'.uniqid(),
            'costo' => 1,
            'precio_contado' => 2,
            'precio_financiado' => 3,
            'garantia_meses' => 0,
            'activo' => true,
        ]);
        Producto::query()->create([
            'empresa_id' => $empresaB->id,
            'nombre' => 'Producto B',
            'sku' => 'SKU-B-'.uniqid(),
            'costo' => 1,
            'precio_contado' => 2,
            'precio_financiado' => 3,
            'garantia_meses' => 0,
            'activo' => true,
        ]);

        $this->assertSame(1, Producto::query()->forEmpresa($empresaA->id)->count());
        $this->assertSame(0, Producto::query()->forEmpresa(null)->count());
    }
}
