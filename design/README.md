# Profile icons

The nine icons in `frontend/public/images/profile/v2-*.webp` are **hand-made**,
supplied as transparent PNGs. They are not the Blender renders that briefly
lived at these filenames — those were replaced because they did not hold up.

## Where they are used

| File | Drawn at | Where |
|---|---|---|
| `v2-games`, `v2-completed`, `v2-reviews`, `v2-achievements`, `v2-streak`, `v2-loot` | 60px | the hero stat strip |
| `v2-bounty` | 46px · 62px | the wallet readout · a bounty-paying challenge |
| `v2-streak` | 46px | the streak widget |
| `v2-season` | 64px | the season panel |
| `v2-xp` | 62px | an XP-paying challenge |

## How a new one is prepared

Source art comes in at whatever size and padding the tool exported. Two steps
make it behave on the strip:

1. **Trim to the alpha bounding box.** Two thirds of some source files is empty
   padding, and padding is what decides how large an icon looks beside its
   neighbours — so it has to be ours rather than the exporter's.
2. **Fit the long edge to 90% of a 320×320 square, centred.** Scaling each icon
   to fill its own square would make a tall one tower over a wide one; matching
   the long edge gives them the same visual weight.

320px is five times the largest place any of them is drawn, which covers 3×
displays with room to spare, and lands each file around 15–25 KB as WebP.

```python
im = Image.open(src).convert("RGBA")
im = im.crop(im.getchannel("A").getbbox())
w, h = im.size
s = (320 * 0.90) / max(w, h)
im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
out = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
out.alpha_composite(im, ((320 - im.size[0]) // 2, (320 - im.size[1]) // 2))
out.save(dst, "WEBP", quality=92, method=6)
```

Judge the result on a contact sheet at **60px against `#0B0E14`**, never at full
size. An icon that looks right at 512px and turns to mush on the strip is the
mistake that produced the set these replaced.

## `avatar-frame.webp`

The house ring around the profile portrait, also hand-supplied. Preparing one
is not the icon recipe — the frame has to be centred on **its opening**, not on
its own bounding box, or the portrait sits off-centre inside it:

1. Flood-fill the transparent middle to find the opening. Take the **widest
   horizontal chord** as the diameter; the vertical run is shorter because the
   crest at the bottom reaches into the circle, and the circle is still round.
2. Build a square canvas whose centre is the opening's centre, sized so the
   whole artwork still fits, then downscale to 512.
3. The portrait inset is `(1 − diameter ÷ canvas) ÷ 2`, minus about half a
   percent so its edge tucks under the metal instead of meeting it flush.

For the current frame that came out at 978 across a 1280 square → 11.8%, drawn
at **11.3%**. Check the result by compositing the frame over a plain disc at
that inset and looking at 150px: a hairline of page between portrait and ring
is the failure this step exists to catch.

## `components/home-dashboard/StatIcon.tsx`

Adds the behaviour: the icon turns toward the pointer, lifts on approach, and
carries a faint specular sweep masked to its own silhouette. The sweep is
deliberately quiet — this art has its own baked highlights, and a strong one on
top washes it out instead of lighting it.

`active={false}` renders an icon cold and grey (a dead streak), and
`idle="flicker" | "pulse"` gives the two objects with a reason to move a slow
idle. The rest hold still; six animating icons at once is a screensaver.

## `icon-rig.blend`

The Blender rig from the earlier attempt — orthographic three-quarter camera,
crimson rim light, a small material palette. Kept because it is a working setup
for any 3D asset that needs to match the site, not because the shipped icons
came from it.

Two settings in it are worth remembering anywhere else renders for this brand:
the view transform must be **Standard**, since AgX rolls saturated colour toward
white and turns crimson into pink; and **emission stays at or under 1.0**,
because driving a saturated red past it clips the red channel while green and
blue keep climbing, which does the same thing from the other direction.
