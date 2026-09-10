<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MailCampaignResource\Pages;
use App\Jobs\SendCampaign;
use App\Mail\CampaignMessage;
use App\Models\Giveaway;
use App\Models\MailCampaign;
use App\Models\MailCampaignRecipient;
use App\Services\CampaignAudience;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Forms\Components\RichEditor;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Enums\FontWeight;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\HtmlString;

/**
 * Writing a newsletter, and sending it once.
 *
 * The safety in this screen is mostly in what it refuses to do. A campaign that
 * has gone out cannot be edited, because editing it would suggest the message
 * in ninety inboxes changes too. Sending asks for confirmation and names the
 * number of people, because the mistake this screen can make is not a typo —
 * it is a mailing to the wrong list, and there is no undo for that anywhere in
 * the world.
 *
 * The audience is stored as a rule and resolved when the send starts, so
 * somebody who unsubscribes between writing and sending is not written to.
 */
class MailCampaignResource extends Resource
{
    protected static ?string $model = MailCampaign::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $recordTitleAttribute = 'name';

    public static function getNavigationGroup(): ?string
    {
        return 'SEO & Marketing';
    }

    public static function getNavigationLabel(): string
    {
        return 'Newsletters';
    }

    protected static ?int $navigationSort = 51;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('The message')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('Internal name')
                        ->helperText('Only you see this. What it is, so you can find it later.')
                        ->required()
                        ->maxLength(120),

                    Forms\Components\TextInput::make('subject')
                        ->label('Subject line')
                        ->helperText('The one thing that decides whether anybody opens it.')
                        ->required()
                        ->maxLength(180),

                    RichEditor::make('body')
                        ->label('Body')
                        ->helperText('Links are counted automatically — paste them as they are. Drag a picture in or use the image button; it is uploaded and given a full address, because a relative one arrives broken in an inbox.')
                        ->toolbarButtons([
                            'bold', 'italic', 'link', 'h2', 'h3',
                            'bulletList', 'orderedList', 'blockquote',
                            'attachFiles', 'undo', 'redo',
                        ])
                        // The public disk, so the picture is reachable from
                        // somebody's mail client. Its own directory so a
                        // newsletter image is never confused with an article's.
                        ->fileAttachmentsDisk('public')
                        ->fileAttachmentsDirectory('newsletter')
                        ->fileAttachmentsVisibility('public')
                        ->columnSpanFull(),

                    Forms\Components\Textarea::make('body_text')
                        ->label('Plain-text version')
                        ->helperText('Optional. Left empty, the text version is stripped from the body above. Worth writing by hand for anything important: it is what a filter reads and what a watch shows.')
                        ->rows(5)
                        ->columnSpanFull(),
                ])
                ->columns(2),

            /*
             * The hero, taken from the launch announcement.
             *
             * That mail opens with a small capsule, a large headline, a line of
             * text and one button, and it is the only design here that has been
             * through real mail clients. Rebuilding it in the rich-text box
             * would mean writing Outlook-safe tables by hand, which is the work
             * the template exists to remove — so it is six fields instead.
             *
             * All optional together: leave them empty and the message is a
             * masthead, the writing and the footer, which is the right shape
             * for a short note.
             */
            Section::make('The opening')
                ->description('The big block at the top, as in the launch email. Leave it all empty for a plain note.')
                ->schema([
                    Forms\Components\TextInput::make('hero_eyebrow')
                        ->label('Small capsule')
                        ->helperText('Above the headline, drawn in capitals. "New this week", "GTA 6 giveaway".')
                        ->maxLength(60),

                    Forms\Components\TextInput::make('hero_headline')
                        ->label('Headline')
                        ->maxLength(160),

                    Forms\Components\Textarea::make('hero_intro')
                        ->label('One line under it')
                        ->rows(2)
                        ->maxLength(400)
                        ->columnSpanFull(),

                    Forms\Components\TextInput::make('hero_cta_label')
                        ->label('Button text')
                        ->helperText('Needs the address beside it — a label on its own draws nothing.')
                        ->maxLength(60),

                    Forms\Components\TextInput::make('hero_cta_url')
                        ->label('Button address')
                        ->url()
                        ->maxLength(500),

                    Forms\Components\FileUpload::make('hero_image')
                        ->label('Picture across the top')
                        ->image()
                        ->disk('public')
                        ->directory('newsletter')
                        ->visibility('public')
                        ->helperText('Optional, sits above the headline. Wide works best — around 1200×600.')
                        ->columnSpanFull(),
                ])
                ->columns(2)
                ->collapsed(fn (?MailCampaign $record) => ! $record?->hero_headline && ! $record?->hero_image),

            Section::make('Who gets it')
                ->schema([
                    /*
                     * $get is left untyped, and that is not a style choice.
                     *
                     * Filament v5 hands in Filament\Schemas\Components\Utilities\Get.
                     * Filament\Forms\Get does not exist in this version at all,
                     * and type-hinting it turned this entire page into a 500 —
                     * the class name reads as obviously right and is obviously
                     * wrong. Untyped, the injection works whatever the version
                     * in use happens to pass, which is also what the rest of
                     * this codebase does.
                     */
                    Forms\Components\Select::make('audience.segment')
                        ->label('Audience')
                        ->options(CampaignAudience::SEGMENTS)
                        ->default('everyone')
                        ->required()
                        ->live(),

                    Forms\Components\Select::make('audience.giveaway_id')
                        ->label('Which giveaway')
                        ->options(fn () => Giveaway::query()->orderByDesc('id')->pluck('title', 'id'))
                        ->helperText('Leave empty for anybody who has entered any giveaway.')
                        ->visible(fn ($get) => $get('audience.segment') === 'giveaway')
                        ->live(),

                    Forms\Components\TextInput::make('audience.min_xp')
                        ->label('Minimum XP')
                        ->numeric()
                        ->minValue(0)
                        ->helperText('Leave empty for no minimum.')
                        ->visible(fn ($get) => in_array($get('audience.segment'), ['everyone', 'members'], true))
                        ->live(onBlur: true),

                    Forms\Components\TextInput::make('audience.seen_within_days')
                        ->label('Seen in the last N days')
                        ->numeric()
                        ->minValue(1)
                        ->helperText('Only narrows to people we have positively seen. Somebody we have no record of is never excluded by this.')
                        ->visible(fn ($get) => in_array($get('audience.segment'), ['everyone', 'members'], true))
                        ->live(onBlur: true),

                    Forms\Components\Placeholder::make('reach')
                        ->label('Reaches')
                        ->content(function ($get) {
                            $rule = array_filter((array) $get('audience'), fn ($v) => $v !== null && $v !== '');
                            $count = app(CampaignAudience::class)->count($rule);

                            return new HtmlString(
                                '<span style="font-size:20px;font-weight:700">'.$count.'</span> '
                                .($count === 1 ? 'person' : 'people')
                                .'<br><span style="opacity:.7">Counted now. The list is drawn again when you send, so anybody who leaves in between is left out.</span>'
                            );
                        })
                        ->columnSpanFull(),
                ])
                ->columns(2),

            Section::make('Pacing')
                ->description('We send from our own mail server, which arrives at Gmail with no reputation of its own. A hundred messages in one second is the shape of a spam run, and being read as one costs far more than the minute this saves.')
                ->schema([
                    Forms\Components\TextInput::make('batch_size')
                        ->label('Messages per batch')
                        ->numeric()->minValue(1)->maxValue(100)->default(10)->required(),

                    Forms\Components\TextInput::make('pause_seconds')
                        ->label('Seconds between batches')
                        ->numeric()->minValue(0)->maxValue(120)->default(3)->required(),
                ])
                ->columns(2)
                ->collapsed(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Campaign')
                    ->description(fn (MailCampaign $r) => $r->subject)
                    ->weight(FontWeight::SemiBold)
                    ->wrap()
                    ->searchable(),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        MailCampaign::SENT => 'success',
                        MailCampaign::SENDING => 'warning',
                        MailCampaign::SCHEDULED => 'info',
                        MailCampaign::CANCELLED => 'danger',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('sent_count')
                    ->label('Sent')
                    ->formatStateUsing(fn (MailCampaign $r) => $r->recipients_count > 0
                        ? $r->sent_count.' / '.$r->recipients_count
                        : '—'),

                Tables\Columns\TextColumn::make('opened_count')
                    ->label('Opened')
                    ->formatStateUsing(fn (MailCampaign $r) => $r->openRate() === null ? '—' : $r->openRate().'%')
                    // Apple fetches the pixel whether or not anybody looked, so
                    // this is a floor, not a measurement. Said here rather than
                    // left for somebody to discover by trusting it.
                    ->tooltip('A floor, not a measurement — Apple Mail fetches the tracking pixel whether the reader opened it or not.'),

                Tables\Columns\TextColumn::make('clicked_count')
                    ->label('Clicked')
                    ->formatStateUsing(fn (MailCampaign $r) => $r->clickRate() === null ? '—' : $r->clickRate().'%')
                    ->tooltip('The number worth trusting.'),

                Tables\Columns\TextColumn::make('failed_count')
                    ->label('Failed')
                    ->formatStateUsing(fn (MailCampaign $r) => $r->failed_count ?: '—')
                    ->color(fn (MailCampaign $r) => $r->failed_count > 0 ? 'danger' : null),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Written')
                    ->since()
                    ->sortable(),
            ])
            ->actions([
                EditAction::make()
                    ->visible(fn (MailCampaign $r) => $r->isEditable()),
                self::previewAction(),
                self::testAction(),
                self::sendAction(),
                DeleteAction::make()
                    ->visible(fn (MailCampaign $r) => ! $r->hasGoneOut()),
            ]);
    }

    /**
     * Send one copy to one address, without joining the list.
     *
     * The row is made, used and removed. It has to exist because the whole
     * message is built around a recipient — the unsubscribe token, the pixel,
     * every tracked link — but leaving it behind would put a test address in
     * the log and, worse, occupy the (campaign, email) slot so the real send
     * would skip that person as already written to.
     */
    /**
     * The mail as it will actually arrive.
     *
     * Rendered from the mailable's own Blade file, in a new tab with nothing
     * around it. A preview drawn any other way is a picture of an email rather
     * than the email, and the part worth checking before a send is exactly the
     * part where the two would differ.
     */
    public static function previewAction(): Action
    {
        return Action::make('preview')
            ->label('Preview')
            ->icon('heroicon-o-eye')
            ->color('gray')
            ->url(fn (MailCampaign $record) => route('admin.mail-campaign.preview', $record))
            ->openUrlInNewTab();
    }

    public static function testAction(): Action
    {
        return Action::make('test')
            ->label('Send test')
            ->icon('heroicon-o-paper-airplane')
            ->color('gray')
            ->visible(fn (MailCampaign $r) => ! $r->hasGoneOut())
            ->schema([
                Forms\Components\TextInput::make('email')
                    ->label('Send it to')
                    ->email()
                    ->required()
                    ->default(fn () => Auth::user()?->email),
            ])
            ->action(function (MailCampaign $record, array $data) {
                $email = mb_strtolower(trim($data['email']));
                $recipient = null;

                try {
                    $recipient = MailCampaignRecipient::create([
                        'campaign_id' => $record->id,
                        'email' => 'test+'.uniqid().'@'.parse_url(config('app.url'), PHP_URL_HOST),
                        'source' => 'account',
                    ]);

                    Mail::to($email)->send(new CampaignMessage($recipient));

                    Notification::make()
                        ->title('Test sent to '.$email)
                        ->body('Check the links and the unsubscribe line. This copy is not recorded against the campaign.')
                        ->success()
                        ->send();
                } catch (\Throwable $e) {
                    Notification::make()
                        ->title('Test could not be sent')
                        ->body($e->getMessage())
                        ->danger()
                        ->send();
                } finally {
                    $recipient?->delete();
                }
            });
    }

    /**
     * The one action here that cannot be taken back.
     *
     * It names the number of people before it asks, because "are you sure" on
     * its own is a question nobody reads. Everything else on this screen is
     * recoverable; this is not.
     */
    public static function sendAction(): Action
    {
        return Action::make('send')
            ->label('Send now')
            ->icon('heroicon-o-rocket-launch')
            ->color('danger')
            ->visible(fn (MailCampaign $r) => in_array($r->status, [MailCampaign::DRAFT, MailCampaign::SCHEDULED], true))
            ->requiresConfirmation()
            ->modalHeading('Send this newsletter')
            ->modalDescription(function (MailCampaign $record) {
                $count = app(CampaignAudience::class)->count($record->audience ?? []);
                $minutes = round(intdiv($count, max(1, $record->batch_size)) * $record->pause_seconds / 60, 1);

                return new HtmlString(
                    'This goes to <strong>'.$count.'</strong> '.($count === 1 ? 'person' : 'people')
                    .' and takes about '.$minutes.' minutes to work through.'
                    .'<br><br>An email cannot be recalled. Send a test to yourself first if you have not.'
                );
            })
            ->modalSubmitActionLabel('Send it')
            ->action(function (MailCampaign $record) {
                SendCampaign::dispatch($record);

                Notification::make()
                    ->title('Sending started')
                    ->body('The messages are queued and paced. This page shows the count as it goes.')
                    ->success()
                    ->send();
            });
    }

    public static function canEdit(Model $record): bool
    {
        return $record instanceof MailCampaign && $record->isEditable();
    }

    public static function canDelete(Model $record): bool
    {
        return $record instanceof MailCampaign && ! $record->hasGoneOut();
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMailCampaigns::route('/'),
            'create' => Pages\CreateMailCampaign::route('/create'),
            'edit' => Pages\EditMailCampaign::route('/{record}/edit'),
        ];
    }
}
