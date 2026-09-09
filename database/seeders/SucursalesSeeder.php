<?php

namespace Database\Seeders;

use App\Models\Sucursal;
use Illuminate\Database\Seeder;

class SucursalesSeeder extends Seeder
{
    public function run(): void
    {
        Sucursal::firstOrCreate(
            ['codigo' => 'CENTRAL'],
            ['nombre' => 'Sucursal Central', 'activa' => true]
        );

        Sucursal::firstOrCreate(
            ['codigo' => 'NORTE'],
            ['nombre' => 'Sucursal Norte', 'activa' => true]
        );
    }
}

