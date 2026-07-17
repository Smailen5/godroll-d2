#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { loadManifest } = require('./lib/manifest');

const WILDCARD_PERK_ID = '0';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, ...styles) {
  return styles.map(s => colors[s]).join('') + text + colors.reset;
}

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function selectFromList(options, prompt = 'Seleziona') {
  return new Promise((resolve) => {
    let selectedIndex = 0;
    let linesPrinted = 0;
    const stdin = process.stdin;

    if (!stdin.isTTY) {
      console.error('Errore: la CLI richiede un terminale interattivo.');
      process.exit(1);
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const hintLine = `${colorize('↑↓', 'dim')} naviga  ${colorize('↵', 'dim')} conferma  ${colorize('q', 'dim')} annulla`;

    function render() {
      if (linesPrinted > 0) {
        process.stdout.write(`\x1b[${linesPrinted}A\x1b[J`);
      }

      console.log(`${colorize(prompt, 'cyan')}:`);
      options.forEach((opt, i) => {
        const marker = i === selectedIndex ? colorize('▶', 'cyan') : ' ';
        const text = i === selectedIndex ? colorize(opt, 'bold') : opt;
        console.log(`  ${marker} ${text}`);
      });
      console.log(hintLine);

      linesPrinted = options.length + 2;
    }

    render();

    const onData = (key) => {
      if (key === '\u0003' || key === 'q') {
        cleanup();
        resolve(null);
        return;
      }

      if (key === '\r' || key === '\n') {
        cleanup();
        resolve(selectedIndex);
        return;
      }

      if (key === '\x1b[A') {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        render();
      } else if (key === '\x1b[B') {
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
      }
    };

    function cleanup() {
      stdin.setRawMode(false);
      stdin.removeListener('data', onData);
      process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
    }

    stdin.on('data', onData);
  });
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function suggest(name, candidateNames) {
  const lower = name.toLowerCase();
  let bestContained = null;
  let bestContainedScore = Infinity;
  let bestDistant = null;
  let bestDistantScore = Infinity;

  for (const candidate of candidateNames) {
    const candidateLower = candidate.toLowerCase();
    if (candidateLower.includes(lower) || lower.includes(candidateLower)) {
      const score = Math.abs(candidateLower.length - lower.length);
      if (score < bestContainedScore) {
        bestContainedScore = score;
        bestContained = candidate;
      }
      continue;
    }
    const distance = levenshtein(lower, candidateLower);
    if (distance < bestDistantScore) {
      bestDistantScore = distance;
      bestDistant = candidate;
    }
  }

  if (bestContained !== null && bestContainedScore <= 10) {
    return bestContained;
  }
  const threshold = Math.max(2, Math.floor(lower.length / 3));
  return bestDistant !== null && bestDistantScore <= threshold ? bestDistant : null;
}

async function selectUser() {
  const godrollDir = path.join(__dirname, '..', 'godroll');
  const users = fs.readdirSync(godrollDir).filter(f => {
    const fullPath = path.join(godrollDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  if (users.length === 0) {
    console.log(`${colorize('✗', 'red')} Nessuna wishlist trovata in godroll/`);
    process.exit(1);
  }

  const selected = await selectFromList(users, 'Seleziona la tua wishlist');

  if (selected === null) {
    console.log('Selezione annullata.');
    process.exit(0);
  }

  return users[selected];
}

async function selectTxtFile(user) {
  const userDir = path.join(__dirname, '..', 'godroll', user);
  const txtFiles = fs.readdirSync(userDir).filter(f => f.endsWith('.txt'));

  if (txtFiles.length === 0) {
    console.log(`${colorize('✗', 'red')} Nessun file .txt trovato in godroll/${user}/`);
    process.exit(1);
  }

  const selected = await selectFromList(txtFiles, 'Seleziona il file .txt target');

  if (selected === null) {
    console.log('Selezione annullata.');
    process.exit(0);
  }

  return path.join(userDir, txtFiles[selected]);
}

async function createNewWishlist() {
  clearScreen();
  console.log(`${colorize('--- Crea Nuova Wishlist ---', 'cyan', 'bold')}\n`);

  const godrollDir = path.join(__dirname, '..', 'godroll');

  const userName = await ask(`${colorize('Nome della wishlist', 'cyan')} (es. il tuo nome): `);
  if (!userName.trim()) {
    console.log(`${colorize('✗', 'red')} Nome non valido.`);
    process.exit(1);
  }

  const userDir = path.join(godrollDir, userName.trim());
  if (fs.existsSync(userDir)) {
    clearScreen();
    console.log(`${colorize('--- Crea Nuova Wishlist ---', 'cyan', 'bold')}\n`);
    console.log(`${colorize('⚠', 'yellow')} La wishlist "${userName}" esiste già.`);
    const confirm = await ask('Vuoi comunque continuare? (s/n): ');
    if (confirm.toLowerCase() !== 's') {
      process.exit(0);
    }
  } else {
    fs.mkdirSync(userDir, { recursive: true });
  }

  clearScreen();
  console.log(`${colorize('--- Crea Nuova Wishlist ---', 'cyan', 'bold')}\n`);
  console.log(`${colorize('✓', 'green')} Cartella creata: godroll/${userName.trim()}\n`);

  const fileName = await ask(`${colorize('Nome del file', 'cyan')} (senza estensione .txt): `);
  if (!fileName.trim()) {
    console.log(`${colorize('✗', 'red')} Nome non valido.`);
    process.exit(1);
  }

  const filePath = path.join(userDir, `${fileName.trim()}.txt`);

  clearScreen();
  console.log(`${colorize('--- Crea Nuova Wishlist ---', 'cyan', 'bold')}\n`);
  console.log(`${colorize('✓', 'green')} Cartella creata: godroll/${userName.trim()}\n`);

  const title = await ask(`${colorize('Titolo della lista', 'cyan')} (es. "Godroll — Lista Desideri D2"): `);
  
  clearScreen();
  console.log(`${colorize('--- Crea Nuova Wishlist ---', 'cyan', 'bold')}\n`);
  console.log(`${colorize('✓', 'green')} Cartella creata: godroll/${userName.trim()}\n`);
  console.log(`${colorize('✓', 'green')} File creato: godroll/${userName.trim()}/${fileName.trim()}.txt\n`);

  const description = await ask(`${colorize('Descrizione', 'cyan')} (es. "Wishlist personale e del clan"): `);

  let content = '';
  if (title.trim()) {
    content += `title:${title.trim()}\n`;
  }
  if (description.trim()) {
    content += `description:${description.trim()}\n`;
  }

  fs.writeFileSync(filePath, content);
  
  clearScreen();
  console.log(`${colorize('--- Crea Nuova Wishlist ---', 'cyan', 'bold')}\n`);
  console.log(`${colorize('✓', 'green')} Cartella creata: godroll/${userName.trim()}`);
  console.log(`${colorize('✓', 'green')} File creato: godroll/${userName.trim()}/${fileName.trim()}.txt`);
  if (title.trim()) {
    console.log(`${colorize('✓', 'green')} Titolo: ${title.trim()}`);
  }
  if (description.trim()) {
    console.log(`${colorize('✓', 'green')} Descrizione: ${description.trim()}`);
  }

  const addRoll = await ask(`\n${colorize('Vuoi aggiungere il primo roll?', 'cyan')} (s/n): `);
  if (addRoll.toLowerCase() !== 's') {
    console.log(`\n${colorize('✓', 'green')} Wishlist creata con successo!`);
    process.exit(0);
  }

  return filePath;
}

async function searchWeapon(manifest) {
  const weaponNames = Object.values(manifest.weapons).map(w => w.name);

  while (true) {
    const input = await ask(`\n${colorize('Nome dell\'arma', 'cyan')} (o "q" per uscire): `);

    if (input.toLowerCase() === 'q') {
      console.log('Ricerca annullata.');
      process.exit(0);
    }

    const lower = input.toLowerCase();
    const matches = Object.entries(manifest.weapons).filter(([hash, w]) =>
      w.name.toLowerCase() === lower
    );

    if (matches.length > 0) {
      // Se ci sono più versioni, fai scegliere all'utente
      if (matches.length > 1) {
        console.log(`\n${colorize('ℹ', 'cyan')} Trovate ${matches.length} versioni dell'arma:`);
        const versionOptions = matches.map(([hash, weapon]) => {
          const source = weapon.displaySource || 'Versione originale';
          const randomizable = (weapon.columns || []).filter(col => col.length > 1).length;
          return `${source} (${randomizable} colonne)`;
        });
        const selected = await selectFromList(versionOptions, 'Seleziona la versione');
        if (selected === null) {
          console.log('Selezione annullata.');
          process.exit(0);
        }
        const [hash, weapon] = matches[selected];
        console.log(`\n${colorize('✓', 'green')} Arma selezionata: ${colorize(weapon.name, 'bold')} (${weapon.type})`);
        return { hash, weapon };
      } else {
        const [hash, weapon] = matches[0];
        console.log(`\n${colorize('✓', 'green')} Arma trovata: ${colorize(weapon.name, 'bold')} (${weapon.type})`);
        return { hash, weapon };
      }
    }

    const suggestion = suggest(input, weaponNames);
    if (suggestion) {
      const suggestedWeapon = Object.values(manifest.weapons).find(w => w.name === suggestion);
      const typeInfo = suggestedWeapon ? ` (${suggestedWeapon.type})` : '';
      console.log(`\n${colorize('💡', 'yellow')} Forse intendevi ${colorize(suggestion + typeInfo, 'yellow', 'bold')}?`);
      const confirm = await ask(`Confermi? (s/n): `);
      if (confirm.toLowerCase() === 's') {
        const allMatches = Object.entries(manifest.weapons).filter(([h, w]) => w.name === suggestion);
        if (allMatches.length > 1) {
          console.log(`\n${colorize('ℹ', 'cyan')} Trovate ${allMatches.length} versioni dell'arma:`);
          const versionOptions = allMatches.map(([hash, weapon]) => {
            const source = weapon.displaySource || 'Versione originale';
            const randomizable = (weapon.columns || []).filter(col => col.length > 1).length;
            return `${source} (${randomizable} colonne)`;
          });
          const selected = await selectFromList(versionOptions, 'Seleziona la versione');
          if (selected === null) {
            console.log('Selezione annullata.');
            process.exit(0);
          }
          const [hash, weapon] = allMatches[selected];
          console.log(`${colorize('✓', 'green')} Arma selezionata: ${colorize(weapon.name, 'bold')} (${weapon.type})`);
          return { hash, weapon };
        } else {
          const [hash, weapon] = allMatches[0];
          console.log(`${colorize('✓', 'green')} Arma selezionata: ${colorize(weapon.name, 'bold')} (${weapon.type})`);
          return { hash, weapon };
        }
      }
    } else {
      console.log(`\n${colorize('✗', 'red')} Arma "${input}" non trovata.`);
    }
  }
}

async function selectPerks(manifest, weapon) {
  const perks = [];

  const randomizableColumns = (weapon.columns || []).filter(col => col.length > 1);

  if (randomizableColumns.length === 0) {
    console.log(`\n${colorize('⚠', 'yellow')} Nessuna colonna randomizzabile trovata per quest'arma.`);
    console.log('  L\'arma potrebbe avere solo perk fissi (intrinsic/origin trait).');
    const confirm = await ask('  Vuoi comunque procedere con 5 colonne vuote? (s/n): ');
    if (confirm.toLowerCase() !== 's') {
      console.log('Operazione annullata.');
      process.exit(0);
    }
    for (let i = 0; i < 5; i++) perks.push(WILDCARD_PERK_ID);
    return perks;
  }

  for (let col = 0; col < 5; col++) {
    clearScreen();
    console.log(`${colorize(`--- Colonna ${col + 1} di 5 ---`, 'cyan', 'bold')}\n`);

    const columnPerkHashes = randomizableColumns[col] || [];

    if (columnPerkHashes.length === 0) {
      console.log('Nessun perk disponibile per questa colonna.');
      perks.push(WILDCARD_PERK_ID);
      continue;
    }

    // Filtra i perk per escludere shader, ricordi e perk non validi
    const perkMap = new Map();
    for (const hash of columnPerkHashes) {
      const perk = manifest.perks[hash];
      if (!perk) continue;
      
      const name = perk.name;
      
      // Escludi perk non validi
      if (name.startsWith('Ricordo ') || 
          name.startsWith('Shader ') || 
          name.startsWith('Livello ') ||
          name === 'Alloggiamento vuoto' ||
          name === 'Stile di combattimento predefinito' ||
          name.startsWith('Potenziamento grado ') ||
          name.includes('Conteggiouccisioni') ||
          name === 'Decoro originale') {
        continue;
      }
      
      if (!perkMap.has(name)) {
        perkMap.set(name, { hash, tier: perk.tier });
      } else {
        const existing = perkMap.get(name);
        if (perk.tier < existing.tier) {
          perkMap.set(name, { hash, tier: perk.tier });
        }
      }
    }

    const perkOptions = Array.from(perkMap.entries()).map(([name, data]) => ({
      hash: data.hash,
      name,
    }));

    perkOptions.sort((a, b) => a.name.localeCompare(b.name));

    const listOptions = perkOptions.map(p => p.name);
    listOptions.push(colorize('Qualsiasi (nessun perk specifico)', 'yellow'));

    const selected = await selectFromList(listOptions, 'Perk disponibili');

    if (selected === null) {
      console.log('Selezione annullata.');
      process.exit(0);
    }

    if (selected === listOptions.length - 1) {
      perks.push(WILDCARD_PERK_ID);
      console.log(`${colorize('✓', 'green')} Selezionato: ${colorize('Qualsiasi', 'yellow', 'bold')}`);
    } else {
      const selPerk = perkOptions[selected];
      perks.push(selPerk.hash);
      console.log(`${colorize('✓', 'green')} Selezionato: ${selPerk.name}`);
    }

    await ask(`${colorize('Premi invio per continuare...', 'dim')}`);
  }

  return perks;
}

async function askNote() {
  while (true) {
    const noteType = await ask(`\n${colorize('Vuoi aggiungere una nota?', 'cyan')} (${colorize('i', 'yellow')}=inline, ${colorize('b', 'yellow')}=block, ${colorize('n', 'yellow')}=nessuna): `);
    const type = noteType.toLowerCase().trim();

    if (type === 'n') {
      return null;
    }

    if (type === 'i' || type === 'b') {
      const noteText = await ask('Testo della nota: ');

      if (!noteText.trim()) {
        return null;
      }

      return {
        type: type === 'i' ? 'inline' : 'block',
        text: noteText.trim(),
      };
    }

    console.log(`${colorize('✗', 'red')} Input non valido. Usa 'i', 'b' o 'n'.`);
  }
}

function checkDuplicates(txtContent, weaponHash, perkIds) {
  const lines = txtContent.split('\n');
  const targetPerkStr = perkIds.join(',');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith(`dimwishlist:item=${weaponHash}&perks=`)) {
      const perkMatch = line.match(/perks=([0-9,]+)/);
      if (perkMatch) {
        const existingPerks = perkMatch[1];
        if (existingPerks === targetPerkStr) {
          return { duplicate: true, line: i + 1 };
        }
      }
    }
  }

  return { duplicate: false };
}

function appendRoll(txtContent, weaponHash, perkIds, note, weaponName, weaponType, allWeaponHashes) {
  const paddedPerkIds = [...perkIds];
  while (paddedPerkIds.length < 5) {
    paddedPerkIds.push(WILDCARD_PERK_ID);
  }

  let dimLine = `dimwishlist:item=${weaponHash}&perks=${paddedPerkIds.join(',')}`;

  if (note && note.type === 'inline') {
    dimLine += `#notes:${note.text}`;
  }

  const lines = txtContent.split('\n');
  const weaponComment = `// ${weaponName} (${weaponType})`;
  
  let insertIndex = -1;
  let sectionEndIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === weaponComment) {
      insertIndex = i;
      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j].trim();
        if (line.startsWith('// ') && !line.startsWith('//notes:')) {
          sectionEndIndex = j;
          break;
        }
      }
      if (sectionEndIndex === -1) {
        sectionEndIndex = lines.length;
      }
      break;
    }
  }

  let newLines;
  if (insertIndex !== -1) {
    newLines = [...lines];
    let insertPos = sectionEndIndex;
    
    for (let j = sectionEndIndex - 1; j > insertIndex; j--) {
      if (lines[j].trim() !== '') {
        insertPos = j + 1;
        break;
      }
    }
    
    if (note && note.type === 'block') {
      newLines.splice(insertPos, 0, `//notes:${note.text}`, dimLine);
    } else {
      newLines.splice(insertPos, 0, dimLine);
    }
  } else {
    newLines = [];
    const existingRolls = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('dimwishlist:item=')) {
        const match = line.match(/item=(\d+)/);
        if (match && allWeaponHashes.includes(match[1])) {
          existingRolls.push(lines[i]);
          continue;
        }
      }
      newLines.push(lines[i]);
    }
    
    const trimmedContent = newLines.join('\n').trimEnd();
    newLines = trimmedContent.split('\n');
    newLines.push('');
    newLines.push('');
    newLines.push(weaponComment);
    
    for (const roll of existingRolls) {
      newLines.push(roll);
    }
    
    if (note && note.type === 'block') {
      newLines.push(`//notes:${note.text}`);
    }
    newLines.push(dimLine);
  }

  return newLines.join('\n') + '\n';
}

async function main() {
  clearScreen();
  console.log(`${colorize('=== Godroll CLI ===', 'cyan', 'bold')}\n`);

  const menuOptions = ['Modifica wishlist esistente', 'Crea nuova wishlist', 'Esci'];
  const selected = await selectFromList(menuOptions, 'Cosa vuoi fare');

  if (selected === null || selected === 2) {
    console.log('Arrivederci!');
    process.exit(0);
  }

  let targetFile;

  if (selected === 0) {
    clearScreen();
    console.log(`${colorize('--- Modifica Wishlist ---', 'cyan', 'bold')}\n`);

    const user = await selectUser();
    clearScreen();
    console.log(`${colorize('--- Modifica Wishlist ---', 'cyan', 'bold')}\n`);
    console.log(`${colorize('✓', 'green')} Wishlist selezionata: ${colorize(user, 'bold')}\n`);

    targetFile = await selectTxtFile(user);
    clearScreen();
    console.log(`${colorize('✓', 'green')} File selezionato: ${colorize(path.basename(targetFile), 'bold')}\n`);
  } else if (selected === 1) {
    targetFile = await createNewWishlist();
    clearScreen();
  }

  let manifest;
  try {
    manifest = await loadManifest();
  } catch (err) {
    console.log(`${colorize('✗', 'red')} Errore caricamento manifest: ${err.message}`);
    process.exit(1);
  }

  let currentWeapon = null;
  let currentWeaponHash = null;
  let currentAllWeaponHashes = null;

  while (true) {
    let weapon, weaponHash, allWeaponHashes;

    if (currentWeapon) {
      clearScreen();
      const actionOptions = [
        `Aggiungi un nuovo roll per ${currentWeapon.name}`,
        'Aggiungi un nuovo roll per un\'arma diversa',
        'Fine'
      ];
      const actionSelected = await selectFromList(actionOptions, 'Cosa vuoi fare');

      if (actionSelected === null || actionSelected === 2) {
        break;
      }

      if (actionSelected === 0) {
        weapon = currentWeapon;
        weaponHash = currentWeaponHash;
        allWeaponHashes = currentAllWeaponHashes;
      } else {
        const result = await searchWeapon(manifest);
        weapon = result.weapon;
        weaponHash = result.hash;
        allWeaponHashes = Object.entries(manifest.weapons)
          .filter(([h, w]) => w.name === weapon.name)
          .map(([h]) => h);
      }
    } else {
      const result = await searchWeapon(manifest);
      weapon = result.weapon;
      weaponHash = result.hash;
      allWeaponHashes = Object.entries(manifest.weapons)
        .filter(([h, w]) => w.name === weapon.name)
        .map(([h]) => h);
    }

    const perkIds = await selectPerks(manifest, weapon);

    clearScreen();
    console.log(`${colorize('=== Recap ===', 'cyan', 'bold')}`);
    console.log(`Arma: ${colorize(weapon.name, 'bold')}`);
    console.log(`Perk:`);
    perkIds.forEach((perkHash, i) => {
      if (perkHash === WILDCARD_PERK_ID) {
        console.log(`  Colonna ${i + 1}: ${colorize('Qualsiasi', 'yellow', 'bold')}`);
      } else {
        const perk = manifest.perks[perkHash];
        console.log(`  Colonna ${i + 1}: ${perk?.name || 'Sconosciuto'}`);
      }
    });

    const note = await askNote();

    let txtContent = fs.readFileSync(targetFile, 'utf-8');

    const { duplicate, line } = checkDuplicates(txtContent, weaponHash, perkIds);

    if (duplicate) {
      console.log(`\n${colorize('⚠ ATTENZIONE:', 'yellow', 'bold')} Questo roll esiste già alla riga ${colorize(String(line), 'yellow')}!`);
      const confirm = await ask('Vuoi comunque aggiungerlo? (s/n): ');
      if (confirm.toLowerCase() !== 's') {
        console.log('Roll saltato.');
        currentWeapon = weapon;
        currentWeaponHash = weaponHash;
        currentAllWeaponHashes = allWeaponHashes;
        continue;
      }
    }

    const newContent = appendRoll(txtContent, weaponHash, perkIds, note, weapon.name, weapon.type, allWeaponHashes);

    fs.writeFileSync(targetFile, newContent);

    console.log(`\n${colorize('✓', 'green')} Roll aggiunto a: ${colorize(path.basename(targetFile), 'bold')}`);
    currentWeapon = weapon;
    currentWeaponHash = weaponHash;
    currentAllWeaponHashes = allWeaponHashes;
  }

  console.log(`\n${colorize('✓', 'green')} Operazione completata!`);
  rl.close();
}

main().catch(err => {
  console.error(`\nErrore: ${err.message}`);
  rl.close();
  process.exit(1);
});
