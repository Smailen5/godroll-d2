# godroll-d2

[![GitHub Release](https://img.shields.io/github/v/release/Smailen5/godroll-d2?style=flat-square&logo=github)](https://github.com/Smailen5/godroll-d2/releases)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/Smailen5/godroll-d2?style=flat-square&logo=github)](https://github.com/Smailen5/godroll-d2/commits/main)

Repository personale per salvare i god roll di Destiny 2 da utilizzare con DIM (Destiny Item Manager).

## Scopo

Questa repo contiene una lista di wishlist in formato DIM con i migliori roll per ogni arma, raccolti da:

- **light.gg** - database community con statistiche e roll consigliati
- **Consigli del clan** - roll suggeriti dai membri del clan

Ogni entry include note in italiano che spiegano l'utilizzo del roll.

## Formato del file

Il file `godroll-list-dim.txt` usa la sintassi DIM wishlist:

```
// Nome Arma
dimwishlist:item=<ID>&perks=<perk1>,<perk2>,...#notes:<descrizione>
```

Esempio:
```
// Fame Ruggente
dimwishlist:item=214545213&perks=3661387068,106909392,776531651,2048641572,859855990#notes:Roll consigliati da Ascanio
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

## Come contribuire

Se vuoi aggiungere un nuovo roll, modificare uno esistente o segnalare un errore, consulta la [guida alla contribuzione](CONTRIBUTING.md).

Tutti i contributi sono benvenuti, sia da membri del clan che da sviluppatori.

## Licenza

Distribuito con licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.
