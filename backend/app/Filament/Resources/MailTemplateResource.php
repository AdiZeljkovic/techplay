<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MailTemplateResource\Pages;
use App\Models\MailTemplate;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\HtmlString;

/**
 * The wording of the mail the site sends by itself.
 *
 * No create button and no delete button, on purpose. The rows are not free-form
 * — each one answers to a key the code asks for, and a row whose key matches
 * nothing is a template somebody will write and wonder why it never appears.
 * The catalogue on the model decides what exists; the seeder creates them.
 *
 * There is also no HTML here. These three mails carry the links that
 * registration and password recovery depend on, and an editor who could delete
 * the button would be able to lock every new member out of the site without an
 * error anywhere. Words are editable, the mechanism is not.
 */
class MailTemplateResource extends Resource
{
    protected static ?string $model = MailTemplate::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $recordTitleAttribute = 'name';

    public static function getNavigationGroup(): ?string
    {
        return 'SEO & Marketing';
    }

    public static function getNavigationLabel(): string
    {
        return 'Email wording';
    }

    protected static ?int $navigationSort = 52;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canDelete(Model $record): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Forms\Components\Placeholder::make('what')
                ->label('')
                ->content(fn (?MailTemplate $record) => new HtmlString(
                    '<div style="line-height:1.6">'
                    .'<strong>'.e($record?->name ?? '').'</strong><br>'
                    .e(MailTemplate::CATALOGUE[$record?->key ?? '']['note'] ?? '')
                    .self::variableHint($record)
                    .'</div>'
                ))
                ->columnSpanFull(),

            Forms\Components\TextInput::make('subject')
                ->label('Subject line')
                ->required()
                ->maxLength(255)
                ->columnSpanFull(),

            Forms\Components\TextInput::make('heading')
                ->label('Heading inside the email')
                ->maxLength(255)
                ->columnSpanFull(),

            Forms\Components\Textarea::make('body')
                ->label('Body')
                ->helperText('Leave a blank line between paragraphs. Plain text — no HTML.')
                ->rows(8)
                ->columnSpanFull(),

            Forms\Components\TextInput::make('cta_label')
                ->label('Button text')
                ->helperText('Where the button goes is decided by the code and cannot be changed here.')
                ->maxLength(60),

            Forms\Components\Toggle::make('is_active')
                ->label('Use this wording')
                ->helperText('Off means the email falls back to the wording built into the site. Nothing breaks either way.')
                ->default(true),
        ]);
    }

    /** The names an editor may type, listed because nobody can guess them. */
    private static function variableHint(?MailTemplate $record): string
    {
        $vars = MailTemplate::CATALOGUE[$record?->key ?? '']['vars'] ?? [];

        if ($vars === []) {
            return '';
        }

        $tags = array_map(fn ($v) => '<code>{{ '.e($v).' }}</code>', $vars);

        return '<br><br>You can use: '.implode(', ', $tags)
            .'<br><span style="opacity:.7">A name that does not exist is left in the text as you typed it, so a mistake is visible rather than silent.</span>';
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultGroup('group')
            ->defaultSort('key')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Email')
                    ->description(fn (MailTemplate $r) => MailTemplate::CATALOGUE[$r->key]['note'] ?? null)
                    ->wrap()
                    ->searchable(),

                Tables\Columns\TextColumn::make('subject')
                    ->label('Subject')
                    ->limit(50)
                    ->toggleable(),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('In use')
                    ->boolean(),

                Tables\Columns\TextColumn::make('editor.username')
                    ->label('Last edited by')
                    ->placeholder('—')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Changed')
                    ->since()
                    ->sortable(),
            ])
            ->actions([
                EditAction::make(),
            ])
            ->toolbarActions([]);
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with('editor');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMailTemplates::route('/'),
            'edit' => Pages\EditMailTemplate::route('/{record}/edit'),
        ];
    }
}
