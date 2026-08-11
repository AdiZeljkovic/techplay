<?php

namespace App\Filament\Pages;

use App\Models\SiteSetting;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SocialSettings extends Page implements HasForms
{
    /** Writes site-wide social links that render on every page. */
    public static function canAccess(): bool
    {
        $user = auth()->user();

        return $user && (
            $user->isAdmin()
        );
    }

    use InteractsWithForms;

    public ?array $data = [];

    protected string $view = 'filament.pages.social-settings';

    public static function getNavigationIcon(): ?string
    {
        return 'heroicon-o-share';
    }

    public static function getNavigationLabel(): string
    {
        return 'Social Media';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'System';
    }

    public static function getNavigationSort(): ?int
    {
        return 3;
    }

    public function mount(): void
    {
        $this->form->fill([
            'twitter_url' => SiteSetting::get('twitter_url'),
            'facebook_url' => SiteSetting::get('facebook_url'),
            'instagram_url' => SiteSetting::get('instagram_url'),
            'youtube_url' => SiteSetting::get('youtube_url'),
            'discord_url' => SiteSetting::get('discord_url'),
            'tiktok_url' => SiteSetting::get('tiktok_url'),
            'bluesky_url' => SiteSetting::get('bluesky_url'),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Social Media Links')
                    ->description('These links appear in the site footer and header.')
                    ->icon('heroicon-o-link')
                    ->schema([
                        TextInput::make('twitter_url')
                            ->label('X (Twitter)')
                            ->url()
                            ->placeholder('https://x.com/TechPlayGG')
                            ->prefixIcon('heroicon-o-at-symbol'),

                        TextInput::make('facebook_url')
                            ->label('Facebook')
                            ->url()
                            ->placeholder('https://facebook.com/TechPlayGG')
                            ->prefixIcon('heroicon-o-at-symbol'),

                        TextInput::make('instagram_url')
                            ->label('Instagram')
                            ->url()
                            ->placeholder('https://instagram.com/techplaygg')
                            ->prefixIcon('heroicon-o-at-symbol'),

                        TextInput::make('youtube_url')
                            ->label('YouTube')
                            ->url()
                            ->placeholder('https://youtube.com/@TechPlayGG')
                            ->prefixIcon('heroicon-o-at-symbol'),

                        TextInput::make('discord_url')
                            ->label('Discord')
                            ->url()
                            ->placeholder('https://discord.gg/INVITE_CODE')
                            ->prefixIcon('heroicon-o-at-symbol'),

                        TextInput::make('tiktok_url')
                            ->label('TikTok')
                            ->url()
                            ->placeholder('https://tiktok.com/@techplaygg')
                            ->prefixIcon('heroicon-o-at-symbol'),

                        TextInput::make('bluesky_url')
                            ->label('Bluesky')
                            ->url()
                            ->placeholder('https://bsky.app/profile/techplay.gg')
                            ->prefixIcon('heroicon-o-at-symbol'),
                    ])
                    ->columns(2),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        foreach ($data as $key => $value) {
            SiteSetting::set($key, $value ?? '', 'text', 'socials');
        }

        Notification::make()
            ->title('Social links saved!')
            ->success()
            ->send();
    }
}
