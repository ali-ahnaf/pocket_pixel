# Prompt: flat animated scene illustrations (ServeXa style)


## Prompt

Create an animated flat vector illustration as inline SVG. Draw it by hand in code. Don't use images, icon libraries or filters.

**Scene:** [who is doing what, where. e.g. "a technician in uniform hands a quote on a tablet to a customer standing in their front doorway"]
**Canvas:** viewBox `0 0 [W] [H]`, placed behind UI on a dark card (`#1c1a17`). Keep the top [60]px and bottom [200]px clear for UI (logo, buttons, headline).
**Story beat to loop:** [the 1–3 actions that repeat. e.g. "tech writes on tablet → quote card pops up → customer nods → check badge appears"]

### Style rules
1. **Flat geometry only.** Build every object from `rect` (with `rx`), `circle`, `ellipse` and simple straight-edged `path`s. No outlines on filled shapes, no gradients, no textures, no displacement or "sketchy" filters.
2. **Stylised people, no faces.** Head = circle. Hair/cap = one half-dome path. Neck = small rect. Torso = a trapezoid path with a slightly curved shoulder line. Limbs = thick stroked paths (`stroke-width` 9–11, `stroke-linecap:round`, `stroke-linejoin:round`, `fill:none`) with a bend at the elbow or knee. Hands = small circles in the skin tone. Shoes = short rounded rects. No eyes, mouths or fingers.
3. **Proportions:** figures about 200px tall on a 586px-tall canvas. Head radius about 13. Figures stand on a single ground line.
4. **Palette (strict):**
   - Background ink `#1c1a17`; structures `#26231f`, `#3a3631`, `#4a4540`
   - Paper/light surfaces `#f7f5f2`, `#efe2d2`, `#e3ded7`, `#d6c4b0`
   - One accent `#e2582b` (darker shade `#c24a22`, tint `#fbe3d9`). Use it on the protagonist's uniform and a few key props only.
   - Skin tones `#c98b62`, `#e0ab85`. Muted secondary `#4d5c5a`, greens `#6f7f5c` / `#83946e`.
5. **Depth without shading:** a soft `ellipse` shadow under each figure (black, opacity .18–.35), an inner panel inset 6–8px inside frames, and a light-spill trapezoid (accent, opacity .1) on the floor in front of any lit opening.
6. **Props tell the story.** Add 2–4 props: a key object in the hands (tablet or clipboard), one environmental detail (plant, wall light), and one trade item (toolbox). Nothing decorative beyond that.
7. **UI inside the scene** (bubbles, cards) looks like the product: a light card (`#f7f5f2`, `rx` 10) with a small mono caption (`Geist Mono`, 9px, letter-spacing .5), a bold value (`Geist`, 20px, 600) and an optional status pill (tint background with dark accent text). Status badges are an accent circle with a white check.
8. **Layout:** put the protagonist left of centre and the second figure in the doorway or background at right. Gesture lines (arms, a held object) should point toward the other figure. Keep at least 16px between the art and the UI.

### Structure
Group the SVG by entrance order and animation target:
```
<g class="r r1"> environment (wall, door, floor, props)   </g>
<g class="r r2"> secondary figure <g class="nod">head</g> </g>
<g class="r r3"> protagonist <g class="arm">arm + held object</g> </g>
<g class="r r4"> foreground prop                          </g>
<g class="bub"> quote/info card  </g>
<g class="ok">  confirmation badge </g>
```
Wrap all the art in one `<g transform="translate(0 Y)">` so the whole scene can be moved to clear the UI.

### Animation (CSS in an SVG `<style>`)
- **Entrance (once):** each `.r` group fades in and rises 10px. It lasts 0.7s with `cubic-bezier(.2,0,0,1)`, and groups start 150–250ms apart: environment, then figures, then props.
- **Loop (6s, infinite, starts after the entrance):**
  - Writing: lines on the held object draw on with `stroke-dasharray`/`stroke-dashoffset`, staggered 0.3s.
  - Card pops in with `scale(0→1)` from its tail point at about 14–22% of the loop and holds until 80%.
  - Reaction: head nods twice (rotate -4°, translate 2px) at 40–60%.
  - Confirmation badge pops in at 40–48%.
  - Everything resets at 88–100% so the loop is seamless.
- Set `transform-origin` in px on every animated group (at the pivot: neck, shoulder, bubble tail).
- Offer a motion setting: Standard, Slow (durations ×1.8) and Off (no `<style>` rules, static final frame).

### Output
One SVG string with its `<style>` block, ready to inject. Make it `width:100%;height:100%`, with `preserveAspectRatio="xMidYMin slice"` and `pointer-events:none`.

---

## Tips
- Name the story beat first. The loop should show one clear cause and effect, like quote sent → customer approves.
- If it looks childish, remove things. Take away outlines, facial features and wobble. Flatter reads as more professional.
- If it looks empty, add a light spill or a shadow. Don't add more objects.
- Check the settled frame (after about 3s) against the surrounding UI for overlaps.
