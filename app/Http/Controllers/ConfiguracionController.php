<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Ajuste;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfiguracionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $claves = [
            'empresa.nombre',
            'empresa.rnc',
            'ventas.itbis_porcentaje',
            'financiamiento.interes_porcentaje',
            'cobros.mora_diaria',
            'lector.activo',
            'lector.auto_agregar',
            'lector.auto_sumar',
            'lector.limpiar_al_agregar',
            'lector.usar_sku',
        ];

        $ajustes = Ajuste::query()
            ->where(function ($q) use ($user) {
                $q->whereNull('sucursal_id')->orWhere('sucursal_id', $user->sucursal_id);
            })
            ->whereIn('clave', $claves)
            ->get()
            ->keyBy('clave')
            ->map(fn ($a) => $a->valor)
            ->all();

        $agenteToken = Ajuste::query()
            ->where(function ($q) use ($user) {
                $q->whereNull('sucursal_id')->orWhere('sucursal_id', $user->sucursal_id);
            })
            ->where('clave', 'agente.token')
            ->value('valor');

        if (! $agenteToken) {
            $agenteToken = bin2hex(random_bytes(16));
            Ajuste::query()->create([
                'sucursal_id' => $user->sucursal_id,
                'clave' => 'agente.token',
                'valor' => $agenteToken,
            ]);
        }

        return Inertia::render('Configuracion/Index', [
            'ajustes' => $ajustes,
            'claves' => $claves,
            'agenteToken' => $agenteToken,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'ajustes' => ['required', 'array'],
        ]);

        foreach ($data['ajustes'] as $clave => $valor) {
            Ajuste::query()->updateOrCreate(
                ['sucursal_id' => $user->sucursal_id, 'clave' => (string) $clave],
                ['valor' => is_scalar($valor) ? (string) $valor : json_encode($valor)]
            );
        }

        return back()->with('success', 'Configuración guardada.');
    }

    public function descargarAgente(Request $request)
    {
        $baseZipPath = public_path('downloads/BSM-POS-Agent.zip');
        if (! file_exists($baseZipPath)) {
            return redirect('https://github.com/wailanbrea/bsmpos-windows-agent');
        }

        $user = $request->user();
        $currentHost = $request->getSchemeAndHttpHost();

        // Obtener o generar token único del agente para esta sucursal/empresa
        $token = Ajuste::query()
            ->where(function ($q) use ($user) {
                $q->whereNull('sucursal_id')->orWhere('sucursal_id', $user?->sucursal_id);
            })
            ->where('clave', 'agente.token')
            ->value('valor');

        if (! $token) {
            $token = bin2hex(random_bytes(16));
            Ajuste::query()->create([
                'sucursal_id' => $user?->sucursal_id,
                'clave' => 'agente.token',
                'valor' => $token,
            ]);
        }

        $terminalId = 'BSMPOS-EMP' . ($user?->empresa_id ?? '1') . '-SUC' . ($user?->sucursal_id ?? '1');

        $appConfContent = "ktor {\n"
            . "    deployment {\n"
            . "        port = 8765\n"
            . "        host = \"127.0.0.1\"\n"
            . "    }\n"
            . "    application {\n"
            . "        modules = [ com.bsmpos.agent.ApplicationKt.module ]\n"
            . "    }\n"
            . "}\n\n"
            . "agent {\n"
            . "    host = \"127.0.0.1\"\n"
            . "    port = 8765\n"
            . "    version = \"0.1.0\"\n"
            . "    printer {\n"
            . "        name = \"\"\n"
            . "    }\n"
            . "    drawer {\n"
            . "        enabled = true\n"
            . "    }\n"
            . "    paper_width_mm = 80\n"
            . "    encoding = \"UTF-8\"\n"
            . "    terminal_id = \"{$terminalId}\"\n"
            . "    security {\n"
            . "        token = \"{$token}\"\n"
            . "        allowed_origins = [\n"
            . "            \"{$currentHost}\",\n"
            . "            \"http://localhost:8000\",\n"
            . "            \"http://127.0.0.1:8000\"\n"
            . "        ]\n"
            . "        rate_limit_per_minute = 120\n"
            . "    }\n"
            . "}\n";

        $tempZip = tempnam(sys_get_temp_dir(), 'agent_pkg_') . '.zip';
        copy($baseZipPath, $tempZip);

        $zip = new \ZipArchive();
        if ($zip->open($tempZip) === true) {
            $zip->addFromString('BSM-POS-Agent/application.conf', $appConfContent);
            $zip->close();
        }

        $companySlug = $user?->empresa?->nombre ? \Illuminate\Support\Str::slug($user->empresa->nombre) : 'terminal';
        $downloadName = "BSM-POS-Agent-{$companySlug}.zip";

        return response()->download($tempZip, $downloadName, [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }
}
