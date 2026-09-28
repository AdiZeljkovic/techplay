<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Rule;

/**
 * One thing the advisor might say, before it is known whether it will.
 *
 * A producer returns these; the engine scores, dedupes and cuts them. Keeping
 * the candidate separate from the answer is what makes "3 main and 3
 * alternatives" possible at all — there is a ranked field to choose from rather
 * than whatever the first matching rule happened to be.
 *
 * `blockers` is the field that earns this class. A recommendation a player cannot
 * act on yet is not noise, it is the more useful of the two: "this needs Gliding
 * first" is the sentence that saves an evening. Advice with a blocker still
 * ships — it just ranks below advice without one.
 */
class Signal
{
    /**
     * @param  array<string, int|float|string|bool|null>  $facts  Fills the rule's {placeholders}.
     * @param  array<int, string>  $blockers  Plain sentences, in the order they must be cleared.
     * @param  array<int, string>  $pushes  Which goals this also moves, for dedupe.
     */
    public function __construct(
        public readonly Gw2Rule $rule,
        public readonly string $subject,
        public readonly array $facts = [],
        public readonly array $blockers = [],
        public readonly array $pushes = [],
        public float $score = 0.0,
    ) {}

    /**
     * What makes two candidates the same thing.
     *
     * The rule plus its subject, not the rule alone: "finish Auric Basin
     * Explorer" and "finish Bava Nisos Explorer" come from one rule and are two
     * different evenings. Without the subject the engine would show one
     * achievement and drop fifteen.
     */
    public function identity(): string
    {
        return $this->rule->key.'#'.$this->subject;
    }

    public function title(): string
    {
        return $this->fill($this->rule->title);
    }

    public function body(): string
    {
        return $this->fill($this->rule->body);
    }

    /**
     * Substitute {name} from the signal's own facts.
     *
     * A placeholder with no fact behind it is left standing rather than blanked,
     * because a visible `{count}` in a sentence is a bug somebody reports, and a
     * silent empty space is a bug nobody notices.
     */
    private function fill(string $template): string
    {
        return preg_replace_callback(
            '/\{(\w+)}/',
            fn ($m) => array_key_exists($m[1], $this->facts)
                ? (string) $this->facts[$m[1]]
                : $m[0],
            $template
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'key' => $this->rule->key,
            'domain' => $this->rule->domain,
            'title' => $this->title(),
            'body' => $this->body(),
            'subject' => $this->subject,
            'confidence' => $this->rule->confidence,
            'effort' => $this->rule->effort_band,
            /*
             * An editorial estimate, not a measurement — the game reports how
             * long nothing takes. Null where nobody has judged the rule yet,
             * which a client must render as silence rather than as zero.
             */
            'minutes_low' => $this->rule->minutes_low,
            'minutes_high' => $this->rule->minutes_high,
            'blockers' => $this->blockers,
            'score' => round($this->score, 1),
            'facts' => $this->facts,
        ];
    }
}
