<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        Permission::create(['name' => 'view admin panel']);
        Permission::create(['name' => 'manage users']);
        Permission::create(['name' => 'manage content']);
        Permission::create(['name' => 'publish articles']);
        Permission::create(['name' => 'delete articles']);
        Permission::create(['name' => 'moderate forum']);

        // create roles and assign created permissions

        // Moderator
        $role = Role::create(['name' => 'Moderator']);
        $role->givePermissionTo('moderate forum');
        $role->givePermissionTo('view admin panel');

        // Journalist
        $role = Role::create(['name' => 'Journalist']);
        $role->givePermissionTo('view admin panel');
        $role->givePermissionTo('manage content');

        // Editor
        $role = Role::create(['name' => 'Editor']);
        $role->givePermissionTo('view admin panel');
        $role->givePermissionTo('manage content');
        $role->givePermissionTo('publish articles');

        // Editor-in-Chief
        $role = Role::create(['name' => 'Editor-in-Chief']);
        $role->givePermissionTo('view admin panel');
        $role->givePermissionTo('manage content');
        $role->givePermissionTo('publish articles');
        $role->givePermissionTo('delete articles');
        $role->givePermissionTo('manage users');

        // Super Admin
        $role = Role::create(['name' => 'Super Admin']);
        $role->givePermissionTo(Permission::all());
    }
}
