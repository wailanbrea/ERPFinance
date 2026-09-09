<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureErpPlanModule
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('planes.instalacion.plan') !== 'basico') {
            return $next($request);
        }

        $segment = $request->segment(1);
        if ($segment === null || $segment === '') {
            return $next($request);
        }

        $map = config('planes.segmento_a_modulo', []);
        $modulo = $map[$segment] ?? null;
        if ($modulo === null) {
            return $next($request);
        }

        $permitidos = array_keys(config('planes.basico.modulos', []));
        if (! in_array($modulo, $permitidos, true)) {
            abort(403, 'Este módulo no está incluido en el Plan Básico de esta instalación (ERP_PLAN=basico).');
        }

        return $next($request);
    }
}
