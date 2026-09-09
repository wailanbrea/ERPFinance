<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('garantias', function (Blueprint $table) {
            $table->foreignId('servicio_tecnico_id')
                ->nullable()
                ->after('usuario_id')
                ->constrained('servicio_tecnicos')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('garantias', function (Blueprint $table) {
            $table->dropConstrainedForeignId('servicio_tecnico_id');
        });
    }
};

