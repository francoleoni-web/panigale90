# Pannello di gestione `/admin` — come attivare il login

Il sito ha un pannello di amministrazione (Decap CMS) raggiungibile su **`/admin`**
(es. `https://panigale90.com/admin`). Lì si bloccano/sbloccano le date con un calendario,
senza toccare il codice. Le modifiche vengono salvate in `availability.json` e il sito si
aggiorna da solo in ~1 minuto.

Il login usa l'**account GitHub** di chi gestisce il sito. Per funzionare serve un piccolo
"broker" di autenticazione (gratuito). Scegli **una** delle due opzioni.

---

## Opzione 1 — Hosting su Netlify *(consigliata: login pronto in pochi clic)*

1. Vai su **netlify.com** → registrati gratis (puoi usare "Sign up with GitHub").
2. **Add new site → Import an existing project → GitHub** → scegli il repository
   `giuliosaladini/panigale90`. Build: nessuna (sito statico), publish directory: `/`.
3. A sito creato: **Site configuration → Access control → OAuth → Install provider → GitHub**.
   (Netlify fa così da broker per il login del pannello: non serve creare nient'altro.)
4. Vai su `https://<nome-sito>.netlify.app/admin` → **Login with GitHub** → fatto.
5. Quando colleghi il dominio: in Netlify **Domain management → Add domain → panigale90.com**,
   e su Cloudflare imposti i record DNS che ti indica Netlify (sostituiscono quelli di GitHub Pages).

> In questo caso nel file `admin/config.yml` NON serve toccare `base_url` (lascialo commentato).

---

## Opzione 2 — Restare su GitHub Pages + Cloudflare Worker

Tiene tutto su GitHub Pages (come ora) e usa un piccolo Worker gratuito su Cloudflare come broker.

1. **Crea una GitHub OAuth App**: GitHub → *Settings → Developer settings → OAuth Apps → New*.
   - Homepage URL: `https://panigale90.com`
   - Authorization callback URL: `https://panigale90-auth.<TUO-UTENTE>.workers.dev/callback`
   - Annota **Client ID** e genera un **Client Secret**.
2. **Deploya il Worker di autenticazione** (progetto pronto all'uso):
   `https://github.com/sveltia/sveltia-cms-auth` → "Deploy to Cloudflare".
   Imposta le variabili: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
   `ALLOWED_DOMAINS = panigale90.com`.
3. In **`admin/config.yml`** togli il commento a `base_url` e metti l'URL del Worker
   (es. `https://panigale90-auth.<TUO-UTENTE>.workers.dev`). Fai commit.
4. Vai su `https://panigale90.com/admin` → **Login with GitHub** → fatto.

---

## Chi può accedere
Può entrare solo chi ha accesso in scrittura al repository `giuliosaladini/panigale90`.
- Se gestisci tu: usi il tuo account GitHub.
- Se lo gestisce Giulio: crea un account GitHub e aggiungilo come **collaboratore** del repo
  (*Settings → Collaborators → Add people*).

## Come si usa (per Giulio)
1. Apri `panigale90.com/admin` → **Login with GitHub**.
2. **Gestione → Disponibilità — date occupate**.
3. In "Periodi occupati" premi **Add** e scegli **Dal** / **Al** dal calendario. Per liberare
   una data, elimina il periodo.
4. **Publish** in alto. Dopo ~1 minuto il sito è aggiornato.
