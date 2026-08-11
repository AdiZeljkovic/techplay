<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Brings the last accounts that hold power only through `users.role` into
 * Spatie, so authorization can stop asking two different questions.
 *
 * The column and the roles table have been running side by side since Spatie
 * was introduced. Every gate in the codebase checked both, which is why the
 * same person could be staff at one endpoint and not at another — and why
 * revoking a Spatie role did not necessarily revoke access.
 *
 * The admin panel only ever edited Spatie roles, so in practice everyone with
 * real privileges already has one. This is the safety net for whatever a
 * database this migration has not seen may still hold.
 *
 * Deliberately narrow: it only touches users who have **no Spatie role at all**
 * and a privileged column value. It cannot downgrade anyone, and it cannot
 * change a user an administrator has already assigned properly.
 */
return new class extends Migration
{
    /** What the code granted the column, expressed as the role it matched. */
    private const COLUMN_TO_ROLE = [
        'super_admin' => 'Super Admin',
        'admin' => 'Super Admin',
        'editor' => 'Editor',
        'moderator' => 'Moderator',
        'journalist' => 'Journalist',
    ];

    public function up(): void
    {
        $roleIds = DB::table('roles')->pluck('id', 'name');
        $granted = [];

        foreach (self::COLUMN_TO_ROLE as $column => $roleName) {
            $roleId = $roleIds[$roleName] ?? null;

            if (! $roleId) {
                continue; // that role does not exist here; nothing to grant
            }

            $orphans = DB::table('users')
                ->where('role', $column)
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('model_has_roles')
                        ->whereColumn('model_has_roles.model_id', 'users.id')
                        ->where('model_has_roles.model_type', 'App\Models\User');
                })
                ->pluck('id');

            foreach ($orphans as $userId) {
                DB::table('model_has_roles')->insert([
                    'role_id' => $roleId,
                    'model_type' => 'App\Models\User',
                    'model_id' => $userId,
                ]);

                $granted[] = ['user_id' => $userId, 'role' => $roleName, 'from_column' => $column];
            }
        }

        if ($granted !== []) {
            // Worth a log line rather than silence: this hands somebody
            // privileges, and whoever runs the deploy should be able to see
            // exactly whom.
            Log::info('Legacy role column migrated to Spatie', ['granted' => $granted]);
        }
    }

    public function down(): void
    {
        // Not reversed. Removing role assignments would be guessing which ones
        // this migration created, and getting that wrong locks people out.
    }
};
