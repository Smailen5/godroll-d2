# Contribuire a godroll-d2

Grazie per voler contribuire! Qui trovi le istruzioni per ogni tipo di
contributore.

## Per giocatori (aggiungere roll)

Se vuoi suggerire un roll per un arma, non serve saper programmare.

### 1. Leggi la guida

Leggi la [Guida Giocatore](docs/guida-giocatore.md) per capire come sono
strutturati i roll e quali informazioni servono.

### 2. Apri una issue

Vai alla scheda [Issues](https://github.com/Smailen5/godroll-d2/issues) e
clicca **New issue**. Scegli il template giusto:

| Template | Quando usarlo |
|----------|---------------|
| **Add Roll** | Hai un nuovo roll da aggiungere |
| **Edit Roll** | Un roll esistente ha perk o note sbagliate |
| **Remove Roll** | Un roll non e piu valido (nerfato, sostituito) |

### 3. Compila i campi

Il template ti guidera. Dovrai specificare:

- **Arma** — nome dell arma
- **Perk** — elenco dei perk per ogni roll
- **Attivita** — PVP / PVE / Gambit / Incursioni / Boss / Misto
- **Note** — descrizione dell utilizzo
- **Fonte** — chi ha consigliato il roll

### 4. Invia e attendi

Un maintainer verifichera la richiesta e provvedera ad aggiungere il roll.

---

## Per sviluppatori (contribuire codice)

Se hai familiarita con Git e vuoi contribuire direttamente con codice:

### Prerequisiti

- Node.js 20+
- pnpm 9+
- Git

### Setup

```bash
git clone https://github.com/Smailen5/godroll-d2.git
cd godroll-d2
pnpm install
```

### Script disponibili

Vedi [Guida Sviluppatore](docs/guida-sviluppatore.md) per la documentazione
completa di tutti gli script.

### Flusso di lavoro

1. Crea un branch da `main`:
   ```bash
   git checkout -b <tipo>/<nome-modifica>
   ```
   Tipi: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
2. Fai le modifiche con commit atomici
3. Esegui `pnpm validate` per verificare la sintassi
4. Apri una PR verso `main` seguendo il template

### Convenzioni

Vedi [CONVENTION.md](CONVENTION.md) per regole complete su:

- Formato e lingua dei commit
- Nomenclatura branch
- Lingua codice vs documentazione
- Struttura PR e issue
- Formattazione della documentazione

### Cosa puoi modificare

- `godroll/<utente>/godroll.md` — aggiungere, modificare o rimuovere roll
- `scripts/` — script di gestione
- `docs/` — documentazione
- `.github/` — template issue, workflow, configurazioni
- `perks-reference.json`, `weapons-reference.json` — reference dati
- `README.md`, `CONTRIBUTING.md`, `CONVENTION.md` — documentazione root

### Cosa NON modificare

- `godroll/<utente>/godroll.txt` — file generato automaticamente
- Branch remoti `release-please--branches--main--*`
- PR aperte da release-please

## Codice di condotta

Sii rispettoso e costruttivo. Questo progetto e aperto a tutti,
indipendentemente dal livello di esperienza.
