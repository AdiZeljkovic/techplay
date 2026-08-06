# Achievement icon mapping

Source: `C:\Users\adize\Desktop\ach` — 66 cards, delivered 08/2026.

Unlike the previous set, these arrive as full presentation cards: the name,
the description, the icon and the points are all printed on each one. Nothing
below is inferred from the artwork — every card was opened and read, and the
points on it were checked against the catalogue.

The UI draws no frame of its own, so the badge has to *be* the artwork. The
extractor (kept out of the repo; see the commit that added these) peels the
card off the transparent canvas by alpha, steps inside its lit border, keys
the icon off its panel by luminance, and takes the icon as the largest cluster
of connected blobs inside the middle band. Output is 256x256 PNG with alpha.

**Three achievements have no card in this delivery and keep their old
hexagonal art:** Critic, First Opinion, Voice of the People. They will look
different from the rest until art arrives for them.

| # | Achievement | File | What the icon shows |
|---|---|---|---|
| 0 | Verified Gamer | verified-gamer.png | Shield + tick |
| 1 | Gamer Tag | gamer-tag.png | ID card, locked |
| 2 | Multi-Platform | multi-platform.png | Xbox + two PlayStation nodes |
| 3 | Battlestation | battlestation.png | Monitor + tower |
| 4 | Discord Native | discord-native.png | Discord mark in a bubble |
| 5 | Plugged In | plugged-in.png | Three linked nodes |
| 6 | Early Adopter | early-adopter.png | Rocket launching |
| 7 | Game Hunter | game-hunter.png | Case + magnifier |
| 8 | Growing Library | growing-library.png | Stack of cases |
| 9 | Dedicated Collector | dedicated-collector.png | Filled shelf |
| 10 | Game Hoarder | game-hoarder.png | Crates piled on a cabinet |
| 11 | Librarian | librarian.png | Full bookcase |
| 12 | Platform Pioneer | platform-pioneer.png | Two consoles, sync arrows |
| 13 | Cross-Platform Gamer | cross-platform-gamer.png | Four linked PlayStation nodes |
| 14 | In the Zone | in-the-zone.png | Crosshair on a pad |
| 15 | Juggler | juggler.png | Three pads in the air |
| 16 | Dreamer | dreamer.png | Star rosette |
| 17 | Window Shopper | window-shopper.png | Shopfront with hearts |
| 18 | Finisher | finisher.png | Chequered flag |
| 19 | Completionist | completionist.png | Ticked clipboard |
| 20 | Master of Games | master-of-games.png | Crowned trophy |
| 21 | First Blood | first-blood.png | Sword through one brick wall |
| 22 | Ten Down | ten-down.png | Brick wall + "10" |
| 23 | Backlog Slayer | backlog-slayer.png | Sword across scattered bricks |
| 24 | Backlog Conqueror | backlog-conqueror.png | Crown on a brick wall |
| 25 | First Steps | first-steps.png | Single speech bubble |
| 26 | Conversation Starter | conversation-starter.png | Bubble + plus |
| 27 | Active Voice | active-voice.png | Bubble with a waveform |
| 28 | Prolific Poster | prolific-poster.png | Dense bubble |
| 29 | Elite Member | elite-member.png | Crowned bubble |
| 30 | Discussion Leader | discussion-leader.png | Two overlapping bubbles |
| 31 | Essayist | essayist.png | Long document |
| 32 | Forum Legend | forum-legend.png | Bubble in laurels |
| 33 | Agenda Setter | agenda-setter.png | Megaphone |
| 34 | Problem Solver | problem-solver.png | Hammer + wrench |
| 35 | Solution Machine | solution-machine.png | Cog + tick + arrow |
| 36 | Beloved | beloved.png | Heart |
| 37 | Community Pillar | community-pillar.png | Column + arrow |
| 38 | — | — | Collection poster, not a badge — skipped |
| 39 | Rising Star | rising-star.png | Violet star |
| 40 | Recognized | recognized.png | Star rosette, violet |
| 41 | Local Legend | local-legend.png | Star on a shield |
| 42 | Hall of Fame | hall-of-fame.png | Building in laurels |
| 43 | Level 5 | level-5.png | "5" in a ring |
| 44 | Level 10 | level-10.png | "10" in a ring |
| 45 | Level 25 | level-25.png | "25" in a ring |
| 46 | Level 50 | level-50.png | "50" in a ring |
| 47 | Warming Up | warming-up.png | Calendar "3" + flame |
| 48 | One Week Strong | one-week-strong.png | Calendar "7" + flame |
| 49 | Iron Habit | iron-habit.png | Calendar "30" |
| 50 | Unbreakable | unbreakable.png | Calendar "100" |
| 51 | Consistent | consistent.png | Ticked calendar + star |
| 52 | Dedicated | dedicated.png | Filled calendar + star |
| 53 | Friendly | friendly.png | Figure + plus |
| 54 | Socialite | socialite.png | Three figures |
| 55 | Popular | popular.png | Crowd |
| 56 | Squad Goals | squad-goals.png | Handshake + lock |
| 57 | The Vault | the-vault.png | Safe door |
| 58 | Shelf Starter | shelf-starter.png | Three trophies, one lit |
| 59 | Serious Shelf | serious-shelf.png | Three trophies, all lit |
| 60 | — | — | Second copy of The Vault — skipped |
| 61 | Museum Curator | museum-curator.png | Museum facade |
| 62 | Collector | collector.png | Shopping bag |
| 63 | Gear Collector | gear-collector.png | Bag + cog |
| 64 | TechPlay Patron | techplay-patron.png | Heart on a shield |
| 65 | Legacy Supporter | legacy-supporter.png | Crowned "12" shield |
