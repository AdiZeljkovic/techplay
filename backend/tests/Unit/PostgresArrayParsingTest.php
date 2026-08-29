<?php

namespace Tests\Unit;

use App\Casts\PostgresArray;
use App\Models\Game;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * One parser, and the values that made five of them a problem.
 *
 * Every literal below was taken from the production catalogue rather than
 * invented — a studio called "Cygames, Inc.", a tag that spells out what 4X
 * stands for, a developer credited by nickname. 3,522 array values carry a
 * comma and 120 carry a quote, and the two parsers that split on every comma
 * turned each of those into fragments.
 */
class PostgresArrayParsingTest extends TestCase
{
    #[Test]
    public function a_comma_inside_a_quoted_value_stays_one_value(): void
    {
        $this->assertSame(['Cygames, Inc.'], PostgresArray::parse('{"Cygames, Inc."}'));

        $this->assertSame(
            ['Strategy', '4X (explore, expand, exploit, and exterminate)', 'Indie'],
            PostgresArray::parse('{Strategy,"4X (explore, expand, exploit, and exterminate)",Indie}')
        );
    }

    #[Test]
    public function ordinary_values_are_unchanged(): void
    {
        $this->assertSame(
            ['Action', 'Role-Playing (RPG)'],
            PostgresArray::parse('{Action,"Role-Playing (RPG)"}')
        );
    }

    #[Test]
    public function empty_forms_all_answer_with_an_empty_array(): void
    {
        foreach (['{}', '', null, 0, false] as $empty) {
            $this->assertSame([], PostgresArray::parse($empty), 'input: '.var_export($empty, true));
        }
    }

    #[Test]
    public function an_array_is_handed_back_as_it_arrived(): void
    {
        $this->assertSame(['Action'], PostgresArray::parse(['Action']));
    }

    /**
     * str_getcsv honours the escape but leaves it in the output, so this is the
     * assertion that the unescape pass actually runs.
     */
    #[Test]
    public function an_escaped_quote_comes_back_as_a_quote(): void
    {
        $this->assertSame(
            ['Ken "coda" Snyder'],
            PostgresArray::parse('{"Ken \\"coda\\" Snyder"}')
        );
    }

    /**
     * The write side has to produce what the read side accepts, or a value
     * saved through the cast comes back split or mangled.
     */
    #[Test]
    public function what_the_cast_writes_is_what_the_parser_reads(): void
    {
        $cast = new PostgresArray;

        $original = [
            'Cygames, Inc.',
            'Ken "coda" Snyder',
            '4X (explore, expand, exploit, and exterminate)',
            'Action',
        ];

        $stored = $cast->set(new Game, 'genres', $original, []);

        $this->assertSame($original, PostgresArray::parse($stored));
    }
}
