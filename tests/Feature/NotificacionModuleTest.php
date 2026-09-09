<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Notifications\SistemaNotificacion;
use App\Services\NotificacionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class NotificacionModuleTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $slug, array $permissions = []): User
    {
        $empresa = Empresa::firstOrCreate(
            ['slug' => $slug],
            ['nombre' => 'Empresa '.$slug, 'plan' => 'full', 'licencia_activa' => true]
        );
        $sucursal = Sucursal::firstOrCreate(
            ['empresa_id' => $empresa->id, 'nombre' => 'Principal'],
            ['activa' => true]
        );
        $user = User::factory()->create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursal->id,
        ]);

        foreach ($permissions as $permission) {
            $user->givePermissionTo(Permission::findOrCreate($permission, 'web'));
        }

        return $user;
    }

    public function test_service_notifies_only_authorized_users_from_the_same_company(): void
    {
        $actor = $this->user('a', ['notificaciones.ver']);
        $companion = $this->user('a', ['notificaciones.ver']);
        $this->user('a');
        $outsider = $this->user('b', ['notificaciones.ver']);

        app(NotificacionService::class)->paraEmpresa(
            $actor,
            'Venta registrada',
            'Venta #10',
            ['tipo' => 'venta', 'url' => '/facturas']
        );

        $this->assertCount(1, $actor->fresh()->notifications);
        $this->assertCount(1, $companion->fresh()->notifications);
        $this->assertCount(0, $outsider->fresh()->notifications);
        $this->assertSame('venta', $actor->fresh()->notifications->first()->data['meta']['tipo']);
    }

    public function test_index_supports_status_type_and_text_filters(): void
    {
        $user = $this->user('a', ['notificaciones.ver']);
        $user->notify(new SistemaNotificacion('Venta registrada', 'Factura especial', ['tipo' => 'venta']));
        $read = $user->notifications()->first();
        $read->markAsRead();
        $user->notify(new SistemaNotificacion('Stock crítico', 'Reponer nevera', ['tipo' => 'inventario']));

        $this->actingAs($user)
            ->get(route('notificaciones.index', ['estado' => 'sin_leer', 'tipo' => 'inventario', 'buscar' => 'nevera']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Notificaciones/Index')
                ->where('resumen.total', 2)
                ->where('resumen.sin_leer', 1)
                ->has('notificaciones.data', 1)
                ->where('notificaciones.data.0.data.titulo', 'Stock crítico'));
    }

    public function test_mark_all_route_marks_every_notification_as_read(): void
    {
        $user = $this->user('a', ['notificaciones.ver', 'notificaciones.editar']);
        $user->notify(new SistemaNotificacion('Uno'));
        $user->notify(new SistemaNotificacion('Dos'));

        $this->actingAs($user)
            ->post(route('notificaciones.marcar_todas'))
            ->assertRedirect();

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_user_cannot_change_another_users_notification(): void
    {
        $owner = $this->user('a', ['notificaciones.ver', 'notificaciones.editar']);
        $other = $this->user('a', ['notificaciones.ver', 'notificaciones.editar']);
        $owner->notify(new SistemaNotificacion('Privada'));
        $notification = $owner->notifications()->firstOrFail();

        $this->actingAs($other)
            ->post(route('notificaciones.marcar_leida', $notification->id))
            ->assertNotFound();

        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_notification_can_be_marked_unread_and_deleted(): void
    {
        $user = $this->user('a', ['notificaciones.ver', 'notificaciones.editar', 'notificaciones.eliminar']);
        $user->notify(new SistemaNotificacion('Temporal'));
        $notification = $user->notifications()->firstOrFail();
        $notification->markAsRead();

        $this->actingAs($user)
            ->post(route('notificaciones.marcar_no_leida', $notification->id))
            ->assertRedirect();
        $this->assertNull($notification->fresh()->read_at);

        $this->actingAs($user)
            ->delete(route('notificaciones.destroy', $notification->id))
            ->assertRedirect();
        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    public function test_operational_actions_generate_notifications_automatically(): void
    {
        $user = $this->user('a', ['gastos.crear', 'notificaciones.ver']);

        $this->actingAs($user)
            ->post(route('gastos.store'), [
                'fecha' => '2026-09-09',
                'categoria' => 'Operación',
                'concepto' => 'Combustible de reparto',
                'monto' => 1500,
                'usar_caja' => false,
            ])
            ->assertRedirect(route('gastos.index'));

        $notification = $user->fresh()->notifications()->firstOrFail();
        $this->assertSame('Gasto registrado', $notification->data['titulo']);
        $this->assertSame('gasto', $notification->data['meta']['tipo']);
        $this->assertStringContainsString('1,500.00', $notification->data['mensaje']);
    }
}
