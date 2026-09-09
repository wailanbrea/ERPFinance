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
        Schema::create('ruta_cobro_compartidas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ruta_cobro_id')->constrained('rutas_cobro')->cascadeOnDelete();
            $table->date('fecha');
            $table->string('token', 80)->unique();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['ruta_cobro_id', 'fecha']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ruta_cobro_compartidas');
    }
};
