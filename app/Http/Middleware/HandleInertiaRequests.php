<?php

namespace App\Http\Middleware;

use App\Models\Ajuste;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $lector = [
            'activo' => true,
            'auto_agregar' => true,
            'auto_sumar' => true,
            'limpiar_al_agregar' => true,
            'usar_sku' => true,
        ];

        if ($user) {
            $keys = [
                'lector.activo',
                'lector.auto_agregar',
                'lector.auto_sumar',
                'lector.limpiar_al_agregar',
                'lector.usar_sku',
            ];

            $vals = Ajuste::query()
                ->where('sucursal_id', $user->sucursal_id)
                ->whereIn('clave', $keys)
                ->get()
                ->keyBy('clave')
                ->map(fn ($a) => $a->valor)
                ->all();

            $bool = fn ($k, $def) => array_key_exists($k, $vals)
                ? in_array(strtolower((string) $vals[$k]), ['1', 'true', 'si', 'sí', 'yes'], true)
                : $def;

            $lector = [
                'activo' => $bool('lector.activo', true),
                'auto_agregar' => $bool('lector.auto_agregar', true),
                'auto_sumar' => $bool('lector.auto_sumar', true),
                'limpiar_al_agregar' => $bool('lector.limpiar_al_agregar', true),
                'usar_sku' => $bool('lector.usar_sku', true),
            ];
        }

        $planInstalacion = config('planes.instalacion.plan', 'full');
        $permisosLista = $user
            ? $user->getAllPermissions()->pluck('name')
            : collect();

        $empresa = null;
        $empresaPlan = null;
        $empresaLicenciaActiva = true;
        if ($user) {
            $empresa = $user->empresa ?: ($user->sucursal?->empresa);
            if ($empresa instanceof Empresa) {
                $empresaPlan = (string) ($empresa->plan ?? null);
                $empresaLicenciaActiva = (bool) ($empresa->licencia_activa ?? true);
            }
        }

        // En SaaS multi-empresa, el plan real viene de la Empresa.
        $planEfectivo = $empresaPlan ?: $planInstalacion;

        if ($user && $planEfectivo === 'basico') {
            $prefijosPlan = array_keys(config('planes.basico.modulos', []));
            $permisosLista = $permisosLista
                ->filter(function (string $name) use ($prefijosPlan) {
                    $prefijo = explode('.', $name)[0] ?? '';

                    return in_array($prefijo, $prefijosPlan, true);
                })
                ->values();
        } else {
            $permisosLista = $permisosLista->values();
        }

        $modulosAssoc = config("planes.{$planEfectivo}.modulos", []);
        $modulosIncluidos = [];
        foreach ($modulosAssoc as $clave => $nombre) {
            $modulosIncluidos[] = ['clave' => $clave, 'nombre' => $nombre];
        }

        $demoEmails = (array) config('demo.user_emails', []);
        if (empty($demoEmails)) {
            $single = (string) config('demo.user_email', '');
            if ($single !== '') {
                $demoEmails = [$single];
            }
        }

        $isDemoUser = false;
        if ($user) {
            foreach ($demoEmails as $email) {
                if ($user->email && strcasecmp((string) $user->email, (string) $email) === 0) {
                    $isDemoUser = true;
                    break;
                }
            }
        }

        $notificaciones = [
            'unreadCount' => 0,
            'latest' => [],
        ];

        if ($user && $user->can('notificaciones.ver')) {
            $notificaciones['unreadCount'] = $user->unreadNotifications()->count();
            $notificaciones['latest'] = $user->notifications()
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();
        }

        $ownerEmail = strtolower(trim((string) env('SUPERADMIN_OWNER_EMAIL', 'wailandkey@gmail.com')));
        $esSuperadminPanel = $user
            && $ownerEmail !== ''
            && strcasecmp((string) $user->email, $ownerEmail) === 0
            && $user->hasRole('SuperAdmin');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'roles' => $user ? $user->getRoleNames() : [],
                'permisos' => $permisosLista,
                'es_superadmin_panel' => (bool) $esSuperadminPanel,
            ],
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'nombre' => $empresa->nombre,
                'slug' => $empresa->slug,
                'plan' => $empresa->plan,
                'licencia_activa' => (bool) $empresaLicenciaActiva,
                'max_usuarios_empleados' => (int) ($empresa->max_usuarios_empleados ?? 0),
                'inicio' => $empresa->inicio?->toDateString(),
                'proximo_pago' => $empresa->proximo_pago?->toDateString(),
                'ultimo_pago' => $empresa->ultimo_pago?->toDateString(),
                'estado_pago' => $empresa->estado_pago,
            ] : null,
            'licencia' => [
                'plan' => $planEfectivo,
                'planNombre' => config("planes.{$planEfectivo}.nombre", $planEfectivo),
                'modulosIncluidos' => $modulosIncluidos,
            ],
            'demo' => [
                'enabled' => (bool) config('demo.enabled', false),
                'isDemoUser' => (bool) $isDemoUser,
            ],
            'notificaciones' => $notificaciones,
            'flash' => [
                'success' => $request->session()->get('success'),
                'warning' => $request->session()->get('warning'),
                'error' => $request->session()->get('error'),
            ],
            'config' => [
                'lector' => $lector,
                'plan_personalizado' => [
                    'moneda' => (string) config('modulos.moneda', 'RD$'),
                    'periodo' => (string) config('modulos.periodo', 'mensual'),
                    'precio_base' => (float) config('modulos.precio_base', 0),
                    'catalogo' => config('modulos.catalogo', []),
                ],
            ],
        ];
    }
}
