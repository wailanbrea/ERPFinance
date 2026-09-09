<?php

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\AlmacenController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\BusquedaController;
use App\Http\Controllers\CobroController;
use App\Http\Controllers\RutaCobroController;
use App\Http\Controllers\GarantiaController;
use App\Http\Controllers\ServicioTecnicoController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\GastoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinanciamientoController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\RolesPermisosController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\DemoController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SuperAdmin\EmpresasController as SuperAdminEmpresasController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
    ]);
});

Route::get('/demo', [DemoController::class, 'enter'])
    ->middleware(['guest', 'demo_enabled'])
    ->name('demo.enter');

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified', 'erp_plan', 'empresa_licencia', 'demo_readonly'])
    ->name('dashboard');

Route::middleware(['auth', 'verified', 'erp_plan', 'empresa_licencia', 'demo_readonly'])->group(function () {
    Route::get('/notificaciones', [NotificacionController::class, 'index'])
        ->middleware('permission:notificaciones.ver')
        ->name('notificaciones.index');
    Route::post('/notificaciones/marcar-todas', [NotificacionController::class, 'marcarTodas'])
        ->middleware('permission:notificaciones.editar')
        ->name('notificaciones.marcar_todas');
    Route::post('/notificaciones/{id}/leida', [NotificacionController::class, 'marcarLeida'])
        ->middleware('permission:notificaciones.editar')
        ->whereUuid('id')
        ->name('notificaciones.marcar_leida');
    Route::post('/notificaciones/{id}/no-leida', [NotificacionController::class, 'marcarNoLeida'])
        ->middleware('permission:notificaciones.editar')
        ->whereUuid('id')
        ->name('notificaciones.marcar_no_leida');
    Route::delete('/notificaciones/{id}', [NotificacionController::class, 'destroy'])
        ->middleware('permission:notificaciones.eliminar')
        ->whereUuid('id')
        ->name('notificaciones.destroy');

    Route::resource('clientes', ClienteController::class)
        ->only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        ->middleware([
            'permission:clientes.ver|clientes.crear|clientes.editar|clientes.eliminar',
        ]);

    Route::resource('productos', ProductoController::class)
        ->only(['index'])
        ->middleware('permission:productos.ver');
    Route::resource('productos', ProductoController::class)
        ->only(['create', 'store'])
        ->middleware('permission:productos.crear');
    Route::resource('productos', ProductoController::class)
        ->only(['edit', 'update'])
        ->middleware('permission:productos.editar');
    Route::resource('productos', ProductoController::class)
        ->only(['destroy'])
        ->middleware('permission:productos.eliminar');

    Route::resource('categorias', CategoriaController::class)
        ->only(['index'])
        ->middleware('permission:productos.ver');
    Route::resource('categorias', CategoriaController::class)
        ->only(['create', 'store'])
        ->middleware('permission:productos.crear');
    Route::resource('categorias', CategoriaController::class)
        ->only(['edit', 'update'])
        ->middleware('permission:productos.editar');
    Route::resource('categorias', CategoriaController::class)
        ->only(['destroy'])
        ->middleware('permission:productos.eliminar');

    Route::resource('marcas', MarcaController::class)
        ->only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        ->middleware([
            'permission:productos.ver|productos.crear|productos.editar|productos.eliminar',
        ]);

    Route::resource('almacenes', AlmacenController::class)
        ->only(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'])
        ->middleware([
            'permission:almacenes.ver|almacenes.crear|almacenes.editar|almacenes.eliminar',
        ]);

    Route::get('/inventario', [InventarioController::class, 'index'])
        ->middleware('permission:inventario.ver')
        ->name('inventario.index');

    Route::resource('proveedores', ProveedorController::class)
        ->only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        ->middleware([
            'permission:compras.ver|compras.crear|compras.editar|compras.eliminar',
        ]);

    Route::resource('compras', CompraController::class)
        ->only(['index', 'create', 'store', 'show'])
        ->middleware([
            'permission:compras.ver|compras.crear',
        ]);

    Route::get('/ventas/por-mayor', [VentaController::class, 'mayor'])
        ->middleware('permission:ventas.ver')
        ->name('ventas.mayor');

    Route::get('/ventas', [VentaController::class, 'pos'])
        ->middleware('permission:ventas.ver')
        ->name('ventas.pos');

    Route::post('/ventas', [VentaController::class, 'store'])
        ->middleware('permission:ventas.crear')
        ->name('ventas.store');

    Route::get('/busqueda', [BusquedaController::class, 'index'])
        ->middleware('permission:clientes.ver|productos.ver|financiamientos.ver')
        ->name('busqueda.index');

    Route::get('/facturas', [FacturaController::class, 'index'])
        ->middleware('permission:facturas.ver')
        ->name('facturas.index');
    Route::get('/facturas/{venta}/ticket', [FacturaController::class, 'ticket'])
        ->middleware('permission:facturas.imprimir')
        ->name('facturas.ticket');
    Route::get('/facturas/{venta}/pdf', [FacturaController::class, 'pdf'])
        ->middleware('permission:facturas.ver|facturas.imprimir')
        ->name('facturas.pdf');

    Route::get('/financiamientos', [FinanciamientoController::class, 'index'])
        ->middleware('permission:financiamientos.ver')
        ->name('financiamientos.index');
    Route::get('/financiamientos/{financiamiento}', [FinanciamientoController::class, 'show'])
        ->middleware('permission:financiamientos.ver')
        ->name('financiamientos.show');

    Route::get('/cobros', [CobroController::class, 'index'])
        ->middleware('permission:cobros.ver')
        ->name('cobros.index');
    Route::post('/cobros', [CobroController::class, 'store'])
        ->middleware('permission:cobros.crear')
        ->name('cobros.store');

    Route::resource('rutas-cobro', RutaCobroController::class)
        ->parameters(['rutas-cobro' => 'rutaCobro'])
        ->only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        ->middleware([
            'permission:rutas_cobro.ver|rutas_cobro.crear|rutas_cobro.editar|rutas_cobro.eliminar',
        ]);

    Route::post('/rutas-cobro/{rutaCobro}/orden', [RutaCobroController::class, 'guardarOrden'])
        ->middleware('permission:rutas_cobro.editar')
        ->name('rutas_cobro.orden');

    Route::resource('garantias', GarantiaController::class)
        ->only(['index', 'create', 'store', 'edit', 'update'])
        ->middleware([
            'permission:garantias.ver|garantias.crear|garantias.editar',
        ]);

    Route::post('/garantias/{garantia}/enviar-servicio', [GarantiaController::class, 'enviarAServicio'])
        ->middleware('permission:garantias.editar')
        ->name('garantias.enviar_servicio');

    Route::get('/garantias/ventas/{venta}/detalles', [GarantiaController::class, 'detallesVenta'])
        ->middleware('permission:garantias.crear|garantias.editar|garantias.ver')
        ->name('garantias.venta_detalles');

    Route::resource('servicio-tecnico', ServicioTecnicoController::class)
        ->parameters(['servicio-tecnico' => 'servicioTecnico'])
        ->only(['index', 'create', 'store', 'edit', 'update'])
        ->middleware([
            'permission:servicio_tecnico.ver|servicio_tecnico.crear|servicio_tecnico.editar',
        ]);

    Route::get('/caja', [CajaController::class, 'index'])
        ->middleware('permission:caja.ver')
        ->name('caja.index');
    Route::post('/caja/abrir', [CajaController::class, 'abrir'])
        ->middleware('permission:caja.crear')
        ->name('caja.abrir');
    Route::post('/caja/movimiento', [CajaController::class, 'movimiento'])
        ->middleware('permission:caja.crear')
        ->name('caja.movimiento');
    Route::post('/caja/cerrar', [CajaController::class, 'cerrar'])
        ->middleware('permission:caja.editar')
        ->name('caja.cerrar');

    Route::resource('gastos', GastoController::class)
        ->only(['index', 'create', 'store'])
        ->middleware([
            'permission:gastos.ver|gastos.crear',
        ]);

    Route::get('/reportes', [ReporteController::class, 'index'])
        ->middleware('permission:reportes.ver')
        ->name('reportes.index');

    Route::get('/usuarios', [UsuarioController::class, 'index'])
        ->middleware('permission:usuarios.ver')
        ->name('usuarios.index');
    Route::post('/usuarios', [UsuarioController::class, 'store'])
        ->middleware('permission:usuarios.crear')
        ->name('usuarios.store');
    Route::patch('/usuarios/{user}', [UsuarioController::class, 'update'])
        ->middleware('permission:usuarios.editar')
        ->name('usuarios.update');

    Route::get('/roles-permisos', [RolesPermisosController::class, 'index'])
        ->middleware('permission:roles_permisos.ver')
        ->name('roles_permisos.index');

    Route::get('/configuracion', [ConfiguracionController::class, 'index'])
        ->middleware('permission:configuracion.ver')
        ->name('configuracion.index');
    Route::put('/configuracion', [ConfiguracionController::class, 'update'])
        ->middleware('permission:configuracion.editar')
        ->name('configuracion.update');
    Route::get('/configuracion/agente/descargar', [ConfiguracionController::class, 'descargarAgente'])
        ->middleware('permission:configuracion.ver')
        ->name('configuracion.agente.descargar');

    Route::prefix('superadmin')->middleware(['superadmin'])->group(function () {
        Route::get('/empresas', [SuperAdminEmpresasController::class, 'index'])->name('superadmin.empresas.index');
        Route::post('/empresas', [SuperAdminEmpresasController::class, 'store'])->name('superadmin.empresas.store');
        Route::patch('/empresas/{empresa}', [SuperAdminEmpresasController::class, 'update'])->name('superadmin.empresas.update');
        Route::delete('/empresas/{empresa}', [SuperAdminEmpresasController::class, 'destroy'])->name('superadmin.empresas.destroy');
        Route::post('/empresas/{empresa}/reset-clave-admin', [SuperAdminEmpresasController::class, 'resetClaveAdmin'])->name('superadmin.empresas.reset_clave_admin');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
