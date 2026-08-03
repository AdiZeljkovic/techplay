<?php

namespace Tests\Feature;

use App\Models\Customization;
use App\Models\RewardItem;
use App\Models\User;
use App\Models\UserCustomization;
use App\Services\BountyService;
use App\Services\RewardTierService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RewardStoreTest extends TestCase
{
    use RefreshDatabase;

    private function cosmetic(array $attrs = []): Customization
    {
        static $n = 0;
        $n++;

        return Customization::create(array_merge([
            'name' => 'Ring '.$n,
            'slug' => 'ring-'.$n,
            'type' => 'frame',
            'description' => 'A ring.',
            'cost' => 250,
            'value' => '#CD7F32',
            'is_active' => true,
            'rarity' => 'uncommon',
        ], $attrs));
    }

    private function reward(array $attrs = []): RewardItem
    {
        static $n = 0;
        $n++;

        return RewardItem::create(array_merge([
            'name' => 'Coupon '.$n,
            'slug' => 'coupon-'.$n,
            'description' => '10% off.',
            'cost' => 1000,
            'type' => 'discount',
            'stock' => 100,
            'is_active' => true,
            'rarity' => 'rare',
        ], $attrs));
    }

    public function test_the_catalog_serves_cosmetics_and_goods_from_one_endpoint(): void
    {
        $user = User::factory()->create(['bounty_balance' => 2000]);
        $this->cosmetic();
        $this->reward();

        $data = $this->actingAs($user)->getJson('/api/v1/rewards/catalog')->assertOk()->json('data');

        $this->assertCount(2, $data['items']);
        $this->assertSame(['cosmetic', 'reward'], collect($data['items'])->pluck('source')->sort()->values()->all());
        $this->assertSame(2000, $data['balance']);
    }

    public function test_a_reward_that_duplicates_a_cosmetic_appears_once(): void
    {
        $user = User::factory()->create(['bounty_balance' => 500]);
        $this->cosmetic(['slug' => 'bronze-ring', 'name' => 'Bronze Ring']);
        $this->reward(['slug' => 'bronze-profile-frame', 'name' => 'Bronze Profile Frame', 'type' => 'frame', 'cost' => 250, 'stock' => null]);

        $items = $this->actingAs($user)->getJson('/api/v1/rewards/catalog')->assertOk()->json('data.items');

        $this->assertCount(1, $items);
        // The cosmetic is canonical — it carries the value and the equip state.
        $this->assertSame('cosmetic', $items[0]['source']);
        $this->assertSame('bronze-ring', $items[0]['slug']);
        $this->assertSame('/customizations/'.Customization::first()->id.'/acquire', $items[0]['purchase']['path']);
    }

    public function test_each_entry_reports_what_the_viewer_can_do_with_it(): void
    {
        $user = User::factory()->create(['bounty_balance' => 300]);
        $cheap = $this->cosmetic(['cost' => 250]);
        $this->cosmetic(['cost' => 5000, 'name' => 'Expensive']);
        UserCustomization::create(['user_id' => $user->id, 'customization_id' => $cheap->id, 'is_equipped' => true]);

        $items = collect($this->actingAs($user)->getJson('/api/v1/rewards/catalog')->assertOk()->json('data.items'))
            ->keyBy('name');

        $this->assertTrue($items[$cheap->name]['owned']);
        $this->assertTrue($items[$cheap->name]['equipped']);
        $this->assertFalse($items['Expensive']['owned']);
        $this->assertFalse($items['Expensive']['affordable']);
    }

    public function test_supporter_gated_items_read_as_locked_rather_than_unaffordable(): void
    {
        $user = User::factory()->create(['bounty_balance' => 99999]);
        $this->cosmetic(['name' => 'Gold Prestige', 'cost' => 0, 'required_tier' => 'Gold', 'type' => 'theme']);

        $item = $this->actingAs($user)->getJson('/api/v1/rewards/catalog')->assertOk()->json('data.items.0');

        $this->assertTrue($item['tier_locked']);
        $this->assertTrue($item['limited']);
        $this->assertSame('Gold', $item['required_tier']);
    }

    public function test_award_only_badges_stay_out_of_the_store_until_they_are_earned(): void
    {
        $user = User::factory()->create();
        // cost 0, no tier, badge = granted by campaign, never sold.
        $badge = $this->cosmetic(['name' => 'Founder', 'type' => 'badge', 'cost' => 0]);

        $this->actingAs($user)->getJson('/api/v1/rewards/catalog')->assertOk()->assertJsonCount(0, 'data.items');

        UserCustomization::create(['user_id' => $user->id, 'customization_id' => $badge->id]);

        $this->actingAs($user)->getJson('/api/v1/rewards/catalog')->assertOk()->assertJsonCount(1, 'data.items');
    }

    public function test_category_chips_only_appear_for_shelves_that_hold_something(): void
    {
        $user = User::factory()->create();
        $this->cosmetic(['type' => 'frame']);
        $this->reward(['type' => 'discount']);

        $chips = collect($this->actingAs($user)->getJson('/api/v1/rewards/catalog')->assertOk()->json('data.categories'));

        $this->assertEqualsCanonicalizing(['Frames', 'Coupons', 'Limited'], $chips->pluck('id')->all());
        $this->assertSame(1, $chips->firstWhere('id', 'Frames')['count']);
    }

    public function test_the_wallet_reports_lifetime_earned_and_spent_not_just_the_balance(): void
    {
        $user = User::factory()->create();
        $bounty = app(BountyService::class);
        $bounty->award($user, 1000, 'Test earn', 'earn', false);
        $bounty->spend($user, 400, 'Test spend');

        $data = $this->actingAs($user)->getJson('/api/v1/bounty')->assertOk()->json('data');

        $this->assertSame(600, $data['balance']);
        $this->assertSame(1000, $data['earned_lifetime']);
        $this->assertSame(400, $data['spent_lifetime']);
    }

    public function test_the_reward_tier_climbs_on_bounty_earned_and_never_falls_when_it_is_spent(): void
    {
        $user = User::factory()->create();
        $bounty = app(BountyService::class);
        $bounty->award($user, 4000, 'Test earn', 'earn', false);

        $before = $this->actingAs($user)->getJson('/api/v1/bounty')->assertOk()->json('data.tier');
        $this->assertSame('Gold I', $before['name']);
        $this->assertSame('Gold II', $before['next']['name']);
        $this->assertSame(1000, $before['remaining']);

        $bounty->spend($user, 3900, 'Bought everything');

        $after = $this->actingAs($user)->getJson('/api/v1/bounty')->assertOk()->json('data.tier');
        $this->assertSame('Gold I', $after['name'], 'spending must not demote a tier');
    }

    public function test_the_top_of_the_ladder_has_no_next_rung(): void
    {
        $standing = app(RewardTierService::class)->standing(999_999);

        $this->assertSame('Platinum III', $standing['name']);
        $this->assertNull($standing['next']);
        $this->assertSame(100, $standing['progress']);
    }
}
