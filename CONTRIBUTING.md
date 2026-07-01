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

### 2. Compila i campi richiesti

Ogni template ti guidera' con campi specifici. Le informazioni principali che ti serviranno:

- **Nome dell'arma** — il nome esatto come appare in Destiny 2
- **ID item** — lo trovi su [light.gg](https://www.light.gg) cercando l'arma e prendendo il numero dall'URL
- **Perk IDs** — i codici numerici dei perk consigliati
- **Note** — una breve descrizione dell'utilizzo del roll (es. "Ottimo per PvE, sinergia con xxx")

### 3. Aspetta la revisione

Un maintainer verifichera' la richiesta e provvedera' ad aggiungere il roll alla wishlist.

---

## Per sviluppatori

Se hai familiarita' con Git e vuoi contribuire direttamente con codice o modifiche al repo:

### Setup

```bash
git clone https://github.com/Smailen5/godroll-d2.git
cd godroll-d2
```

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
2. Apri una PR su GitHub
3. Il titolo deve seguire i Conventional Commits
4. Nella descrizione, collega la issue risolta con `Closes #numero`

### Cosa puoi modificare

- `godroll-list-dim.txt` — aggiungere, modificare o rimuovere roll
- `.github/` — template issue, workflow, configurazioni
- `README.md`, `CONTRIBUTING.md` — documentazione

## Codice di condotta

Sii rispettoso e costruttivo. Questo progetto e' aperto a tutti, indipendentemente dal livello di esperienza.
