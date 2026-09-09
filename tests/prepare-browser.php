<?php

// Creates ONLY a new, isolated SQLite fixture. Never loads the ERP's MySQL database.
require dirname(__DIR__).'/vendor/autoload.php';
$database = dirname(__DIR__).'/storage/app/browser-verification.sqlite';
if (file_exists($database)) {
    fwrite(STDERR, "The browser fixture already exists; refusing to overwrite.\n");
    exit(1);
}
touch($database);
foreach (['APP_ENV' => 'testing', 'APP_URL' => 'http://localhost:8000', 'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => $database, 'DB_URL' => '', 'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'file'] as $key => $value) {
    putenv($key.'='.$value); $_ENV[$key] = $value; $_SERVER[$key] = $value;
}
$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== $database) throw new RuntimeException('Fixture isolation failed');
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
$empresa = App\Models\Empresa::create(['nombre' => 'ERP Verificación', 'slug' => 'erp-verificacion', 'plan' => 'full', 'licencia_activa' => true]);
$sucursal = App\Models\Sucursal::create(['empresa_id' => $empresa->id, 'nombre' => 'Pruebas']);
$user = App\Models\User::factory()->create(['name' => 'Verificación', 'email' => 'verification@example.test', 'empresa_id' => $empresa->id, 'sucursal_id' => $sucursal->id]);
foreach (['configuracion.ver', 'configuracion.editar', 'facturas.ver', 'facturas.imprimir', 'caja.ver', 'caja.crear'] as $permission) {
    $user->givePermissionTo(Spatie\Permission\Models\Permission::findOrCreate($permission, 'web'));
}
$almacen = App\Models\Almacen::create(['sucursal_id' => $sucursal->id, 'nombre' => 'Pruebas']);
App\Models\Venta::create(['sucursal_id' => $sucursal->id, 'usuario_id' => $user->id, 'almacen_id' => $almacen->id, 'tipo' => 'contado', 'fecha' => '2026-09-08', 'subtotal' => 100, 'impuesto' => 18, 'total' => 118]);
echo "Isolated browser fixture ready.\n";
