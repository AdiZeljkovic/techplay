<?php

namespace App\Filament\Resources\Redirects\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class RedirectForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('source_url')
                    ->label('Source Path')
                    ->placeholder('/old-page')
                    ->prefix('/')
                    ->required()
                    ->unique(ignoreRecord: true),
                TextInput::make('target_url')
                    ->label('Target URL')
                    ->placeholder('/new-page or https://...')
                    ->required(),
                \Filament\Forms\Components\Select::make('status_code')
                    ->options([
                        301 => '301 - Permanent Redirect',
                        302 => '302 - Temporary Redirect',
                        307 => '307 - Temporary Redirect',
                        308 => '308 - Permanent Redirect',
                    ])
                    ->default(301)
                    ->required(),
                Toggle::make('is_active')
                    ->label('Active')
                    ->default(true),
            ]);
    }
}
