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
        Schema::create('movimientos_caja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->foreignId('caja_id')->constrained('cajas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->constrained('users');
            $table->dateTime('fecha')->index();
            $table->string('tipo')->index(); // entrada/salida
            $table->string('concepto')->nullable();
            $table->decimal('monto', 12, 2)->default(0);
            $table->text('nota')->nullable();

            $table->string('referencia_tipo')->nullable()->index();
            $table->unsignedBigInteger('referencia_id')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_caja');
    }
};
