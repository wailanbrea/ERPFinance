<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificacionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $estado = $request->string('estado')->toString();
        $estado = in_array($estado, ['todas', 'sin_leer', 'leidas'], true) ? $estado : 'todas';
        $buscar = trim($request->string('buscar')->toString());
        $tipo = $request->string('tipo')->toString();
        $tipos = ['todos', 'venta', 'cobro', 'inventario', 'gasto', 'garantia', 'servicio', 'sistema'];
        $tipo = in_array($tipo, $tipos, true) ? $tipo : 'todos';

        $total = $user->notifications()->count();
        $sinLeer = $user->unreadNotifications()->count();

        $notificaciones = $user->notifications()
            ->when($estado === 'sin_leer', fn ($query) => $query->whereNull('read_at'))
            ->when($estado === 'leidas', fn ($query) => $query->whereNotNull('read_at'))
            ->when($buscar !== '', fn ($query) => $query->where('data', 'like', "%{$buscar}%"))
            ->when($tipo !== 'todos', fn ($query) => $query->where('data', 'like', '%"tipo":"'.$tipo.'"%'))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Notificaciones/Index', [
            'notificaciones' => $notificaciones,
            'filtros' => [
                'estado' => $estado,
                'buscar' => $buscar,
                'tipo' => $tipo,
            ],
            'resumen' => [
                'total' => $total,
                'sin_leer' => $sinLeer,
                'leidas' => $total - $sinLeer,
            ],
        ]);
    }

    public function marcarLeida(Request $request, string $id): RedirectResponse
    {
        $user = $request->user();

        $n = $user->notifications()->where('id', $id)->firstOrFail();
        $n->markAsRead();

        return back()->with('success', 'Notificación marcada como leída.');
    }

    public function marcarTodas(Request $request): RedirectResponse
    {
        $user = $request->user();
        $user->unreadNotifications()->update(['read_at' => now()]);

        return back()->with('success', 'Notificaciones marcadas como leídas.');
    }

    public function marcarNoLeida(Request $request, string $id): RedirectResponse
    {
        $notificacion = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notificacion->forceFill(['read_at' => null])->save();

        return back()->with('success', 'Notificación marcada como pendiente.');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $notificacion = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notificacion->delete();

        return back()->with('success', 'Notificación eliminada.');
    }
}
