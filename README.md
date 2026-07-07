# godroll-d2

![Release](https://img.shields.io/github/v/release/Smailen5/godroll-d2)
![Last Commit](https://img.shields.io/github/last-commit/Smailen5/godroll-d2)

Repository personale per salvare i god roll di Destiny 2 da utilizzare con DIM (Destiny Item Manager).

## Scopo

Questa repo contiene una lista di wishlist in formato DIM con i migliori roll per ogni arma, raccolti da:

- **light.gg** - database community con statistiche e roll consigliati
- **Consigli del clan** - roll suggeriti dai membri del clan

Ogni entry include note in italiano che spiegano l'utilizzo del roll.

## Formato del file

Il repository usa un sistema a due file:

1. **File sorgente Markdown** (`godroll/<user>/<file>.md`) — dove scrivi i roll con nomi perk leggibili
2. **File DIM generato** (`godroll/<user>/<file>.txt`) — output pulito pronto per DIM

### Formato sorgente Markdown

```markdown
# title: Godroll — Lista Desideri D2
## description: Wishlist personale e del clan

### Nome Arma
- fonte: Smailen
- attivita: Misto
- notes: Roll consigliati per il PVE

#### Roll
- perk1, perk2, perk3, perk4, perk5. #notes:Nota inline
#notes:Block note personalizzato
- qualsiasi, qualsiasi, perk3, perk4.
```

**Elementi:**
- `# title:` / `## description:` — metadati DIM (prime righe output)
- `### Nome Arma` — separatore arma (usa `(-69420)` per wildcard DIM)
- `- fonte:` / `- attivita:` / `- notes:` — metadati arma → `//notes:fonte (attivita): notes`
- `#### Roll` — sezione roll (ignorato nell'output)
- `- perk1, perk2, ...` — roll con nomi perk (max 5 colonne, `qualsiasi` o `-` → slot ignorato)
- `#notes:testo` inline — nota solo per quel roll
- `#notes:testo` standalone — cambia block note corrente

### Formato output DIM

Il file `.txt` generato contiene solo:
- `title:` / `description:` — metadati DIM
- `//notes:` — block note
- `dimwishlist:item=X&perks=ID1,ID2,...` — roll
- `#notes:...` — nota inline (opzionale)

Niente commenti `//? Roll:` che rompono i block notes in DIM.

## Come usare la lista su DIM

1. Apri [DIM](https://app.destinyitemmanager.com/)
2. Vai su **Impostazioni** > **Wishlist**
3. Clicca su **Aggiungi wishlist**
4. Incolla l'URL raw del file generato da GitHub:
   ```
   https://raw.githubusercontent.com/Smailen5/godroll-d2/main/godroll/smailen/godroll.txt
   ```
5. Salva e ricarica DIM

I roll salvati appariranno con un'icona a forma di pollice in su sugli oggetti corrispondenti nel tuo inventario.

## Script

Il repository include alcuni script per gestire i roll:

### `npm run generate`

Genera il file DIM `.txt` dal file sorgente Markdown `.md`:

```bash
npm run generate -- godroll/smailen/godroll.md        # genera godroll.txt
npm run generate -- --check godroll/smailen/godroll.md # solo validazione
```

Lo script:
- Parsifica il file Markdown
- Risolve nomi arma/perk in ID usando `weapons-reference.json` e `perks-reference.json`
- Genera output DIM pulito (senza `//? Roll:` che rompono i block notes)
- Valida sintassi, duplicati e coerenza ID

### `npm run validate`

Valida la sintassi e la coerenza del file wishlist legacy (`godroll-list-dim.txt`):
- Controlla il formato delle righe `dimwishlist:`
- Verifica che ogni ID perk sia presente in `perks-reference.json`
- Verifica che i nomi nei commenti `//? Roll:` corrispondano agli ID nei roll
- Segnala roll duplicati

```bash
npm run validate          # warning non bloccanti
npm run validate --strict # warning → error
```

### `npm run add-roll-comments`

Aggiunge i commenti `//? Roll:` sopra ogni riga `dimwishlist:` che ne è priva, traducendo gli ID numerici in nomi leggibili:

```bash
npm run add-roll-comments
```

Idempotente: esecuzioni multiple non creano duplicati.

### `npm run add-roll-from-comments`

Direzione inversa: dato un commento `//? Roll:` senza `dimwishlist:` sottostante, genera la riga con gli ID corretti. Per armi e perk non ancora nella reference, cerca automaticamente nel manifest di Bungie.

```bash
npm run add-roll-from-comments
```

Idempotente.

### `npm run fetch-perks` / `npm run fetch-weapons`

Scarica il manifest di Destiny 2 (italiano) e verifica che i perk e le armi nei file di reference corrispondano ai nomi ufficiali. La cache dura 24 ore.

```bash
npm run fetch-perks
npm run fetch-weapons
```

## Come contribuire

Consulta la [guida alla contribuzione](CONTRIBUTING.md).

## Licenza

Distribuito con licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.
