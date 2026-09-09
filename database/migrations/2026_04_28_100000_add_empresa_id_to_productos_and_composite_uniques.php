<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->foreignId('empresa_id')->nullable()->after('id')->constrained('empresas');
        });

        $defaultEmpresaId = DB::table('empresas')->orderBy('id')->value('id');
        if ($defaultEmpresaId) {
            foreach (DB::table('productos')->orderBy('id')->pluck('id') as $pid) {
                $eid = DB::table('stock_productos')
                    ->join('almacenes', 'almacenes.id', '=', 'stock_productos.almacen_id')
                    ->join('sucursales', 'sucursales.id', '=', 'almacenes.sucursal_id')
                    ->where('stock_productos.producto_id', $pid)
                    ->whereNotNull('sucursales.empresa_id')
                    ->value('sucursales.empresa_id');

                DB::table('productos')->where('id', $pid)->update([
                    'empresa_id' => $eid ?: $defaultEmpresaId,
                ]);
            }
        }

        Schema::table('productos', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->dropUnique(['codigo_barra']);
            $table->dropUnique(['qr']);
        });

        Schema::table('productos', function (Blueprint $table) {
            $table->unique(['empresa_id', 'sku'], 'productos_empresa_id_sku_unique');
            $table->unique(['empresa_id', 'codigo_barra'], 'productos_empresa_id_codigo_barra_unique');
            $table->unique(['empresa_id', 'qr'], 'productos_empresa_id_qr_unique');
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropUnique('productos_empresa_id_sku_unique');
            $table->dropUnique('productos_empresa_id_codigo_barra_unique');
            $table->dropUnique('productos_empresa_id_qr_unique');
        });

        Schema::table('productos', function (Blueprint $table) {
            $table->unique('sku');
            $table->unique('codigo_barra');
            $table->unique('qr');
        });

        Schema::table('productos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('empresa_id');
        });
    }
};
