# Reader design

The brief behind `app/`. Give it to a design-minded agent (or the `impeccable` and `frontend-design` skills) before changing the UI, so changes keep the same voice.

## Who reads it

One person doing daily deep work: reading, following links, learning a domain. Second, the same person screen-sharing mid-meeting, where the tool has to look as serious as the problem it covers.

## Personality

Investigative, utilitarian, honest. Think of a detective's evidence wall (open threads, connections, annotations) drawn in the visual language of an industrial control room: schematics, ledgers, stencils, gauges. Never decorative, never corporate, never a SaaS dashboard.

## Direction: a control-room console running an investigation

- Section labels read like panel legends: letterspaced condensed caps with a small block marker.
- Data looks like instrumentation. Open questions look like lit indicator lamps.
- Both themes are first-class. Light is the default.

## Palette

One token system in OKLCH using CSS `light-dark()`, with a persisted toggle. All tokens live in `app/src/index.css` under `@theme`.

- **Light: hot copper and cold teal on white paper.** Achromatic paper, cool ink (hue about 220), bold teal-blue hairlines. Hot copper (hue 55, high chroma, near burnt orange) for links and active states. Cold teal for settled states.
- **Dark: petrol void.** Neutrals tinted toward petrol blue (hue about 240), background just off black (L 17.5%). Body text is warm bone (L 83%), not white, to avoid halation.
- **Three signal colors, each with one job.** Copper is the accent (links, active, labels). Alert (scarlet in light, orange in dark) appears only where something is unknown or open. Gauge teal (green in dark) marks settled, answered things.
- **One color per page type,** tuned separately for each theme.

The copper and teal sit about 165 degrees apart on the hue wheel, so the eye snaps between "active" and "settled" without reading a label.

## Type

- **Saira** (condensed, 550 to 700) for display and panel legends. It descends from DIN road signage.
- **Atkinson Hyperlegible Next** for body text. Designed for legibility.
- **Fragment Mono** for slugs, file paths, dates and anything a reader might copy.

Small sizes use a tight ramp and tracking set per role. Numbers use tabular figures.

## Principles

1. **Evidence, not decoration.** Every visual element states a fact (type, status, edge, source) or gets deleted.
2. **The ledger is the look.** Ruled lines, dotted leaders, tabular numerals, hairline borders. Density done well beats whitespace done blandly.
3. **The alert color is a signal, not a style.** It appears only where something is open or unknown. If everything glows, nothing does.
4. **Reads like print, works like software.** A screenshot should look like a page from a well-set case file.
5. **Text fills its container.** No `max-width` on paragraphs, list items or headings in panels, cards or toolbars. Only the article reading column gets a measure, set on the column.

## Anti-references

Generic SaaS dashboards. Cyan-glow "hacker" dark mode. Rounded-card grids. Gradient text. Anything that makes someone ask which AI made it.

## Citations

Links from a page to `raw/` render as small source markers. Hovering or tapping one opens a popover with the source's header (title, origin, collected and published dates, word count) and the other pages that cite it. Source bodies never enter the bundle: a Vite plugin reads only the header lines at build time. That keeps the single-file export safe to send even when `raw/` holds material you would not email.
