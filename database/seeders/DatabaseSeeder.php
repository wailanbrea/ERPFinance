<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SucursalesSeeder::class,
            RolesYPermisosSeeder::class,
            AlmacenesSeeder::class,
            ProductosDemoSeeder::class,
            StockProductosDemoSeeder::class,
            SmartTvDemoSeeder::class,
        ]);

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@erp-bsolutions.local'],
            [
                'name' => 'Administrador Bsolutions',
                'sucursal_id' => Sucursal::where('codigo', 'CENTRAL')->value('id'),
                'password' => bcrypt('admin1234'),
            ]
        );

        $admin->assignRole('Administrador');

        $suc = Sucursal::query()->whereKey($admin->sucursal_id)->first();
        if ($suc && ! $admin->empresa_id) {
            $admin->empresa_id = $suc->empresa_id ?? Empresa::query()->orderBy('id')->value('id');
            $admin->save();
        }

        // Los seeders operativos necesitan que el administrador y su empresa ya existan.
        $this->call([
            DemoCompletoSeeder::class,
            ClientesUbicacionesDemoSeeder::class,
            RutaCobroCincoClientesHoySeeder::class,
        ]);
    }
}
