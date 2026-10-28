# Mystic Forge recipes from gw2efficiency custom-recipes

`mystic-forge.json` is derived from `recipes.json` in **gw2efficiency
custom-recipes**, licensed under the GNU General Public License v3.0. The full
licence is in `LICENSE` next to this file, unchanged. The data is © the
custom-recipes contributors. The repository names no single copyright holder.
The contributors include David Reeß (queicherius), Ecmelt and holoxx.

This file stays under GPL-3.0. Keep it separate from the application code,
which does not become GPL by reading it, and keep this notice and `LICENSE`
beside it.

## Source

- Repository: `github.com/gw2efficiency/custom-recipes`. The original is
  deleted (404 since 2026). The commit survives in its fork network.
- Commit: `82343e2f73ec677e1257554cc96b489398fd0a1d`, 7 Feb 2026, "Merge pull
  request #101 from Ecmelt/add-achievement-text-bits".
- File read: https://github.com/holoxx/custom-recipes/blob/82343e2f73ec677e1257554cc96b489398fd0a1d/recipes.json
- SHA-256 of that `recipes.json`:
  `3BB65B37243482D3221A54A5EF0DAB55FC9B6E88C8D8A4F3E5A31F890C407E5A`

## Changes from the source

Dated 28 Oct 2026:

- Only records with discipline `Mystic Forge` are kept: 2,332 of 9,344.
- 95 promotions are removed. A promotion is a recipe whose output is also one
  of its ingredients, such as 250 T5 + 1 T6 → about 88 T6. That leaves 2,237.
- Fields are renamed to our table's columns: `output_item_count` →
  `output_count`, and each ingredient keeps `type`, `id` and `count`. Every
  ingredient is `type: Item`.
- Values are not changed. That covers counts, ids, ingredient order and the
  fractional yield of a Mystic Clover (0.31).

## What it does not have

The data stops at February 2026. It has no recipe for *Wages of Stars*
(110020), *Stella Radians* (109070) or *Strife Unending* (109012), or for their
gifts. Those legendaries say "recipe not in yet" until an editor enters them.
Nothing here has been checked in game.

`App\Services\Gw2\ForgeDataset` loads it into `gw2_forge_recipes`.
