# Icon rig

`icon-rig.blend` is the camera, lighting and palette the nine profile icons in
`frontend/public/images/profile/v2-*.webp` were rendered from. Open it and the
next icon lands in the same set without any of it being guessed at again.

## What is in it

| | |
|---|---|
| **Camera** | Orthographic, three-quarter, locked to an empty at the origin. Ortho on purpose — these are read at 60px in a row, and perspective would make the wide objects look bigger than the tall ones. |
| **Key** | Broad area light on the camera's side, so the faces we see are the lit ones. |
| **Rim** | Crimson from behind-right. This is the brand doing the lighting, and it is most of why nine separate models read as one family. |
| **Fill** | Cold and dim, so the shadow side is not a hole. |

## Materials

- `M_Body` — near-black anodised shell. **Metallic 0.15, not 1.0**: a fully metallic body in an empty world has nothing to mirror and renders as a silhouette.
- `M_Trim` — machined chamfers and rings.
- `M_Core` — the site's `#DC143C`, converted to linear, as deep lacquer with a little emission underneath. Lacquer rather than a lamp, because a fully emissive face has no shading and a five-point star turns into a flat sticker.
- `M_Lamp` — genuinely emissive, for thin seams where there is no surface to shade.
- `M_Hot` — the flame's inner core.
- `M_Gold` — bounty. The only non-crimson accent in the set.

## Two settings that are not optional

**View transform is `Standard`, not AgX.** AgX is built to roll saturated colour
off toward white for photographic renders, and on a brand accent that is exactly
wrong — crimson desaturates to pink on the way through. Every early render came
out pink because of this one setting.

**Emission strength stays at or under 1.0.** Driving a saturated red past 1.0
clips the red channel while green and blue keep climbing, which is the other
half of how red becomes pink.

## Rendering another one

Build in the `ICON` collection, keep the object roughly within a 1.4-unit cube
around the origin, then:

```python
bpy.context.scene.render.filepath = ".../frontend/public/images/profile/v2-<name>.webp"
bpy.ops.render.render(write_still=True)
```

512×512, RGBA, transparent film. The frontend scales them down to 46–64px, and
`components/home-dashboard/StatIcon.tsx` adds the tilt, the specular sweep and
the lift.
