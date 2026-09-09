<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class CategoriaManagementTest extends TestCase
{
    use RefreshDatabase;

    private function userWithPermissions(array $permissions): User
    {
        $empresa = Empresa::create([
            'nombre' => 'Empresa de prueba',
            'slug' => 'empresa-prueba',
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

        foreach ($permissions as $permission) {
            $user->givePermissionTo(Permission::findOrCreate($permission, 'web'));
        }

        return $user;
    }

    public function test_created_category_is_returned_to_the_product_catalog_filter(): void
    {
        $user = $this->userWithPermissions(['productos.ver', 'productos.crear']);

        $this->actingAs($user)
            ->post(route('categorias.store'), ['nombre' => 'Climatización', 'activa' => true])
            ->assertRedirect(route('productos.index'));

        $this->assertDatabaseHas('categorias', ['nombre' => 'Climatización', 'activa' => true]);

        $this->actingAs($user)
            ->get(route('productos.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Productos/Index')
                ->has('categorias', 1)
                ->where('categorias.0.nombre', 'Climatización'));
    }

    public function test_read_only_user_cannot_create_a_category(): void
    {
        $user = $this->userWithPermissions(['productos.ver']);

        $this->actingAs($user)
            ->post(route('categorias.store'), ['nombre' => 'Restringida', 'activa' => true])
            ->assertForbidden();

        $this->assertDatabaseMissing('categorias', ['nombre' => 'Restringida']);
    }

    public function test_category_with_products_cannot_be_deleted(): void
    {
        $user = $this->userWithPermissions(['productos.eliminar']);
        $categoria = Categoria::create(['nombre' => 'Hogar', 'activa' => true]);
        Producto::create([
            'empresa_id' => $user->empresa_id,
            'categoria_id' => $categoria->id,
            'nombre' => 'Producto de prueba',
        ]);

        $this->actingAs($user)
            ->delete(route('categorias.destroy', $categoria))
            ->assertRedirect(route('categorias.index'))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('categorias', ['id' => $categoria->id]);
    }
}
