# Convenzioni di Progetto

## Commit

### Formato

Usiamo i [Conventional Commits](https://www.conventionalcommits.org/).
Il messaggio deve seguire questa struttura:

```
<tipo>: <soggetto>

<corpo (opzionale)>
```

### Tipi ammessi

| Tipo | Quando usarlo |
|------|---------------|
| `feat` | Nuova funzionalita |
| `fix` | Correzione bug |
| `docs` | Modifiche alla documentazione |
| `chore` | Manutenzione, configurazione, dipendenze |
| `refactor` | Modifiche al codice che non aggiungono funzionalita ne correggono bug |
| `test` | Aggiunta o modifica di test |
| `perf` | Miglioramenti performance |
| `style` | Formattazione, spazi, punti e virgola |
| `build` | Sistema di build o dipendenze esterne |
| `ci` | CI/CD |
| `revert` | Rollback di un commit precedente |

Per breaking changes, aggiungi `!` dopo il tipo: `feat!:`.

### Lingua

Il messaggio di commit va in **italiano**. Il verbo deve essere al **presente
indicativo, 3a persona singolare**.

Regola di Linus Torvalds: "If applied, this commit will \<soggetto\>". Se la
frase non ha senso, il soggetto e sbagliato.

| Corretto | Sbagliato |
|----------|-----------|
| `feat: aggiunge roll Igneous Hammer` | `feat: aggiunto roll Igneous Hammer` |
| `fix: corregge perk ID per Fame Ruggente` | `fix: correggere perk ID per Fame Ruggente` |
| `docs: aggiorna README con badge` | `docs: aggiornato README con badge` |

### Regole per il soggetto

1. Massimo **50 caratteri** (72 e il limite assoluto)
2. Prima lettera **maiuscola**
3. **Niente punto finale**
4. Spiega **cosa fa** il commit, non cosa e stato fatto

### Corpo del commit

- Separato dal soggetto da una riga vuota
- Mandatorio a capo a 72 caratteri
- Spiega il **cosa** e il **perche**, non il **come**
- Usalo per riferimenti a issue: `Closes #123`, `See also: #456`

## Branch

### Nomenclatura

```
<tipo>/<nome-descrittivo>
```

Tipi ammessi: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

Esempi:

- `feat/aggiunge-roll-igneous-hammer`
- `fix/corregge-id-perk`
- `docs/aggiorna-readme`

### Regole

- Creare sempre da `main`
- Mai lavorare direttamente su `main`
- Nome descrittivo in italiano, con parole separate da trattino

## Lingua

| Contesto | Lingua |
|----------|--------|
| Documentazione (README, guide, CONVENTION) | Italiano |
| Commit | Italiano |
| PR | Italiano |
| Issue | Italiano |
| Codice (variabili, funzioni, classi) | Inglese |
| Messaggi di log interni | Inglese |
| Nomi dei roll, perk, armi | Italiano (come in DIM) |

## PR (Pull Request)

### Titolo

In italiano con prefisso conventional commit:

```
feat: aggiunge roll Igneous Hammer
fix: corregge perk ID per Fame Ruggente
docs: aggiorna README con badge
```

### Descrizione

Struttura obbligatoria (usa il template in `.github/pull_request_template.md`):

1. **Descrizione** — contesto e problema risolto
2. **Riferimenti Issue** — issue collegata con `Closes #numero`
3. **Modifiche Effettuate** — elenco puntato dei file toccati
4. **Checklist** — spunta le voci verificate

### Regole

- Una PR risolve **una sola issue**. Non estendere lo scopo.
- Se noti lavoro extra non richiesto, segnalalo ma non applicarlo.
- Assegna un reviewer se possibile.

## Issue

### Template obbligatori

Le issue vuote sono disabilitate. Usa sempre il template corretto:

| Template | Tipo issue |
|----------|------------|
| `add-roll.yaml` | Aggiunta di un nuovo roll |
| `edit-roll.yaml` | Modifica di un roll esistente |
| `remove-roll.yaml` | Rimozione di un roll |
| `ci.yaml` | Modifiche a CI/CD |
| `docs.yaml` | Modifiche alla documentazione |

### Regole

- Non cancellare issue sbagliate: usa `gh issue edit` per modificarle.
- Se il corpo e lungo, scrivilo in un file temporaneo e usa `--body-file`.

## Release

- Automatica via **release-please** su push a `main`
- Non toccare il branch `release-please--branches--main--*`
- Non modificare le PR aperte da release-please
- La versione e in `.release-please-manifest.json`
- Configurazione in `release-please-config.json`

## Formattazione documentazione

- Codice inline sempre con **backtick**: `` `comando` ``
- Blocchi di codice con ``` ```linguaggio ```
- Niente backslash come escape in markdown
- Su Windows, usa `bash -c '...'` per comandi complessi (evita problemi di
  escaping PowerShell)
- Per apici in testi PowerShell, usa apici singoli `'...'` o here-string `@'...'@`
