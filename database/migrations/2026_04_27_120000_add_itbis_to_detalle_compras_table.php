<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->boolean('itbis_aplica')->default(true)->after('costo_unitario');
            $table->decimal('itbis_tasa', 5, 2)->default(18)->after('itbis_aplica'); // %
            $table->decimal('costo_unitario_con_itbis', 12, 2)->default(0)->after('itbis_tasa');
        });
    }

    public function down(): void
    {
        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->dropColumn(['itbis_aplica', 'itbis_tasa', 'costo_unitario_con_itbis']);
        });
    }
};

