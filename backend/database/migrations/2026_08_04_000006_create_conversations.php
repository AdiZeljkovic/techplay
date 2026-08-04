<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The Social Hub's chat backbone. `messages` has always been strictly
 * sender → receiver, which cannot express a group. Rather than run a second
 * chat system beside it, every message now belongs to a conversation, and a
 * conversation knows who is in it — direct, group, or a clan's room.
 *
 * Existing DMs are backfilled into direct conversations, so nothing that has
 * already been said is lost or orphaned.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('type', 12)->default('direct'); // direct | group | clan
            $table->string('name', 80)->nullable();        // groups only
            $table->string('image')->nullable();
            $table->foreignId('clan_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            // Denormalised so the conversation list sorts without touching messages.
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'last_message_at']);
            $table->unique('clan_id');
        });

        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 12)->default('member'); // owner | member
            // Unread is derived from this, not stored as a counter that drifts.
            $table->timestamp('last_read_at')->nullable();
            $table->boolean('muted')->default(false);
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['conversation_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('conversation_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_type', 16)->nullable(); // image
            $table->index('conversation_id');
        });

        Schema::create('message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('emoji', 8);
            $table->timestamps();

            // One of each emoji per person per message — a toggle, not a tally.
            $table->unique(['message_id', 'user_id', 'emoji']);
        });

        $this->backfillDirectConversations();
    }

    /**
     * Every existing sender/receiver pair becomes one direct conversation,
     * and its messages are attached to it in a single pass per pair.
     */
    private function backfillDirectConversations(): void
    {
        $pairs = DB::table('messages')
            ->whereNotNull('sender_id')
            ->whereNotNull('receiver_id')
            ->selectRaw('DISTINCT sender_id, receiver_id')
            ->get();

        $seen = [];

        foreach ($pairs as $pair) {
            $a = min((int) $pair->sender_id, (int) $pair->receiver_id);
            $b = max((int) $pair->sender_id, (int) $pair->receiver_id);
            $key = "{$a}:{$b}";

            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;

            $last = DB::table('messages')
                ->where(fn ($q) => $q->where('sender_id', $a)->where('receiver_id', $b))
                ->orWhere(fn ($q) => $q->where('sender_id', $b)->where('receiver_id', $a))
                ->max('created_at');

            $conversationId = DB::table('conversations')->insertGetId([
                'type' => 'direct',
                'last_message_at' => $last,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ([$a, $b] as $userId) {
                DB::table('conversation_participants')->insert([
                    'conversation_id' => $conversationId,
                    'user_id' => $userId,
                    'role' => 'member',
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('messages')
                ->where(function ($q) use ($a, $b) {
                    $q->where(fn ($w) => $w->where('sender_id', $a)->where('receiver_id', $b))
                        ->orWhere(fn ($w) => $w->where('sender_id', $b)->where('receiver_id', $a));
                })
                ->update(['conversation_id' => $conversationId]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reactions');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('conversation_id');
            $table->dropColumn(['attachment_path', 'attachment_type']);
        });

        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
    }
};
