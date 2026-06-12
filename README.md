# CYBERSEC CYPRUS

Minimal one-page site for **CYBERSEC CYPRUS** — security & IT outsourcing for small
and medium businesses in Cyprus. Static (plain HTML / CSS / JS), hosted on GitHub Pages
at **https://cybersec.cy**.

Shares the PALANIT design language (Anton + Space Grotesk, lime / pop palette).

## Structure

```
index.html    — the page (title + services accordion + email CTA)
privacy.html  — Политика конфиденциальности (GDPR / Cyprus)
terms.html    — Правила и условия
styles.css    — all styles (no build step)
script.js     — service catalogue + two-level accordion
favicon.svg   — orange “C” in a black rounded square
CNAME         — custom domain (cybersec.cy)
.nojekyll     — tells GitHub Pages to skip Jekyll
```

## Edit & deploy

1. Edit the files.
2. Commit and push to `main`:
   ```bash
   git add -A
   git commit -m "Update site"
   git push
   ```
3. GitHub Pages rebuilds automatically (~1 min).

## What to customise

- **Service prices** — in `script.js` (`SERVICES` array). Current values are indicative
  starting points for the Cyprus SMB market; adjust to your real quotes.
- **Services list** — add / remove items in the same `SERVICES` array.

## DNS (Cloudflare)

`cybersec.cy` → GitHub Pages:
- `A @` → 185.199.108.153 / .109.153 / .110.153 / .111.153 (DNS only)
- `CNAME www` → stasxr.github.io
