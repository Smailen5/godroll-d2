# AGENTS.md

## Repository Overview

Static wishlist repository for Destiny 2 DIM (Destiny Item Manager) integration. No build, test, or lint commands.

## Key Files

- `godroll/<user>/<file>.md` — source file (write rolls here with perk names)
- `godroll/<user>/<file>.txt` — generated DIM-ready file (do not edit manually)
- `godroll-list-dim.txt` — legacy wishlist file (deprecated, kept for reference)
- `.github/ISSUE_TEMPLATE/` — templates for roll management (add/edit/remove) and maintenance (ci/docs)
- `release-please-config.json` — automated release configuration

## New Workflow (Markdown → DIM)

Source files live in `godroll/<user>/<file>.md`. The script `scripts/generate-dim-wishlist.js` parses them and generates the corresponding `.txt` file.

### Source Format (godroll.md)

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

### Commands

```bash
npm run generate -- godroll/smailen/godroll.md        # genera godroll.txt
npm run generate -- --check godroll/smailen/godroll.md # solo validazione
```

### Output Format (godroll.txt)

```
title:Godroll — Lista Desideri D2
description:Wishlist personale e del clan

//notes:Smailen (Misto): Roll consigliati per il PVE
dimwishlist:item=<ID>&perks=<ID1>,<ID2>,<ID3>,<ID4>,<ID5>#notes:Nota inline
```

Only `title:`, `description:`, `//notes:`, `dimwishlist:`, and `#notes:` — no `//? Roll:` comments that break block notes in DIM.

## Legacy Wishlist Format (deprecated)

```
// Nome Arma
//notes:<fonte> (<attivita>): <descrizione>
dimwishlist:item=<ID>&perks=<perk1>,<perk2>,...
```

- `// Nome Arma` — separator comment between weapons
- `//notes:...` — block note applies to all following rolls until next comment
- `#notes:...` — inline note for single roll
- Activity types: `PVP`, `PVE`, `Gambit`, `Incursioni`, `Boss`, `Misto`

## Conventions

- **Commit messages**: Italian, conventional commits, present tense (3rd person singular)
  - `feat: aggiunge roll Fornace Esplosiva`
  - `fix: corregge perk ID per Fame Ruggente`
- **PR titles**: Italian with conventional commit prefix
- **Issue templates**: use `add-roll.yaml`, `edit-roll.yaml`, `remove-roll.yaml` for roll operations; `ci.yaml` and `docs.yaml` for maintenance tasks

## Release Process

Automated via release-please on push to `main`. No manual release steps required.
