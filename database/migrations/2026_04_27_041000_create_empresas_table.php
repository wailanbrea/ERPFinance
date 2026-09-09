<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('slug')->unique();

            $table->string('plan')->default('full')->index(); // basico|full|personalizado
            $table->boolean('licencia_activa')->default(true)->index();
            $table->unsignedInteger('max_usuarios_empleados')->default(5);

            $table->date('inicio')->nullable()->index();          // día que empezó
            $table->date('proximo_pago')->nullable()->index();    // día que le toca pagar
            $table->date('ultimo_pago')->nullable()->index();     // último pago registrado
            $table->string('estado_pago')->default('al_dia')->index(); // al_dia|atrasado|suspendido

            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};

