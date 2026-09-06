# Sport rules sheets (in-site viewer)

Rules open **on the website** at:

```
https://cbitaura.in/rules.html?sport=basketball
```

Not as a raw PNG in a new browser tab.

## How to add a sport’s rules

1. Put the file here:
   - `assets/rules/<sport-id>-rules.png`  (or `.jpg` / `.pdf`)
2. In `js/config.js` under `RULES_SHEETS`, add:

```js
cricket: "assets/rules/cricket-rules.png",
// or
football: {
  file: "assets/rules/football-rules.pdf",
  title: "Optional one-line description",
},
```

3. Sport id must match `SPORTS` in config (`cricket`, `basketball`, `football`, …).
4. On the sports card in `index.html`, link:

```html
<a class="soon" href="rules.html?sport=cricket">View rules →</a>
```

5. Commit + push. Register form auto-shows the link when that sport is selected.

## Current

| Sport | File | Viewer |
|-------|------|--------|
| Basketball | `basketball-rules.png` | `rules.html?sport=basketball` |
| Cricket | `cricket-rules.png` | `rules.html?sport=cricket` |
| Volleyball | `volleyball-rules.png` | `rules.html?sport=volleyball` |
| Kabaddi | `kabaddi-rules.png` | `rules.html?sport=kabaddi` |
| Throwball | `throwball-rules.png` | `rules.html?sport=throwball` |
| Badminton | `badminton-rules.png` | `rules.html?sport=badminton` |
| Carroms | `carroms-rules.png` | `rules.html?sport=carroms` |
| Table Tennis | `table-tennis-rules.png` | `rules.html?sport=table-tennis` |
| Chess | `chess-rules.png` | `rules.html?sport=chess` |

## Naming tip

Use the same ids as registration: `basketball`, `table-tennis`, `throwball`, etc.
