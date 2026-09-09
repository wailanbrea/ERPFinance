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
        Schema::create('financiamientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('venta_id')->constrained('ventas')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('clientes');

            $table->decimal('monto', 12, 2)->default(0);
            $table->decimal('inicial', 12, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);
            $table->decimal('interes', 5, 2)->default(0);
            $table->unsignedInteger('cuotas')->default(0);
            $table->string('frecuencia')->default('mensual')->index(); // semanal, quincenal, mensual
            $table->string('estado')->default('activo')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financiamientos');
    }
};
