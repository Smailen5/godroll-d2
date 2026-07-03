# AGENTS.md

## Repository Overview

Static wishlist repository for Destiny 2 DIM (Destiny Item Manager) integration. No build, test, or lint commands.

## Key Files

- `godroll-list-dim.txt` — main wishlist file (DIM format)
- `.github/ISSUE_TEMPLATE/` — templates for roll management (add/edit/remove) and maintenance (ci/docs)
- `release-please-config.json` — automated release configuration

## Wishlist Format

```
// Nome Arma
//notes:<fonte> (<attivita>): <descrizione>
dimwishlist:item=<ID>&perks=<perk1>,<perk2>,...
dimwishlist:item=<ID>&perks=<perk1>,<perk2>,... (varianti)
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
