# Guida Giocatore — Come scrivere e suggerire roll

Questa guida e per chi vuole contribuire alla wishlist di Destiny 2 ma non ha
confidenza con Git, GitHub o la programmazione. Tutto quello che devi sapere e
come scrivere un file di testo e aprire una richiesta.

## Cos e una wishlist

Una wishlist e un file che dice a DIM quali perk tenere d occhio sulle armi.
Quando apri DIM e guardi il tuo inventario, le armi che hanno i perk giusti
vengono evidenziate con un bordo arancione e l icona del pollice in su.

In pratica: qualcuno del clan prepara una lista di "questi perk sono buoni su
quest arma", e DIM la usa per segnalartele automaticamente.

## Come funziona il sistema a due file

Il progetto usa due file per ogni utente:

- **File sorgente (`.md`)** — e il file che contiene i roll scritti con i nomi
  dei perk in italiano. Esempio: `godroll/smailen/godroll.md`.
- **File DIM (`.txt`)** — e il file generato automaticamente dal file sorgente,
  pronto per essere importato in DIM. Esempio: `godroll/smailen/godroll.txt`.

**Non devi mai modificare il file `.txt` a mano.** Lo script lo genera da solo
quando il file `.md` e pronto.

## Il file sorgente spiegato semplice

Il file `.md` e un semplice file di testo. Puoi aprirlo con Blocco Note, Visual
Studio Code, o qualsiasi editor di testo.

### Struttura di base

```markdown
# title: Godroll — Lista Desideri D2          <-- titolo della wishlist
## description: Wishlist personale e del clan  <-- descrizione

### Nome Arma                                    <-- nome dell arma
- fonte: Smailen                                 <-- chi ha consigliato
- attivita: PVE                                  <-- PVP / PVE / Gambit / Misto
- notes: Roll consigliato per GM                 <-- descrizione

#### Roll                                       <-- sezione roll (opzionale)

- perk1, perk2, perk3, perk4, perk5. #notes:Nota veloce
#notes:Nota che vale per tutti i roll seguenti
- qualsiasi, qualsiasi, perk3, perk4.
```

Vediamo ogni elemento nel dettaglio.

### Titolo e descrizione

Le prime due righe del file dicono a DIM come chiamare la wishlist:

```markdown
# title: Godroll — Lista Desideri D2
## description: Wishlist personale e del clan
```

- `# title:` — il titolo che vedrai in DIM
- `## description:` — una breve descrizione

**Devono essere le prime due righe del file**, nell ordine. Non cambiarle a
meno che tu non voglia rinominare la wishlist.

### Un arma

Ogni arma inizia con `###` seguito dal nome esatto dell arma come appare in
DIM:

```markdown
### Igneous Hammer
```

Poi vengono tre righe di informazioni, sempre nell ordine:

- `- fonte:` — chi ha consigliato il roll (es. `Smailen`, `Consigliato da Alfa`)
- `- attivita:` — per cosa si usa (valori: `PVP`, `PVE`, `Gambit`, `Incursioni`,
  `Boss`, `Misto`)
- `- notes:` — una descrizione del roll (es. `Ottimo per Trials`, `Roll
  economico per GM`)

Esempio completo:

```markdown
### Igneous Hammer
- fonte: Smailen
- attivita: PVP
- notes: Roll competitivo per Trials e Crucible
```

#### Se vuoi usare la wildcard DIM per un arma

Alcune armi hanno piu varianti nello stesso slot (es. `Rose` con diversi
masterwork). Per DIM, puoi usare `(-69420)` dopo il nome per fare match su
tutti i perk:

```markdown
### Rose (-69420)
```

Il numero `-69420` e un codice speciale che DIM riconosce per ignorare
completamente quella colonna. Si chiama "wildcard DIM".

### I perk

I perk si scrivono su righe che iniziano con `-` (trattino + spazio). Ogni
riga e un roll diverso. I perk vanno separati da virgole:

```markdown
- perk1, perk2, perk3, perk4, perk5.
```

**Regole importanti:**

1. **Massimo 5 perk per roll.** Le armi di Destiny 2 hanno al massimo 5 slot
   di perk (colonne 1-3 nella prima colonna, colonna 4 perk di classe, colonna
   5 masterwork / origin trait).
2. **Il nome del perk deve essere quello giusto.** Scrivi il nome esatto del
   perk come appare in DIM in italiano. Esempi:
   - `Fame Ruggente` (non `Rampage`)
   - `Controllo del colpo` (non `Zen Moment`)
   - `Caricatore perpetuo` (non `Auto-Loading Holster`)
3. **Se un colonna non conta, scrivi `qualsiasi` o `-`.** Cosi DIM sa che
   quella colonna va ignorata.
4. **Il punto finale `.` dopo l ultimo perk e opzionale** ma aiuta la
   leggibilita.
5. **Non ci devono essere spazi prima della virgola** dopo l ultimo perk
   (es. `perk1, perk2.` corretto, `perk1, perk2, .` sbagliato).

Esempi:

```markdown
- Fame Ruggente, Controllo del colpo, Caricatore perpetuo, qualsiasi,
  qualsiasi.
- qualsiasi, qualsiasi, Artigli del lupo, - .
```

Prima dei perk puoi mettere `#### Roll` come separatore visivo, ma non e
obbligatorio. Lo script lo ignora.

### Le note

Puoi aggiungere note ai roll in due modi.

#### Note inline (per un singolo roll)

Aggiungi `#notes:testo` alla fine della riga del roll:

```markdown
- perk1, perk2, perk3, perk4, perk5. #notes:Roll per GM settimanali
```

La nota appare solo per quel roll specifico.

#### Block note (per tutti i roll seguenti)

Metti `#notes:testo` su una riga da sola (senza `-` davanti):

```markdown
#notes:Questi roll sono per il PVE endgame
```

Tutti i roll che vengono dopo questa riga avranno quella nota finche non
cambi block note con un altra riga `#notes:`.

Esempio pratico:

```markdown
### Igneous Hammer
- fonte: Smailen
- attivita: PVP
- notes: Roll per competitivo

#notes:Roll PVP
- Celta di precisione, Controllo del colpo, Caricatore perpetuo,
  Carica alla massima potenza, qualsiasi.
- Celta di precisione, Controllo del colpo, Caricatore perpetuo,
  Aprire il fuoco, qualsiasi.

#notes:Roll PVE
- Raddrizzatutti, Faro, Caricatore perpetuo, Eruzione solare,
  qualsiasi.
```

Qui il primo `#notes:Roll PVP` vale per i due roll PVP, poi `#notes:Roll PVE`
cambia la nota per il roll PVE successivo.

## Esempi completi

### Esempio 1: Arma PVE

```markdown
### Fornace Esplosiva
- fonte: Smailen
- attivita: PVE
- notes: Roll economico per GM

#notes:Sparsa e ricarica rapida
- Raddrizzatutti, Faro, Caricatore perpetuo, Eruzione solare,
  qualsiasi.
- Raddrizzatutti, Faro, Caricatore perpetuo, Colpo di grazia,
  qualsiasi.
```

### Esempio 2: Arma PVP

```markdown
### La Cuspide Logora
- fonte: Smailen
- attivita: PVP
- notes: Roll competitivo per Trials

#notes:Stabilita e precisione
- Controllo del colpo, Celta di precisione, Caricatore perpetuo,
  Carica alla massima potenza, qualsiasi.
- Controllo del colpo, Celta di precisione, Caricatore perpetuo,
  Aprire il fuoco, qualsiasi.
```

### Esempio 3: Arma con wildcard

```markdown
### Rose (-69420)
- fonte: Smailen
- attivita: Misto
- notes: Roll versatili

#notes:PVP
- Celta di precisione, Controllo del colpo, qualsiasi, Carica
  alla massima potenza, qualsiasi.
```

## Errori comuni

### Nome arma sbagliato

Il nome dell arma deve essere identico a come appare in DIM. Se non sei sicuro
del nome, cerca l arma su DIM prima di scriverla.

### Nome perk sbagliato

Stessa cosa per i perk. Un errore di una lettera e lo script non trova il perk.
Usa DIM per controllare il nome esatto.

### Piu di 5 perk in una riga

Le armi hanno massimo 5 slot. Se ne metti 6, lo脚本 segnala un errore.

### Virgola finale dopo l ultimo perk

Non mettere una virgola prima del punto. `perk1, perk2.` corretto,
`perk1, perk2, .` sbagliato.

### Roll duplicato

Due righe con gli stessi identici perk per la stessa arma vengono segnalate
come duplicato. Controlla di non aver copiato due volte lo stesso roll.

## Come inviare i tuoi roll

Non devi modificare i file direttamente. Puoi aprire una richiesta (issue) su
GitHub e qualcuno dello sviluppo provvedera ad aggiungerli.

### 1. Apri una issue

Vai su https://github.com/Smailen5/godroll-d2/issues e clicca "New issue".

Scegli il template giusto:

- **Add Roll** — per aggiungere un nuovo roll
- **Edit Roll** — per modificare un roll esistente
- **Remove Roll** — per rimuovere un roll

### 2. Compila i campi

Il template ti guidera. Dovrai specificare:

- **Arma** — il nome dell arma
- **Perk** — l elenco dei perk per ogni roll (uno per riga)
- **Attivita** — PVP / PVE / Gambit / Incursioni / Boss / Misto
- **Note** — una descrizione del roll
- **Fonte** — il tuo nome o da dove hai preso il roll

### 3. Invia e attendi

Un maintainer verifichera la richiesta e aggiungera il roll alla wishlist.
Riceverai una notifica quando sara fatto.

## Come usare la wishlist in DIM

1.  Apri [DIM](https://app.destinyitemmanager.com/)
2.  Vai su **Impostazioni** > **Wish List**
3.  Clicca **Aggiungi wishlist**
4.  Incolla questo URL:
    ```
    https://raw.githubusercontent.com/Smailen5/godroll-d2/main/godroll/smailen/godroll.txt
    ```
5.  Salva e ricarica DIM

I roll salvati appariranno con l icona del pollice in sugli oggetti
corrispondenti nel tuo inventario.

## Riepilogo veloce

```
# title: Godroll — Lista Desideri D2
## description: Wishlist personale e del clan

### Nome Arma Esatta
- fonte: TuoNome
- attivita: PVE
- notes: Una descrizione

#notes:Block note per tutti i roll sotto
- perk1, perk2, perk3, perk4, perk5. #notes:Nota solo per questo
- qualsiasi, -, perk3, perk4, perk5.
#notes:Cambio block note
- perk1, perk2, perk3, perk4, qualsiasi.
```
