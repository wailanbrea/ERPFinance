<?php

namespace App\Console\Commands;

use App\Models\Venta;
use Illuminate\Console\Command;

class AsignarNumerosFacturaVentaCommand extends Command
{
    protected $signature = 'ventas:asignar-numeros-factura {--dry-run : Solo mostrar cuántas filas se actualizarían}';

    protected $description = 'Rellena numero_factura (FAC-000001) en ventas que lo tengan vacío';

    public function handle(): int
    {
        $query = Venta::query()->where(function ($q) {
            $q->whereNull('numero_factura')->orWhere('numero_factura', '');
        });

        $count = (clone $query)->count();
        if ($count === 0) {
            $this->info('No hay ventas pendientes.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info("Dry-run: se actualizarían {$count} venta(s).");

            return self::SUCCESS;
        }

        $query->orderBy('id')->chunkById(200, function ($ventas) {
            foreach ($ventas as $v) {
                if ($v->numero_factura && trim((string) $v->numero_factura) !== '') {
                    continue;
                }
                $v->numero_factura = 'FAC-'.str_pad((string) $v->id, 6, '0', STR_PAD_LEFT);
                $v->saveQuietly();
            }
        });

        $this->info("Listo: {$count} venta(s) actualizadas.");

        return self::SUCCESS;
    }
}
