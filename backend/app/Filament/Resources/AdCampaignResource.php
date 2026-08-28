<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AdCampaignResource\Pages;
use App\Models\AdCampaign;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AdCampaignResource extends Resource
{
    protected static ?string $model = AdCampaign::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $recordTitleAttribute = 'name';

    public static function getNavigationGroup(): ?string
    {
        return 'Shop & Monetization';
    }

    protected static ?int $navigationSort = 60;

    public static function getNavigationLabel(): string
    {
        return 'Ad Campaigns';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                Forms\Components\Select::make('type')
                    ->options([
                        'image' => 'Image Banner',
                        'code' => 'Custom Code (HTML/JS)',
                    ])
                    ->default('image')
                    ->required()
                    ->live()
                    ->columnSpan(1),

                Forms\Components\Select::make('format')
                    ->label('IAB Format')
                    ->options([
                        'ros' => 'ROS (Run of Site)',
                        'rectangle' => 'Rectangle (300x250px)',
                        'billboard' => 'Billboard (970x250px)',
                        'in_text' => 'In-Text',
                        'skyscraper' => 'Skyscraper (160x600px)',
                        'leaderboard' => 'Leaderboard (728x90px)',
                        'mobile_banner' => 'Mobile Banner (320x50px)',
                        'video_preroll' => 'Video Pre-Roll (Skippable)',
                        'video_preroll_nonskip' => 'Video Pre-Roll (Non-Skippable)',
                        'video_outstream' => 'Video Outstream',
                    ])
                    ->searchable()
                    ->helperText('Select standard IAB advertising format')
                    ->columnSpan(1)
                    ->live(),

                Forms\Components\TextInput::make('width')
                    ->numeric()
                    ->label('Width (px)')
                    ->helperText('Image width in pixels')
                    ->columnSpan(1)
                    ->visible(fn ($get) => $get('type') === 'image'),

                Forms\Components\TextInput::make('height')
                    ->numeric()
                    ->label('Height (px)')
                    ->helperText('Image height in pixels')
                    ->columnSpan(1)
                    ->visible(fn ($get) => $get('type') === 'image'),

                Forms\Components\CheckboxList::make('platforms')
                    ->options([
                        'desktop' => 'Desktop',
                        'mobile_web' => 'Mobile Web',
                        'ios_app' => 'iOS App',
                        'android_app' => 'Android App',
                    ])
                    ->columns(2)
                    ->helperText('Select which platforms this ad should appear on'),

                Forms\Components\Select::make('device_targeting')
                    ->label('Device Targeting')
                    ->options([
                        'all' => 'All Devices',
                        'desktop_only' => 'Desktop Only',
                        'mobile_only' => 'Mobile Only',
                    ])
                    ->default('all')
                    ->required(),

                Forms\Components\FileUpload::make('image_url')
                    ->label('Banner Image')
                    ->disk('public')
                    ->directory('ads')
                    ->image()
                    ->visible(fn ($get) => $get('type') === 'image'),

                Forms\Components\Textarea::make('code_block')
                    ->label('Custom Ad Code')
                    ->rows(6)
                    ->visible(fn ($get) => $get('type') === 'code'),

                Forms\Components\TextInput::make('target_url')
                    ->label('Click URL')
                    ->url()
                    ->maxLength(500),

                Forms\Components\TextInput::make('cpm_price')
                    ->label('CPM Price (KM)')
                    ->numeric()
                    ->step(0.01)
                    ->prefix('KM')
                    ->helperText('Cost per 1000 impressions'),

                Forms\Components\Textarea::make('description')
                    ->label('Internal Notes')
                    ->rows(3)
                    ->helperText('Optional description or notes for internal use')
                    ->columnSpanFull(),

                Forms\Components\Select::make('position')
                    ->options([
                        // Homepage
                        'home_hero' => '🏠 Homepage - Hero Banner',
                        'home_mid_1' => '🏠 Homepage - Mid Section 1',
                        'home_mid_2' => '🏠 Homepage - Mid Section 2',
                        'home_sidebar' => '🏠 Homepage - Sidebar',
                        // Listing Pages
                        'listing_top' => '📰 Listing Pages - Top Banner',
                        'listing_sidebar' => '📰 Listing Pages - Sidebar',
                        // Article Pages
                        'article_after_hero' => '📄 Article - After Hero',
                        'article_mid' => '📄 Article - Mid Content',
                        'article_in_text' => '📄 Article - In-Text (Auto)',
                        // Global
                        'sidebar_top' => '🌐 Global - Sidebar Top',
                        'sidebar_bottom' => '🌐 Global - Sidebar Bottom',
                        'header_top' => '🌐 Global - Header Top',
                        'footer_top' => '🌐 Global - Footer Top',
                    ])
                    ->searchable()
                    ->required(),

                Forms\Components\TextInput::make('priority')
                    ->numeric()
                    ->default(0)
                    ->helperText('Higher priority ads show first'),

                Forms\Components\DatePicker::make('start_date')
                    ->label('Start Date'),

                Forms\Components\DatePicker::make('end_date')
                    ->label('End Date'),

                Forms\Components\Toggle::make('is_active')
                    ->label('Active')
                    ->default(true),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->description(fn ($record) => $record->format ? strtoupper($record->format) : null),
                TextColumn::make('position')
                    ->badge()
                    ->color('info'),
                TextColumn::make('device_targeting')
                    ->label('Device')
                    ->badge()
                    ->color(fn ($state) => match ($state) {
                        'all' => 'success',
                        'desktop_only' => 'info',
                        'mobile_only' => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'all' => 'All',
                        'desktop_only' => 'Desktop',
                        'mobile_only' => 'Mobile',
                        default => $state,
                    }),
                IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
                TextColumn::make('view_count')
                    ->label('Views')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('click_count')
                    ->label('Clicks')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('ctr')
                    ->label('CTR')
                    ->suffix('%')
                    ->sortable(query: function ($query, $direction) {
                        $dir = strtolower((string) $direction) === 'desc' ? 'desc' : 'asc';

                        return $query->orderByRaw("CASE WHEN view_count = 0 THEN 0 ELSE (click_count::float / view_count::float) * 100 END {$dir}");
                    })
                    ->color(fn ($state) => $state > 5 ? 'success' : ($state > 2 ? 'warning' : 'danger')),
                TextColumn::make('estimated_revenue')
                    ->label('Revenue')
                    ->money('BAM')
                    ->sortable(query: function ($query, $direction) {
                        // Filament posalje 'asc' ili 'desc' i nikad nista drugo, a
                        // panel je zakljucan na cetiri naloga — pa ovo nije bila
                        // rupa. Bio je obrazac: jedina od jedanaest sirovih upita
                        // u kodu koja lijepi promjenljivu umjesto da je veze.
                        // Obrasci se prepisuju tamo gdje izvor jeste korisnicki.
                        $dir = strtolower((string) $direction) === 'desc' ? 'desc' : 'asc';

                        return $query->orderByRaw("(view_count::float / 1000) * COALESCE(cpm_price, 0) {$dir}");
                    }),
                TextColumn::make('start_date')
                    ->date()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('end_date')
                    ->date()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('priority', 'desc')
            ->filters([
                SelectFilter::make('position')
                    ->options([
                        'header_top' => 'Header',
                        'sidebar_top' => 'Sidebar Top',
                        'sidebar_bottom' => 'Sidebar Bottom',
                        'article_after_hero' => 'Article Hero',
                        'article_mid' => 'Article Mid',
                        'footer_top' => 'Footer',
                        'home_hero' => 'Home Hero',
                        'home_mid_1' => 'Home Mid 1',
                        'home_mid_2' => 'Home Mid 2',
                        'listing_top' => 'Listing Top',
                    ]),
                SelectFilter::make('format')
                    ->options([
                        'ros' => 'ROS',
                        'rectangle' => 'Rectangle',
                        'billboard' => 'Billboard',
                        'in_text' => 'In-Text',
                        'skyscraper' => 'Skyscraper',
                        'leaderboard' => 'Leaderboard',
                        'mobile_banner' => 'Mobile Banner',
                    ]),
                SelectFilter::make('device_targeting')
                    ->options([
                        'all' => 'All Devices',
                        'desktop_only' => 'Desktop Only',
                        'mobile_only' => 'Mobile Only',
                    ]),
                SelectFilter::make('is_active')
                    ->options([
                        true => 'Active',
                        false => 'Inactive',
                    ]),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->actions([
                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAdCampaigns::route('/'),
            'create' => Pages\CreateAdCampaign::route('/create'),
            'edit' => Pages\EditAdCampaign::route('/{record}/edit'),
        ];
    }
}
