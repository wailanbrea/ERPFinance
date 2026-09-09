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
        Schema::create('garantias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('venta_id')->nullable()->constrained('ventas')->nullOnDelete();
            $table->foreignId('detalle_venta_id')->nullable()->constrained('detalle_ventas')->nullOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->foreignId('producto_id')->constrained('productos');
            $table->foreignId('usuario_id')->constrained('users');

            $table->date('fecha_reclamo')->index();
            $table->string('tipo')->default('fabricante')->index(); // fabricante/tienda
            $table->string('estado')->default('abierta')->index(); // abierta/en_proceso/resuelta/rechazada/cerrada
            $table->string('motivo')->nullable();
            $table->text('descripcion')->nullable();
            $table->text('diagnostico')->nullable();
            $table->text('resolucion')->nullable();
            $table->date('fecha_cierre')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('garantias');
    }
};
