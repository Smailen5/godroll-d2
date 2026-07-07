# Changelog

## [1.0.0](https://github.com/Smailen5/godroll-d2/compare/v0.5.0...v1.0.0) (2026-07-07)


### ⚠ BREAKING CHANGES

* genera file DIM da sorgente Markdown ([#54](https://github.com/Smailen5/godroll-d2/issues/54))

### Nuove funzionalità

* aggiunge roll per La Cuspide Logora e relativi perk IDs ([#52](https://github.com/Smailen5/godroll-d2/issues/52)) ([0fd2dd0](https://github.com/Smailen5/godroll-d2/commit/0fd2dd0f4dd31d815c5bbc30e3dea2ec79f8d023))
* genera file DIM da sorgente Markdown ([#54](https://github.com/Smailen5/godroll-d2/issues/54)) ([35d4dd9](https://github.com/Smailen5/godroll-d2/commit/35d4dd98ce47d09dc877cb3c27fea8a4f5ee9f5e))


### Correzione bug

* disabilita bump-minor-pre-major per permettere breaking change a 1.0.0 ([#55](https://github.com/Smailen5/godroll-d2/issues/55)) ([0ebd7ef](https://github.com/Smailen5/godroll-d2/commit/0ebd7efc5b78e2d943aa5bbf91343f82c2999d22))
* impedisce a getNextNonCommentIndex di oltrepassare il boundary dell'arma ([#50](https://github.com/Smailen5/godroll-d2/issues/50)) ([d59152c](https://github.com/Smailen5/godroll-d2/commit/d59152c1c89151bb09e18f904bbe5c66e84c9d7f))

## [0.5.0](https://github.com/Smailen5/godroll-d2/compare/v0.4.0...v0.5.0) (2026-07-07)


### Nuove funzionalità

* supporta wildcard '-' per colonne non rilevanti ([#49](https://github.com/Smailen5/godroll-d2/issues/49)) ([bc63bd1](https://github.com/Smailen5/godroll-d2/commit/bc63bd14ebf0dcf90721e1e4b8eec6019476971f))


### Documentazione

* aggiorna README e CONTRIBUTING con script e formato //* e //? Roll: ([#45](https://github.com/Smailen5/godroll-d2/issues/45)) ([05d3a71](https://github.com/Smailen5/godroll-d2/commit/05d3a71a664e00c56720dcb2c8119c7be9dc80f6))


### Refactoring

* converte commenti //? Roll: in minuscolo ([#47](https://github.com/Smailen5/godroll-d2/issues/47)) ([7f0804a](https://github.com/Smailen5/godroll-d2/commit/7f0804aee4e83c676f042b9cdeac366c57cfd0e3))

## [0.4.0](https://github.com/Smailen5/godroll-d2/compare/v0.3.0...v0.4.0) (2026-07-06)


### Nuove funzionalità

* aggiunge script per generare commenti //? Roll: automaticamente ([#40](https://github.com/Smailen5/godroll-d2/issues/40)) ([5f3e215](https://github.com/Smailen5/godroll-d2/commit/5f3e215f89e8389937f6bd8de9c0078c2ae8dc96))
* aggiunge weapons-reference, fetch-weapons e generazione roll da //? Roll: ([#42](https://github.com/Smailen5/godroll-d2/issues/42)) ([fffc6b1](https://github.com/Smailen5/godroll-d2/commit/fffc6b15c0e197dccb9535a14a56866dc0ab0592))
* estende validate.js con controllo coerenza commenti //? Roll: ([#39](https://github.com/Smailen5/godroll-d2/issues/39)) ([7abc77b](https://github.com/Smailen5/godroll-d2/commit/7abc77bc39062222ee2a9c9c589dce5888272dc8))
* estende validate.js con controllo perk sconosciuti ([#37](https://github.com/Smailen5/godroll-d2/issues/37)) ([ac10753](https://github.com/Smailen5/godroll-d2/commit/ac10753541af5b471a00beb6ce4ca31f371b49cf))


### Correzione bug

* cerca armi e perk sconosciuti nel manifest in add-roll-from-comments ([#43](https://github.com/Smailen5/godroll-d2/issues/43)) ([0b6a8fe](https://github.com/Smailen5/godroll-d2/commit/0b6a8fe7d0eb22eec8c3b9195cf5ccfddc7cd9a6))


### Documentazione

* aggiunge AGENTS.md con convenzioni e formato wishlist ([#26](https://github.com/Smailen5/godroll-d2/issues/26)) ([4a7ac9e](https://github.com/Smailen5/godroll-d2/commit/4a7ac9ebbe7b744d823211072ed8dfec7d534659))


### Manutenzione

* crea perks-reference.json e script fetch-perks ([#36](https://github.com/Smailen5/godroll-d2/issues/36)) ([3e99088](https://github.com/Smailen5/godroll-d2/commit/3e99088016dcf8806ca108b65696d1481f664c8c))


### CI/CD

* aggiunge validazione formato wishlist e script di controllo locale ([#29](https://github.com/Smailen5/godroll-d2/issues/29)) ([595a7dc](https://github.com/Smailen5/godroll-d2/commit/595a7dc97c92c87b7944ad4ad05cebf7193d3dbc))

## [0.3.0](https://github.com/Smailen5/godroll-d2/compare/v0.2.0...v0.3.0) (2026-07-03)


### Nuove funzionalità

* aggiorna template add-roll per supportare roll multipli ([#22](https://github.com/Smailen5/godroll-d2/issues/22)) ([c4d79a8](https://github.com/Smailen5/godroll-d2/commit/c4d79a82fd21ea420088a47878c81147e13c7fa1))
* aggiunge roll La Cuspide Logora ([#23](https://github.com/Smailen5/godroll-d2/issues/23)) ([67af05e](https://github.com/Smailen5/godroll-d2/commit/67af05ec84ba00bb216d03ee7169321fe83ec256))
* aggiunge roll Vento Autunnale con due varianti PVP ([#25](https://github.com/Smailen5/godroll-d2/issues/25)) ([a4a6544](https://github.com/Smailen5/godroll-d2/commit/a4a65445d563b24fd77b3abbc87171daf4bdc158))


### Documentazione

* aggiorna documentazione per nuove convenzioni template ([#24](https://github.com/Smailen5/godroll-d2/issues/24)) ([57ba34c](https://github.com/Smailen5/godroll-d2/commit/57ba34c9ab55daba12fc7651a164d1fe7e7a7dd9))
* corregge visualizzazione del badge ([#14](https://github.com/Smailen5/godroll-d2/issues/14)) ([15f26d7](https://github.com/Smailen5/godroll-d2/commit/15f26d7d1e37b1c42e7793d45a7ce9b0f488dcee))

## [0.2.0](https://github.com/Smailen5/godroll-d2/compare/v0.1.0...v0.2.0) (2026-07-01)


### Nuove funzionalità

* aggiunge package.json e allinea configurazione release-please ([#8](https://github.com/Smailen5/godroll-d2/issues/8)) ([5c5c069](https://github.com/Smailen5/godroll-d2/commit/5c5c0694f01f2a3a6cb36295899488e1b86a5ee6))
* aggiunge PR template e disabilita issue vuote ([#12](https://github.com/Smailen5/godroll-d2/issues/12)) ([2f8e238](https://github.com/Smailen5/godroll-d2/commit/2f8e2381b570c2b1865b1bbd5fd159cbf63900a9))
* aggiunge roll Fornace Esplosiva ([18cc59d](https://github.com/Smailen5/godroll-d2/commit/18cc59dfb6703ffd00af2723942431227c48c140))
* aggiunge template issue per documentazione e CI ([#11](https://github.com/Smailen5/godroll-d2/issues/11)) ([c5bda2e](https://github.com/Smailen5/godroll-d2/commit/c5bda2e525370249569c8aa796cc728f6ec877b3))
* aggiunge template issue per gestione wishlist ([#13](https://github.com/Smailen5/godroll-d2/issues/13)) ([7bbefc1](https://github.com/Smailen5/godroll-d2/commit/7bbefc1aec97d2a2b38aebe574d53377407e38ba))


### Documentazione

* aggiunge guida contribuzione, licenza MIT e badge nel README ([#10](https://github.com/Smailen5/godroll-d2/issues/10)) ([8aabcb8](https://github.com/Smailen5/godroll-d2/commit/8aabcb8a38632c9ca783a53156ace7b6146cc372))
* aggiunge README con istruzioni per uso wishlist DIM ([#1](https://github.com/Smailen5/godroll-d2/issues/1)) ([1230d7c](https://github.com/Smailen5/godroll-d2/commit/1230d7c7e586b5f1926efda7de374c5137c256dd))


### Manutenzione

* configura release-please per versionamento automatico ([#2](https://github.com/Smailen5/godroll-d2/issues/2)) ([696a6ed](https://github.com/Smailen5/godroll-d2/commit/696a6edcb93eac7200660f4f5f741644f803a534))


### Refactoring

* modifica commenti ([9173185](https://github.com/Smailen5/godroll-d2/commit/9173185ec0ea0fb6238e9f84e1ca10ffa1627eec))


### Test

* aggiunge primo godroll ([18d18b0](https://github.com/Smailen5/godroll-d2/commit/18d18b03431d8e74c8dd244f37d70f24f828b07f))
