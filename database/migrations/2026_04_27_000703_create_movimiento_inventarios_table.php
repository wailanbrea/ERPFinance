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
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('almacen_id')->constrained('almacenes');
            $table->foreignId('producto_id')->constrained('productos');

            $table->string('tipo')->index(); // entrada, salida, transferencia, ajuste
            $table->decimal('cantidad', 12, 2);
            $table->decimal('saldo', 12, 2)->default(0);
            $table->string('referencia_tipo')->nullable(); // compra, venta, transferencia, ajuste
            $table->unsignedBigInteger('referencia_id')->nullable();
            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
    }
};
