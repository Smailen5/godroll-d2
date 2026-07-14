# Guida Sviluppatore — Architettura, script e pipeline

## Panoramica

godroll-d2 e un sistema a pipeline che trasforma file Markdown in wishlist DIM:

```
.md (sorgente)  ──→  scripts/generate-dim-wishlist.js  ──→  .txt (DIM-ready)
```

Oltre alla pipeline principale, ci sono script per:

- Validare la sintassi e la coerenza dei file
- Scaricare e verificare il manifest Bungie (armi e perk)
- Gestire il formato legacy (migrazione e manutenzione)

## Struttura del progetto

```
godroll-d2/
├── .cache/                          # Cache del manifest Bungie (gitignorato)
├── .github/
│   ├── ISSUE_TEMPLATE/              # Template issue (add-roll, edit-roll, ...)
│   ├── workflows/
│   │   ├── release-please.yml       # Release automatica
│   │   └── validate.yml             # CI su PR verso main
│   └── pull_request_template.md     # Template PR
├── docs/                            # Guide e documentazione
│   ├── guida-giocatore.md           # Guida per utenti non tecnici
│   └── guida-sviluppatore.md        # Questa guida
├── godroll/
│   └── <utente>/
│       ├── godroll.md               # File sorgente (input)
│       └── godroll.txt              # File DIM generato (output, non editare)
├── scripts/
│   ├── generate-dim-wishlist.js     # Pipeline principale .md → .txt
│   ├── validate.js                  # Validazione file legacy
│   ├── add-roll-comments.js         # Aggiunge commenti //? Roll: (legacy)
│   ├── add-roll-from-comments.js    # Genera dimwishlist da //? Roll: (legacy)
│   ├── fetch-perks.js               # Scarica manifest perk da Bungie
│   └── fetch-weapons.js             # Scarica manifest armi da Bungie
├── godroll-list-dim.txt             # File legacy (deprecato)
├── perks-reference.json             # Mappa ID → nome perk
├── weapons-reference.json           # Mappa ID → nome arma
├── package.json                     # Script npm e versione
├── release-please-config.json       # Config release automatica
├── .release-please-manifest.json    # Versione corrente
├── CONVENTION.md                    # Convenzioni di progetto
├── CONTRIBUTING.md                  # Guida alla contribuzione
├── README.md                        # Landing page
└── CHANGELOG.md                     # Storico release
```

## Script disponibili

| Comando | Script | Scopo |
|---------|--------|-------|
| `npm run generate -- <file.md>` | `generate-dim-wishlist.js` | Genera `.txt` da `.md` |
| `npm run generate -- --check <file.md>` | `generate-dim-wishlist.js` | Solo validazione, non scrive |
| `npm run validate` | `validate.js` | Valida file legacy |
| `npm run validate --strict` | `validate.js` | Warning diventano errori |
| `npm run add-roll-comments` | `add-roll-comments.js` | Aggiunge `//? Roll:` a dimwishlist esistenti |
| `npm run add-roll-from-comments` | `add-roll-from-comments.js` | Genera dimwishlist da `//? Roll:` |
| `npm run fetch-perks` | `fetch-perks.js` | Scarica manifest Bungie, verifica perk |
| `npm run fetch-weapons` | `fetch-weapons.js` | Scarica manifest Bungie, verifica armi |

## Pipeline di generazione

`scripts/generate-dim-wishlist.js` e il cuore del progetto. Trasforma un file
sorgente Markdown in un file DIM pronto all uso.

### Input

Un file Markdown con questo formato:

```markdown
# title: Godroll — Lista Desideri D2
## description: Wishlist personale e del clan

### Nome Arma
- fonte: Smailen
- attivita: PVE
- notes: Roll consigliati per GM

#### Roll
- perk1, perk2, perk3, perk4, perk5. #notes:Nota inline
#notes:Block note
- qualsiasi, -, perk3, perk4, perk5.
```

### Output

Un file `.txt` con solo le righe che DIM riconosce:

```
title:Godroll — Lista Desideri D2
description:Wishlist personale e del clan

//notes:Smailen (Misto): Roll consigliati per il PVE
dimwishlist:item=214545213&perks=3661387068,106909392,776531651,2048641572,859855990#notes:Nota inline
dimwishlist:item=214545213&perks=0,0,776531651,2048641572,859855990
```

Niente `//? Roll:` o altri commenti che rompono i block note in DIM.

### Come funziona

1. **Carica reference** — legge `weapons-reference.json` e
   `perks-reference.json` e costruisce indici `nome_lowercase → id`
2. **Parsifica il Markdown** riga per riga:
   - `# title:` → titolo DIM
   - `## description:` → descrizione DIM
   - `### Nome Arma` → separatore arma (riconosce `(-69420)` come wildcard)
   - `- fonte:` / `- attivita:` / `- notes:` → metadati → `//notes:`
   - `#### Roll` → skip
   - `#notes:...` → block note corrente
   - `- perk1, ...` → roll: risolve nomi in ID via reference, completa a 5
     colonne con `0` (per `qualsiasi` o `-`)
3. **Genera output** — scrive il file `.txt` con lo stesso nome nella stessa
   directory del file `.md` di input
4. **Validazione** — segnala duplicati, armi non trovate, perk non trovati,
   roll con zero colonne, roll con piu di 5 colonne

### Modalita `--check`

Con `--check` lo script esegue solo la validazione senza scrivere il file
output. Esce con codice 0 se tutto ok, 1 se ci sono errori.

## File di riferimento (JSON)

### `weapons-reference.json`

```json
{
  "214545213": { "name": "Igneous Hammer" },
  "294534816": { "name": "The Last Word" }
}
```

### `perks-reference.json`

```json
{
  "3661387068": {
    "name": "Fame Ruggente",
    "enhancedId": "4012965374",
    "baseId": "3661387068"
  }
}
```

- `name` — nome del perk in italiano
- `enhancedId` — ID della versione potenziata (per armi crafting)
- `baseId` — ID della versione base (coincide con la chiave dell oggetto)

## Manifest Bungie

Gli script `fetch-perks.js` e `fetch-weapons.js` scaricano il file
`DestinyInventoryItemLiteDefinition` dal manifest ufficiale di Bungie
(locale italiano).

### Cache

- `.cache/perks-it.json` — tutti gli oggetti inventario del manifest (filtro
  per perk)
- `.cache/items-it.json` — tutti gli oggetti inventario del manifest
- La cache ha una validita di **24 ore**. Se il file cache e piu recente, il
  download viene saltato.

### Utilizzo

```bash
# Verifica tutti i perk nel reference
npm run fetch-perks

# Verifica solo ID specifici
npm run fetch-perks 123456 789012

# Verifica tutte le armi nel reference + godroll-list-dim.txt
npm run fetch-weapons
```

Lo script confronta ogni ID presente nei file di reference con il manifest.
Per ogni ID segnala:

- **OK** — ID trovato, nome corrisponde
- **NON TROVATO** — ID non presente nel manifest
- **DISCREPANZA** — ID trovato ma il nome nel reference non corrisponde al
  nome ufficiale

## Aggiungere un nuovo utente

Per aggiungere un nuovo giocatore alla wishlist:

1. Crea la directory `godroll/<nome-utente>/`
2. Crea il file `godroll/<nome-utente>/godroll.md` con il formato Markdown
3. Genera il file DIM: `npm run generate -- godroll/<utente>/godroll.md`
4. Verifica il file `.txt` generato
5. Commit e PR

Non serve configurare nulla: lo script accetta qualsiasi file `.md` come
input e produce l output nella stessa directory.

## CI/CD

### validate.yml

Trigger: pull request verso `main`

```yaml
passi:
  - setup Node 20 + pnpm 9
  - pnpm install
  - pnpm validate
```

Valida la sintassi del file legacy `godroll-list-dim.txt`. Al momento non
valida i file `.md` dei singoli utenti.

### release-please.yml

Trigger: push su `main`

Usa `googleapis/release-please-action@v4` con configurazione da
`release-please-config.json`. Genera automaticamente:

- Release su GitHub
- Tag (es. `v1.0.0`)
- `CHANGELOG.md` aggiornato
- `.release-please-manifest.json` aggiornato

**Non toccare mai** il branch remoto `release-please--branches--main--*` e le
PR aperte da release-please. Sono gestiti automaticamente.

## Script legacy (manutenzione)

### `add-roll-comments.js`

Legge `godroll-list-dim.txt`, trova ogni riga `dimwishlist:` che non ha un
commento `//? Roll:` sopra, e lo genera traducendo gli ID numerici in nomi
perk.

Idempotente: esecuzioni multiple non creano duplicati.

### `add-roll-from-comments.js`

Direzione inversa: trova ogni commento `//? Roll:` che non ha una riga
`dimwishlist:` subito sotto, e genera la riga con gli ID corretti. Se un arma
o un perk non e nei file di reference, lo cerca automaticamente nel manifest
Bungie in cache (`.cache/`).

Idempotente.

### `validate.js`

Valida il file `godroll-list-dim.txt`:

- Sintassi delle righe `dimwishlist:`
- ID perk presenti in `perks-reference.json`
- Coerenza tra nomi in `//? Roll:` e ID nel roll sottostante
- Roll duplicati
- Commenti non validi

In modalita `--strict` i warning diventano errori con exit code 1.

## Consulta anche

- [CONVENTION.md](../CONVENTION.md) — regole di commit, branch, lingua
- [Guida Giocatore](guida-giocatore.md) — per capire il formato dal punto di
  vista dell utente
