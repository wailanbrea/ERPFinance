<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\DireccionCliente;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class ClientesUbicacionesDemoSeeder extends Seeder
{
    public function run(): void
    {
        $sucursal = Sucursal::query()->where('codigo', 'CENTRAL')->first();
        if (!$sucursal) {
            return;
        }

        $clientes = Cliente::query()
            ->where('sucursal_id', $sucursal->id)
            ->orderBy('id')
            ->get(['id', 'direccion', 'referencias']);

        if ($clientes->isEmpty()) {
            return;
        }

        // Coordenadas demo (RD): Santo Domingo / Santiago (bounding boxes)
        $zonas = [
            // [latMin, latMax, lngMin, lngMax]
            'Santo Domingo' => [18.4300, 18.5200, -70.0200, -69.8500],
            'Santiago' => [19.4300, 19.5000, -70.7400, -70.6300],
        ];

        foreach ($clientes as $idx => $c) {
            $dir = DireccionCliente::query()->firstOrCreate(
                ['cliente_id' => $c->id, 'tipo' => 'principal'],
                ['direccion' => (string) ($c->direccion ?? ''), 'referencia' => $c->referencias ? (string) $c->referencias : null, 'principal' => true],
            );

            $dir->principal = true;
            if (!$dir->direccion && $c->direccion) {
                $dir->direccion = (string) $c->direccion;
            }
            if (!$dir->referencia && $c->referencias) {
                $dir->referencia = (string) $c->referencias;
            }

            // Si ya tiene coordenadas, respetarlas.
            if ($dir->lat !== null && $dir->lng !== null) {
                $dir->save();
                continue;
            }

            // Determinístico por cliente (misma salida en reseeds).
            $seed = (int) $c->id;
            $u1 = $this->fract(sin($seed * 12.9898) * 43758.5453);
            $u2 = $this->fract(sin(($seed + 999) * 78.233) * 43758.5453);

            $zona = ($idx % 2 === 0) ? 'Santo Domingo' : 'Santiago';
            [$latMin, $latMax, $lngMin, $lngMax] = $zonas[$zona];

            $lat = $latMin + (($latMax - $latMin) * $u1);
            $lng = $lngMin + (($lngMax - $lngMin) * $u2);

            $dir->lat = round($lat, 7);
            $dir->lng = round($lng, 7);
            $dir->geocode_source = 'import';
            $dir->geocode_updated_at = now();
            $dir->save();
        }
    }

    private function fract(float $x): float
    {
        return $x - floor($x);
    }
}

