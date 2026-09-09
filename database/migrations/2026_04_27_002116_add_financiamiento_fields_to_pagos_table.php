<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->foreignId('financiamiento_id')->nullable()->after('venta_id')
                ->constrained('financiamientos')->nullOnDelete();
            $table->foreignId('cuota_id')->nullable()->after('financiamiento_id')
                ->constrained('cuotas_financiamiento')->nullOnDelete();
            $table->string('estado_visita')->nullable()->after('nota')->index(); // pagado, promesa, no_pago, no_localizado
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cuota_id');
            $table->dropConstrainedForeignId('financiamiento_id');
            $table->dropColumn('estado_visita');
        });
    }
};
