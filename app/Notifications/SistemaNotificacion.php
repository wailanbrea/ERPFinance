<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SistemaNotificacion extends Notification
{
    use Queueable;

    public function __construct(
        public string $titulo,
        public string $mensaje = '',
        public ?array $meta = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'titulo' => $this->titulo,
            'mensaje' => $this->mensaje,
            'meta' => $this->meta,
        ];
    }
}

