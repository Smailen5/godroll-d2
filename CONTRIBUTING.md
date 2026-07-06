# Contribuire a godroll-d2

Grazie per voler contribuire! Questa guida ti spiega come aggiungere, modificare o segnalare roll per la wishlist di Destiny 2.

## Per i membri del clan (non sviluppatori)

Se vuoi contribuire con un roll ma non hai confidenza con Git o GitHub, segui questi passaggi:

### 1. Apri una issue

Vai alla scheda [Issues](https://github.com/Smailen5/godroll-d2/issues) e clicca **"New issue"**. Scegli il template giusto in base a cosa vuoi fare:

| Template | Quando usarlo |
|----------|--------------|
| **Aggiunta roll** | Hai un nuovo roll da aggiungere alla wishlist |
| **Modifica roll** | Un roll esistente ha perk o note sbagliate |
| **Eliminazione roll** | Un roll non e' piu' valido (nerfato, sostituito, ecc.) |

### 2. Trova la stringa del roll su DIM

DIM ti permette di copiare direttamente la stringa del roll che vuoi consigliare. Ecco come fare:

#### Se hai l'arma nell'inventario

1. Apri [DIM](https://app.destinyitemmanager.com/)
2. Trova l'arma nel tuo inventario e **cliccaci sopra**
3. Si apre una scheda con i dettagli dell'arma. **Clicca sul nome dell'arma** (in alto, di fianco all'icona)
4. Si apre una finestra piu' grande. Qui puoi **selezionare i perk** che vuoi consigliare cliccando sulle caselle dei vari slot
5. Una volta selezionati i perk giusti, in basso trovi il pulsante **"Copia le peculiarita' selezionate come roll lista desideri"**
6. Cliccalo: la stringa del roll viene copiata automaticamente

#### Se non hai l'arma

1. Apri [DIM](https://app.destinyitemmanager.com/)
2. Usa la **barra di ricerca** in alto e digita il nome dell'arma
3. Clicca sul risultato della ricerca: si apre direttamente la finestra grande con tutti gli slot dei perk
4. **Seleziona i perk** che vuoi consigliare
5. In basso, clicca **"Copia le peculiarita' selezionate come roll lista desideri"**

#### Alternativa: copia manuale

Nella stessa finestra, di fianco al pulsante, c'e' anche la stringa completa del roll. Puoi **copiarla manualmente** se preferisci.

### 3. Compila la issue

Ora che hai la stringa del roll, apri la issue e incollala nel campo appropriato. Il template ti guidera' con tutti i campi:

- **Stringa del roll** — incolla qui la/e stringa/e copiate da DIM (una per riga). Se hai piu' varianti dello stesso roll (es. PVP e PVE), puoi incollarle tutte nella stessa issue.
- **Attivita' target** — seleziona per che tipo di attivita' e' consigliato il roll (PVP, PVE, Gambit, Incursioni, Boss, Misto)
- **Note** — una breve descrizione dell'utilizzo (es. "Ottimo per PvE, sinergia con xyz")
- **Fonte** — chi ha consigliato questo roll (es. "Consigliato da Smailen", "Trovato su light.gg")

### 4. Aspetta la revisione

Un maintainer verifichera' la richiesta e provvedera' ad aggiungere il roll alla wishlist.

---

## Per sviluppatori

Se hai familiarita' con Git e vuoi contribuire direttamente con codice o modifiche al repo:

### Setup

```bash
git clone https://github.com/Smailen5/godroll-d2.git
cd godroll-d2
pnpm install
```

### Formato del file

Il file `godroll-list-dim.txt` usa il formato DIM wishlist con commenti estesi:

```
//* Nome Arma
//? Roll: Perk1, Perk2, Perk3, Perk4, Perk5
dimwishlist:item=<ID>&perks=<id1>,<id2>,<id3>,<id4>,<id5>#notes:<descrizione>
```

**Elementi DIM standard:**
- `title:<titolo>` — titolo della wishlist
- `description:<descrizione>` — descrizione della wishlist
- `//notes:<testo>` — block note per tutti i roll successivi
- `#notes:<testo>` — nota inline per il singolo roll
- `//` — commento ignorato da DIM

**Estensioni del progetto:**
- `//* Nome Arma` — separatore arma (asterisco per distinguerlo dai commenti `//`)
- `//? Roll:` — nomi leggibili dei perk (generato da `add-roll-comments`)
- I file `perks-reference.json` e `weapons-reference.json` mappano ID numerici ↔ nomi italiani

### Branch convention

Crea un branch con nome descrittivo:

```
git checkout -b <tipo>/<nome-modifica>
```

Tipi ammessi: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

### Commit convention

Usiamo i [Conventional Commits](https://www.conventionalcommits.org/). Il messaggio deve essere in **italiano** con verbo al presente (3a persona singolare):

```
feat: aggiunge roll Fornace Esplosiva
fix: corregge perk ID per Fame Ruggente
docs: aggiorna README con nuovi badge
```

### Come aprire una Pull Request

1. Assicurati che il branch sia aggiornato con `main`
2. Esegui `pnpm validate` per verificare la sintassi del file wishlist
3. Apri una PR su GitHub
4. Il titolo deve seguire i Conventional Commits
5. Nella descrizione, collega la issue risolta con `Closes #numero`

### Script disponibili

| Comando | Cosa fa |
|---------|---------|
| `pnpm validate` | Valida sintassi, ID sconosciuti e coerenza `//? Roll:` |
| `pnpm validate --strict` | Come sopra ma i warning bloccano |
| `pnpm add-roll-comments` | Genera `//? Roll:` dai `dimwishlist:` esistenti |
| `pnpm add-roll-from-comments` | Genera `dimwishlist:` dai `//? Roll:` (cerca armi/perk nuovi nel manifest) |
| `pnpm fetch-perks` | Scarica il manifest e verifica i perk nella reference |
| `pnpm fetch-weapons` | Scarica il manifest e verifica le armi nella reference |

### Flusso per aggiungere un roll

**Da DIM (con ID) — il piu' comune:**

1. Copia la stringa del roll da DIM
2. Incollala nel file sotto il commento `//*` dell'arma
3. Esegui `pnpm add-roll-comments` per generare il commento `//? Roll:`
4. Esegui `pnpm validate` per verificare

**Da nomi (senza ID) — per nuove armi:**

1. Scrivi `//* Nome Arma` e `//? Roll: Perk1, Perk2, ...`
2. Esegui `pnpm add-roll-from-comments` per generare la riga `dimwishlist:`
3. Esegui `pnpm validate` per verificare

Se l'arma o i perk non sono nella reference, `add-roll-from-comments` li cerca automaticamente nel manifest Bungie (richiede `pnpm fetch-weapons` o `pnpm fetch-perks` eseguito almeno una volta).

### Cosa puoi modificare

- `godroll-list-dim.txt` — aggiungere, modificare o rimuovere roll
- `perks-reference.json`, `weapons-reference.json` — reference automatici (modifica solo se necessario)
- `scripts/` — script di gestione
- `.github/` — template issue, workflow, configurazioni
- `README.md`, `CONTRIBUTING.md` — documentazione

## Codice di condotta

Sii rispettoso e costruttivo. Questo progetto e' aperto a tutti, indipendentemente dal livello di esperienza.
