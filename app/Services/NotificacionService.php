<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\SistemaNotificacion;
use Illuminate\Support\Facades\Notification;

class NotificacionService
{
    public function paraEmpresa(User $actor, string $titulo, string $mensaje, array $meta = []): void
    {
        $empresaId = $actor->resolvedEmpresaId();
        if (! $empresaId) {
            return;
        }

        $destinatarios = User::query()
            ->where(function ($query) use ($empresaId) {
                $query->where('empresa_id', $empresaId)
                    ->orWhereHas('sucursal', fn ($sucursal) => $sucursal->where('empresa_id', $empresaId));
            })
            ->get()
            ->filter(fn (User $user) => $user->can('notificaciones.ver'))
            ->values();

        if ($destinatarios->isEmpty()) {
            return;
        }

        $meta = [
            'tipo' => 'sistema',
            'nivel' => 'info',
            ...$meta,
            'actor_id' => $actor->id,
            'sucursal_id' => $actor->sucursal_id,
        ];

        Notification::send($destinatarios, new SistemaNotificacion($titulo, $mensaje, $meta));
    }
}
