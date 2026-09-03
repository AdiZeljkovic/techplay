<?php

namespace Tests\Feature;

use App\Filament\Pages\Settings;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The switch that turns on live chat in the help centre.
 *
 * It is off, and it will be off for weeks — which is exactly why it is worth a
 * test. Nobody will touch this until the Rocket.Chat server is running, and by
 * then the reason it was built this way will not be in anybody's head.
 *
 * Two things have to hold. The toggle has to be on the page's BOOLEANS list,
 * because the settings column is a string for everything and a toggle that is
 * not on that list writes an empty string — after which the next reader cannot
 * tell "off" from "never set". And both keys have to reach the settings
 * endpoint, because that is the only way the help page learns about them.
 */
class HelpLiveChatSwitchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $admin = User::factory()->create(['role' => 'admin']);
        $admin->assignRole('Super Admin');

        $this->actingAs($admin->fresh());
        Filament::setCurrentPanel(Filament::getPanel('admin'));
    }

    public function test_the_settings_page_offers_both_halves_of_the_switch(): void
    {
        Livewire::test(Settings::class)
            ->assertOk()
            // Both, because either one alone is a broken offer: the switch
            // without an address renders a chat button with nowhere to go, and
            // the address without the switch opens a chat nobody is watching.
            ->assertFormFieldExists('help_livechat_enabled')
            ->assertFormFieldExists('help_livechat_url');
    }

    public function test_the_toggle_is_written_as_a_boolean_not_an_empty_string(): void
    {
        Livewire::test(Settings::class)
            ->fillForm([
                'help_livechat_enabled' => true,
                'help_livechat_url' => 'https://chat.techplay.gg/livechat',
            ])
            ->call('save')
            ->assertHasNoFormErrors();

        // '1', never ''. The page's own BOOLEANS comment is about this exact
        // failure, and it is silent: an empty string reads as off and also
        // reads as never-configured.
        $this->assertSame('1', SiteSetting::where('key', 'help_livechat_enabled')->value('value'));
        $this->assertSame('https://chat.techplay.gg/livechat', SiteSetting::where('key', 'help_livechat_url')->value('value'));

        Livewire::test(Settings::class)
            ->fillForm(['help_livechat_enabled' => false])
            ->call('save');

        $this->assertSame('0', SiteSetting::where('key', 'help_livechat_enabled')->value('value'));
    }

    /**
     * The help page reads these through the settings endpoint, which returns
     * every row — so the only way to break this is to stop storing them.
     */
    public function test_both_keys_reach_the_settings_endpoint(): void
    {
        SiteSetting::updateOrCreate(['key' => 'help_livechat_enabled'], ['value' => '1', 'type' => 'boolean', 'group' => 'general']);
        SiteSetting::updateOrCreate(['key' => 'help_livechat_url'], ['value' => 'https://chat.techplay.gg/livechat', 'type' => 'text', 'group' => 'general']);

        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('help_livechat_enabled', '1')
            ->assertJsonPath('help_livechat_url', 'https://chat.techplay.gg/livechat');
    }
}
