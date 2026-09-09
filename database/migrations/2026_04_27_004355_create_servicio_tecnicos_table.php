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
        Schema::create('servicio_tecnicos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('venta_id')->nullable()->constrained('ventas')->nullOnDelete();
            $table->foreignId('detalle_venta_id')->nullable()->constrained('detalle_ventas')->nullOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->foreignId('producto_id')->constrained('productos');
            $table->foreignId('usuario_id')->constrained('users');

            $table->string('numero')->nullable()->index();
            $table->date('fecha_ingreso')->index();
            $table->string('estado')->default('recibido')->index(); // recibido/diagnostico/reparacion/listo/entregado/cancelado
            $table->text('falla_reportada')->nullable();
            $table->text('diagnostico')->nullable();
            $table->text('trabajo_realizado')->nullable();
            $table->decimal('costo', 12, 2)->default(0);
            $table->decimal('adelanto', 12, 2)->default(0);
            $table->date('fecha_entrega')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servicio_tecnicos');
    }
};
