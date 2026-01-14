<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AdCampaignResource\Pages;
use App\Models\AdCampaign;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\EditAction;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;

class AdCampaignResource extends Resource
{
    protected static ?string $model = AdCampaign::class;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?string $navigationGroup = 'System';
    protected static ?int $navigationSort = 1;

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
                        ->live(),

                    Forms\Components\FileUpload::make('image_url')
                        ->label('Banner Image')
                        ->disk('public')
                        ->directory('ads')
                        ->image()
                        ->visible(fn($get) => $get('type') === 'image'),

                    Forms\Components\Textarea::make('code_block')
                        ->label('Custom Ad Code')
                        ->rows(6)
                        ->visible(fn($get) => $get('type') === 'code'),

                    Forms\Components\TextInput::make('target_url')
                        ->label('Click URL')
                        ->url()
                        ->maxLength(500),

                    Forms\Components\Select::make('position')
                        ->options([
                                'header_top' => 'Header (Top Banner)',
                                'sidebar_top' => 'Sidebar (Top)',
                                'sidebar_bottom' => 'Sidebar (Bottom)',
                                'article_after_hero' => 'Article (After Hero)',
                                'article_mid' => 'Article (Mid Content)',
                                'footer_top' => 'Footer (Above Footer)',
                            ])
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
                        ->sortable(),
                    TextColumn::make('position')
                        ->badge()
                        ->color('info'),
                    TextColumn::make('type')
                        ->badge()
                        ->color(fn($state) => $state === 'image' ? 'success' : 'warning'),
                    IconColumn::make('is_active')
                        ->boolean()
                        ->label('Active'),
                    TextColumn::make('view_count')
                        ->label('Views')
                        ->numeric(),
                    TextColumn::make('click_count')
                        ->label('Clicks')
                        ->numeric(),
                    TextColumn::make('start_date')
                        ->date()
                        ->sortable(),
                    TextColumn::make('end_date')
                        ->date()
                        ->sortable(),
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
