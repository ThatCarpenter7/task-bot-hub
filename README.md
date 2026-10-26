# Task Bot Hub (GitHub Pages)

Static landing page with:

- **$0.99 USD paywall** (Stripe Payment Link) gating on-page chat & tools
- **Four Task Bots** as paid handoff targets (picker)
- **Overseer** in the public fleet section (efficiencies & revenue) — **not** behind the paywall
- Optional **on-page AI** via xAI / OpenAI-compatible chat completions
- No tracking scripts, no hardcoded secrets

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing, fleet, bot picker, gated chat |
| `styles.css` | Responsive light/dark-friendly UI |
| `app.js` | Paywall, chat, AI call, deep links |
| `config.js` | **Fill placeholders here** |
| `success.html` | Post-checkout unlock → redirect home |
| `README.md` | This guide |

## Placeholders to fill (`config.js`)

1. **`STRIPE_PAYMENT_LINK`** — Stripe Payment Link URL for a **$0.99 USD** product/price.
2. **`AI_ENDPOINT`** (optional) — e.g. your Cloudflare Worker URL, or `https://api.x.ai/v1/chat/completions` for local testing only.
3. **`AI_API_KEY`** — **leave empty** on GitHub Pages. Keys in static JS are public.
4. **`DEMO_UNLOCK`** — `false` in production; set `true` only for local demos without paying.
5. After-payment redirect in Stripe → `https://YOUR_USER.github.io/YOUR_REPO/success.html`  
   (or homepage with `?paid=1`).

Task Bot IDs and Overseer are already wired in `config.js`.

## Stripe ($0.99 unlock)

1. In [Stripe Dashboard](https://dashboard.stripe.com/) create a **Product** priced at **$0.99 USD** (one-time).
2. Create a **Payment Link** for that price.
3. Under Payment Link settings, set **After payment** → redirect to your  
   `success.html` URL (recommended) or `index.html?paid=1`.
4. Paste the Payment Link into `config.js` → `STRIPE_PAYMENT_LINK`.

`success.html` sets `localStorage['task-bot-site-unlocked'] = '1'` and redirects to `index.html?paid=1`.

> Soft unlock only proves UX. For stronger enforcement, verify Stripe sessions on a backend before unlocking.

## GitHub Pages

1. Push this folder as the repo **root** (or place files under `/docs`).
2. **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch**.
4. Branch: `main`, folder: `/ (root)` or `/docs`.
5. Site URL: `https://<user>.github.io/<repo>/`.

## Optional: Cloudflare Worker proxy (required for real AI keys)

GitHub Pages cannot hide secrets. Proxy chat completions:

1. Create a Worker that accepts `POST` with `{ model, messages, ... }`.
2. On the Worker, call `https://api.x.ai/v1/chat/completions` with  
   `Authorization: Bearer <secret>` from a **Worker secret** (not the page).
3. Enable CORS for your Pages origin.
4. Set `AI_ENDPOINT` in `config.js` to the Worker URL.
5. Keep `AI_API_KEY` empty in `config.js`.

Until `AI_ENDPOINT` is set, unlocked chat still **collects** requests and can **open the selected Task Bot**.

## Agents

| Agent | Role | Paywall |
|-------|------|---------|
| [Overseer](grokbot://app/v1/agent?id=3ed67bf6-5dba-4d77-9709-c204595ec6b8) | Efficiencies & revenue | No — fleet contact |
| [Task Bot 1](grokbot://app/v1/agent?id=1e68c0e4-7df0-48fa-900d-adea23650e12) | General / research | Yes — handoff picker |
| [Task Bot 2](grokbot://app/v1/agent?id=a5edb3b1-8cbf-4347-ab76-5b3491ba55b3) | Writing & drafts | Yes — handoff picker |
| [Task Bot 3](grokbot://app/v1/agent?id=cd8f2009-198d-4173-b9aa-a965f64315b0) | Planning | Yes — handoff picker |
| [Task Bot 4](grokbot://app/v1/agent?id=526848c3-39a9-45b8-a4b2-2e4f6dd699c0) | Creative / kids | Yes — handoff picker |

## Local preview

```bash
cd /workspace/task-bot-site
# Optional soft unlock while testing UI:
# edit config.js → DEMO_UNLOCK: true
python3 -m http.server 8080
```

Open `http://localhost:8080`.
