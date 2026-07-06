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

Il file `godroll-list-dim.txt` usa la sintassi DIM wishlist estesa con commenti leggibili:

```
//* Nome Arma
//? Roll: Perk1, Perk2, Perk3, Perk4, Perk5
dimwishlist:item=<ID>&perks=<id1>,<id2>,<id3>,<id4>,<id5>#notes:<descrizione>
```

### Elementi DIM standard

- `title:<titolo>` — titolo della wishlist (visibile in DIM)
- `description:<descrizione>` — descrizione della wishlist
- `//notes:<testo>` — block note: si applica a tutti i roll successivi fino al prossimo commento arma
- `#notes:<testo>` — nota inline per il singolo roll
- `//` — commento ignorato da DIM

### Estensioni del progetto

- `//* Nome Arma` — commento separatore tra le armi (l'asterisco lo distingue dai commenti standard)
- `//? Roll: Perk1, ...` — nomi leggibili dei perk nel roll sottostante (generato da `add-roll-comments`)
- **Non mischiare** `//? Roll:` e `dimwishlist:` a mano: lascia che siano gli script a generarli

Esempio:
```
//* Fame Ruggente
//? Roll: Compensatore contenuto, Caricatore tattico, Stretta repulsiva, Proiettili destabilizzanti, Spara e corri
dimwishlist:item=214545213&perks=3661387068,106909392,776531651,2048641572,859855990#notes:Roll consigliati da Smailen
//? Roll: Direzione controllata, Proiettili rifiniti, Stretta repulsiva, Proiettili destabilizzanti, Spara e corri
dimwishlist:item=214545213&perks=839105230,3142289711,776531651,2048641572,859855990#notes:Roll perfetti consigliato da Smailen
```

## Come usare la lista su DIM

1. Apri [DIM](https://app.destinyitemmanager.com/)
2. Vai su **Impostazioni** > **Wishlist**
3. Clicca su **Aggiungi wishlist**
4. Incolla l'URL raw del file `godroll-list-dim.txt` da GitHub:
   ```
   https://raw.githubusercontent.com/Smailen5/godroll-d2/main/godroll-list-dim.txt
   ```
5. Salva e ricarica DIM

I roll salvati appariranno con un'icona a forma di pollice in su sugli oggetti corrispondenti nel tuo inventario.

## Script

Il repository include alcuni script per gestire i roll:

### `npm run validate`

Valida la sintassi e la coerenza del file wishlist:
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
