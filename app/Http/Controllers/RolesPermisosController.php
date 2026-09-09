<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesPermisosController extends Controller
{
    public function index()
    {
        $roles = Role::query()
            ->withCount('permissions')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $r) => ['id' => $r->id, 'name' => $r->name, 'permissions_count' => $r->permissions_count]);

        $permisos = Permission::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('RolesPermisos/Index', [
            'roles' => $roles,
            'permisos' => $permisos,
        ]);
    }
}
