<?php

// Migra todo lo que esté en empresa "central" hacia empresa "owner" y elimina "central".
// Esto elimina el duplicado de tu empresa y conserva la información operativa.

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$central = Empresa::query()->where('slug', 'central')->first();
$owner = Empresa::query()->where('slug', 'owner')->first();

if (! $central || ! $owner) {
    fwrite(STDERR, "ERROR: Se requiere slug=central y slug=owner.\n");
    exit(1);
}

DB::transaction(function () use ($central, $owner) {
    // Copiar "info" si en owner está vacío.
    foreach (['inicio', 'proximo_pago', 'ultimo_pago', 'estado_pago', 'nota', 'max_usuarios_empleados', 'plan'] as $k) {
        $ownerVal = $owner->{$k};
        $centralVal = $central->{$k};

        $empty = $ownerVal === null || $ownerVal === '' || (is_int($ownerVal) && $ownerVal === 0);
        if ($empty && $centralVal !== null && $centralVal !== '') {
            $owner->{$k} = $centralVal;
        }
    }
    if (! $owner->admin_user_id && $central->admin_user_id) {
        $owner->admin_user_id = $central->admin_user_id;
    }
    $owner->save();

    // Mover sucursales y usuarios.
    Sucursal::query()->where('empresa_id', $central->id)->update(['empresa_id' => $owner->id]);
    User::query()->where('empresa_id', $central->id)->update(['empresa_id' => $owner->id]);

    // Evitar que central quede apuntando a un admin inexistente.
    $central->admin_user_id = null;
    $central->save();

    $central->delete();
});

echo "OK: central migrada a owner y eliminada.\n";

