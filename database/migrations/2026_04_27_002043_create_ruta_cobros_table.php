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
        Schema::create('rutas_cobro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales');
            $table->string('nombre');
            $table->string('dia')->nullable(); // lunes...domingo
            $table->string('sector')->nullable();
            $table->string('frecuencia')->nullable(); // semanal/quincenal/mensual
            $table->foreignId('cobrador_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rutas_cobro');
    }
};
