# amirhossainarshadikalameh.github.io

Personal academic website of **Amirhossain Arshadi** — complex systems, network science and quantitative biology.

Live at **https://amirhossainarshadikalameh.github.io**

## Files

| File | Purpose |
|---|---|
| `index.html` | The page itself: all the content |
| `site.css` | All styles (colours, layout, light/dark theme) |
| `site.js` | Tabs, theme switch, timeline chart, gallery viewer |
| `CV.pdf` | The CV; the "Download CV" buttons appear only when this file exists |
| `profile.jpg` | Your photo (square, ~400×400). Until it exists, the site shows your initials |
| `preview.png` | Image shown when the link is shared on LinkedIn, Telegram, etc. |
| `gallery/` | Photos for the Gallery tab |
| `favicon.svg` | Browser-tab icon |
| `404.html` | "Page not found" page |
| `.nojekyll` | Serves the files exactly as they are |

## Editing

Open `index.html` and look for the ✏️ marks — they sit on everything you are likely to change.

* **Research timeline:** the chart is drawn from the table with `id="tl-data"`. Edit a row's `data-start` / `data-end` (`YYYY-MM`, or `now` for ongoing) and the chart follows. `data-asof` sets the "today" line.
* **Placeholder links:** Google Scholar and ORCID links stay hidden until you replace `YOUR-SCHOLAR-ID` and `YOUR-ORCID`.
* **Gallery:** add photos to `gallery/` and copy the commented example inside `id="galleryGrid"`. The tab appears once at least one photo is there.

After editing on GitHub, press **Commit changes**; the site refreshes in about a minute (Ctrl + F5 if you still see the old version).

## Tabs

About · Research · Teaching · Certificates · Gallery · CV & Contact — each tab has its own address, e.g. `#research`, `#certificates`.
