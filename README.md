# godroll-d2

![Release](https://img.shields.io/github/v/release/Smailen5/godroll-d2)
![Last Commit](https://img.shields.io/github/last-commit/Smailen5/godroll-d2)

Wishlist personale e del clan per Destiny 2, integrata con DIM (Destiny Item
Manager).

## Quick Start

**Per usare la wishlist in DIM:**

1. Apri [DIM](https://app.destinyitemmanager.com/)
2. Vai su **Impostazioni** > **Wish List**
3. Clicca **Aggiungi wishlist**
4. Incolla questo URL:
   ```
   https://raw.githubusercontent.com/Smailen5/godroll-d2/main/godroll/smailen/godroll.txt
   ```
5. Salva e ricarica DIM

I roll salvati appariranno con il pollice in sugli oggetti corrispondenti.

**Per contribuire un roll:** apri una [nuova issue](https://github.com/Smailen5/godroll-d2/issues)
con il template **Add Roll**.

**Per sviluppatori:**

```bash
pnpm install
npm run generate -- godroll/smailen/godroll.md
```

## Riferimento rapido formato

Il sistema usa due file per ogni utente: un file sorgente `.md` (modifica qui)
e un file `.txt` generato (non modificare).

```markdown
# title: Godroll — Lista Desideri D2
## description: Wishlist personale e del clan

### Nome Arma
- fonte: Smailen
- attivita: PVE
- notes: Roll consigliati

- perk1, perk2, perk3, perk4, perk5. #notes:Nota inline
#notes:Block note
- qualsiasi, -, perk3, perk4.
```

## Guide

- [Guida Giocatore](docs/guida-giocatore.md) — come scrivere e suggerire roll
  (nessuna competenza tecnica richiesta)
- [Guida Sviluppatore](docs/guida-sviluppatore.md) — architettura, script,
  pipeline di generazione
- [Come contribuire](CONTRIBUTING.md) — flusso issue e PR
- [Convenzioni](CONVENTION.md) — regole di commit, branch, lingua

## Licenza

MIT. Vedi [LICENSE](LICENSE).
