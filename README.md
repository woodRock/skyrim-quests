# Skyrim Quests

A quest log for real life, styled as *The Elder Scrolls V: Skyrim*, installable on a phone as a PWA.
A fan project: all art and sounds are original, and it isn't affiliated with Bethesda.

```bash
bun install
bun run dev
```

## The loop

| Game | Real life |
|---|---|
| Side quest (small / medium / large) | A single task. Pays 10 / 25 / 100 gold and skill XP |
| Misc objective | A daily habit. Fills a Stamina segment and keeps your streak |
| Main quest → objectives → the dragon | A project → its steps → the final step. Slaying the dragon grants a Dragon Soul and a Health container |
| Health | Overdue quests cost a quarter heart each dawn; any finished quest heals. At zero: YOU DIED, load last save |
| Magicka | Spells (the wellbeing exercises) spend it; the nightly Chronicle restores it by hours slept |
| Stamina | Five segments filled by dailies and streak nights; Shouts spend them |
| Skills and perks | Eight real-life skills (rest, work, self-care, relationships, food, movement, training, mindfulness). Perks need a point, a linked star and a skill level |
| Dragon Souls | Each one teaches a word of power; shouts last longer with more words |
| Holds | Quest categories that unlock as you progress: Whiterun is home, Solitude is work, Riften is money... |
| Belethor | Gold buys potions, lore books and gear |
| The Chronicle | Mood, energy, rest and three triumphs each night: resting at the inn |

Game rules live in `src/game/logic.ts` with tests in `src/game/logic.test.ts`; screens are in `src/screens/`.

## Saves and sync

- **Local mode** (default): with no Firebase config, saves stay in this browser and sign-in only needs an email.
- **Cloud mode**: fill `.env` from `.env.example` with a Firebase web config. Sign-in uses Firebase Auth (email/password and Google). Saves live at `users/{uid}/saves/{slot}` and work offline.

The production build shares the `moody-bitch` Firebase project with the original app, so players keep one account. A Firestore deploy replaces every rule in the project, which is why `firestore.rules` here is a byte-for-byte copy of `moody-bitch/firestore.rules` (the save-slot block is at the end). Change it there, copy it here, then deploy from either repo:
  ```bash
  bunx firebase-tools login
  bunx firebase-tools deploy --only firestore:rules
  ```

To try cloud mode without touching real data, run the emulators and point the dev server at them:
  ```bash
  bun run emulators                       # Auth on 9099, Firestore on 8085
  VITE_USE_EMULATORS=true bun run dev
  ```

## The scribe (AI lore)

Quest lore and the Thought Forge use Gemini through the Cloudflare Worker in `moody-bitch/worker`. Set `VITE_LORE_PROXY_URL` to it and add this app's origin to the worker's `ALLOWED_ORIGINS`. It only works for cloud players (the worker verifies the Firebase sign-in); local mode and offline play use built-in text.

## Deploying

Push to `main`: the workflow builds with Bun and publishes to GitHub Pages. Add the `VITE_*` values as repository secrets. `public/404.html` makes deep links work on Pages. To host at a domain root, set `VITE_BASE_PATH=/`.

## Scripts

| Script | What it does |
|---|---|
| `bun run build` | Type-check and build to `dist/` |
| `bun run check` | Lint, type-check and test |
| `bun run preview` | Serve the built bundle under the production base path |
