<?php

namespace App\Console\Commands;

use App\Models\Producto;
use App\Support\PrecioMayorRd;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RellenarPrecioMayorProductosCommand extends Command
{
    protected $signature = 'productos:rellenar-precio-mayor
                            {--regimen=rd : rd = reglas mercado RD (config/precios_mayor.php), simple = solo factor sobre contado}
                            {--factor=0.92 : Con regimen=simple: multiplicador sobre precio al contado}
                            {--dry-run : Mostrar conteos y muestra sin guardar}
                            {--only-missing : Solo productos cuyo precio_mayor sea NULL o 0}';

    protected $description = 'Asigna precio_mayor: por defecto reglas tipo mercado RD (descuento mayorista, piso sobre costo, techo vs contado).';

    public function handle(): int
    {
        $regimen = strtolower((string) $this->option('regimen'));
        if (! in_array($regimen, ['rd', 'simple'], true)) {
            $this->error('regimen debe ser rd o simple.');

            return self::FAILURE;
        }

        $onlyMissing = (bool) $this->option('only-missing');

        $baseQuery = DB::table('productos')->where('precio_contado', '>', 0);
        if ($onlyMissing) {
            $baseQuery->where(function ($q) {
                $q->whereNull('precio_mayor')->orWhere('precio_mayor', '<=', 0);
            });
        }

        $toUpdate = (clone $baseQuery)->count();
        $sinContado = DB::table('productos')
            ->where(function ($q) {
                $q->whereNull('precio_contado')->orWhere('precio_contado', '<=', 0);
            })
            ->count();

        if ($regimen === 'rd') {
            $this->mostrarReglasRd();
        } else {
            $factor = (float) $this->option('factor');
            if ($factor <= 0 || $factor > 1) {
                $this->error('Con regimen=simple, el factor debe ser > 0 y ≤ 1.');

                return self::FAILURE;
            }
            $this->info("Régimen simple: precio_mayor = ROUND(precio_contado × {$factor}, 2)");
        }

        $this->line("Productos con contado > 0 a considerar: {$toUpdate}");
        $this->line("Productos sin precio al contado válido (precio_mayor → NULL): {$sinContado}");

        if ($this->option('dry-run')) {
            if ($regimen === 'rd' && $toUpdate > 0) {
                $muestra = Producto::query()
                    ->where('precio_contado', '>', 0)
                    ->when($onlyMissing, function ($q) {
                        $q->where(function ($w) {
                            $w->whereNull('precio_mayor')->orWhere('precio_mayor', '<=', 0);
                        });
                    })
                    ->orderBy('id')
                    ->limit(5)
                    ->get(['id', 'sku', 'nombre', 'costo', 'precio_contado', 'precio_mayor']);

                $this->newLine();
                $this->warn('Muestra (5 primeros) — precio_mayor calculado RD:');
                foreach ($muestra as $p) {
                    $nuevo = PrecioMayorRd::sugerido((float) $p->precio_contado, $p->costo !== null ? (float) $p->costo : null);
                    $this->line(sprintf(
                        '  id=%s sku=%s contado=%s costo=%s → mayor=%s (actual en BD: %s)',
                        $p->id,
                        $p->sku,
                        $p->precio_contado,
                        $p->costo ?? '—',
                        $nuevo ?? '—',
                        $p->precio_mayor ?? '—'
                    ));
                }
            }
            $this->warn('Dry-run: no se ha guardado nada.');

            return self::SUCCESS;
        }

        $updated = 0;
        DB::transaction(function () use ($regimen, $onlyMissing, &$updated) {
            if ($regimen === 'rd') {
                Producto::query()
                    ->where('precio_contado', '>', 0)
                    ->when($onlyMissing, function ($q) {
                        $q->where(function ($w) {
                            $w->whereNull('precio_mayor')->orWhere('precio_mayor', '<=', 0);
                        });
                    })
                    ->orderBy('id')
                    ->chunkById(200, function ($productos) use (&$updated) {
                        foreach ($productos as $p) {
                            $nuevo = PrecioMayorRd::sugerido(
                                (float) $p->precio_contado,
                                $p->costo !== null ? (float) $p->costo : null
                            );
                            if ($nuevo === null) {
                                continue;
                            }
                            $actual = $p->precio_mayor !== null ? round((float) $p->precio_mayor, 2) : null;
                            if ($actual === $nuevo) {
                                continue;
                            }
                            DB::table('productos')->where('id', $p->id)->update(['precio_mayor' => $nuevo]);
                            $updated++;
                        }
                    });
            } else {
                $factor = (float) $this->option('factor');
                $factorSql = rtrim(rtrim(number_format($factor, 8, '.', ''), '0'), '.') ?: '0';
                $q = DB::table('productos')->where('precio_contado', '>', 0);
                if ($onlyMissing) {
                    $q->where(function ($w) {
                        $w->whereNull('precio_mayor')->orWhere('precio_mayor', '<=', 0);
                    });
                }
                $updated = $q->update([
                    'precio_mayor' => DB::raw('ROUND(precio_contado * '.$factorSql.', 2)'),
                ]);
            }

            DB::table('productos')
                ->where(function ($w) {
                    $w->whereNull('precio_contado')->orWhere('precio_contado', '<=', 0);
                })
                ->update(['precio_mayor' => null]);
        });

        $this->info("Productos actualizados (cambio de valor o nuevo): {$updated}");
        $this->info('Productos sin contado válido: precio_mayor dejado en NULL.');

        return self::SUCCESS;
    }

    private function mostrarReglasRd(): void
    {
        $rd = config('precios_mayor.rd', []);
        $d = (float) ($rd['descuento_sobre_contado'] ?? 0.12) * 100;
        $m = (float) ($rd['margen_minimo_sobre_costo'] ?? 0.03) * 100;
        $t = (float) ($rd['techo_ratio_contado'] ?? 0.998) * 100;

        $this->info('Régimen RD (práctica mercado / márgenes, ver config/precios_mayor.php):');
        $this->line(sprintf('  • Base mayorista: precio contado menos %.2f %% (descuento típico mayorista 10–15 %%).', $d));
        $this->line(sprintf('  • Piso: si hay costo, al menos costo + %.2f %% (sostenibilidad).', $m));
        $this->line(sprintf('  • Techo: como máximo %.1f %% del precio al contado (canal por debajo del detalle).', $t));
        $this->line('  • Redondeo: 2 decimales (RD$). El ITBIS (18 %) en factura depende de tu configuración de ventas, no de este cálculo.');
    }
}
