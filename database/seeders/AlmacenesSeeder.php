<?php

namespace Database\Seeders;

use App\Models\Almacen;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class AlmacenesSeeder extends Seeder
{
    public function run(): void
    {
        $sucursales = Sucursal::query()->get(['id', 'codigo']);

        foreach ($sucursales as $sucursal) {
            Almacen::firstOrCreate(
                ['sucursal_id' => $sucursal->id, 'nombre' => 'Principal'],
                ['tipo' => 'principal', 'activo' => true]
            );

            Almacen::firstOrCreate(
                ['sucursal_id' => $sucursal->id, 'nombre' => 'Taller'],
                ['tipo' => 'taller', 'activo' => true]
            );

            Almacen::firstOrCreate(
                ['sucursal_id' => $sucursal->id, 'nombre' => 'Mercancía en tránsito'],
                ['tipo' => 'transito', 'activo' => true]
            );
        }
    }
}

