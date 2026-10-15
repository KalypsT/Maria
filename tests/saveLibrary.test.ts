import { describe, expect, it } from 'vitest';
import { checksum } from '../src/core/save/checksum';
import { SaveLibrary } from '../src/core/save/SaveLibrary';
import { MemorySaveLibraryStorage } from '../src/core/save/SaveStorage';
import { createNewSave, serializeSave, type SaveData } from '../src/core/save/saveData';
import { createSettings, serializeSettings } from '../src/core/save/settingsData';

/** Une sauvegarde de la version 3, d'avant les parties multiples, avec ses réglages. */
function legacyText(levelId: string, opacity: number): string {
  const data: Record<string, unknown> = {
    ...createNewSave(levelId, 1000),
    version: 3,
    settings: {
      controls: { buttonScale: 1.2, opacity },
      display: { renderMode: 'screen' },
      audio: { volume: 0.3, muted: false, sfxVolume: 0.6 },
    },
  };
  const payload = JSON.stringify(data);
  return JSON.stringify({ format: 'maria-save', version: 3, checksum: checksum(payload), payload });
}

function game(levelId: string): SaveData {
  return createNewSave(levelId, 2000);
}

function withLegacy(): MemorySaveLibraryStorage {
  const storage = new MemorySaveLibraryStorage();
  storage.legacy = { main: legacyText('kitchen', 0.4), previous: legacyText('bedroom', 0.5) };
  return storage;
}

describe('SaveLibrary (D-184)', () => {
  it('un appareil neuf : aucune partie, les réglages par défaut, la partie 1', async () => {
    const storage = new MemorySaveLibraryStorage();
    const library = new SaveLibrary(storage);
    const report = await library.open(createSettings);
    expect(report).toEqual({
      migrated: false,
      migrationError: null,
      settings: createSettings(),
      lastSlot: 1,
    });
    expect((await library.slotManager(1).load()).source).toBe('none');
  });

  it('copie l’ancienne sauvegarde dans la partie 1, sans y toucher, avec ses réglages', async () => {
    const storage = withLegacy();
    const legacy = { ...storage.legacy };
    const library = new SaveLibrary(storage);
    const report = await library.open(createSettings);
    expect(report.migrated).toBe(true);
    expect(report.settings.controls.opacity).toBe(0.4);
    expect(report.settings.display.renderMode).toBe('screen');
    expect(storage.writes).toBe(1);
    // Les textes sont copiés tels quels (ni réécrits ni réencodés) ; l'original reste intact.
    expect(storage.values.get('slot1.main')).toBe(legacy.main);
    expect(storage.values.get('slot1.previous')).toBe(legacy.previous);
    expect(storage.legacy).toEqual(legacy);
    const loaded = await library.slotManager(1).load();
    expect(loaded.source).toBe('main');
    expect(loaded.data?.checkpoint.levelId).toBe('kitchen');
    expect((await library.slotManager(2).load()).data).toBeNull();
  });

  it('ne reprend l’ancienne sauvegarde qu’une fois : ni par-dessus la partie, ni après effacement', async () => {
    const storage = withLegacy();
    await new SaveLibrary(storage).open(createSettings);
    const library = new SaveLibrary(storage);
    await library.open(createSettings);
    await library.slotManager(1).save(game('garden'));
    expect((await library.slotManager(1).load()).data?.checkpoint.levelId).toBe('garden');
    // La partie 1 effacée : l'ancienne sauvegarde ne revient pas.
    await library.slotManager(1).clear();
    const again = new SaveLibrary(storage);
    expect((await again.open(createSettings)).migrated).toBe(false);
    expect((await again.slotManager(1).load()).data).toBeNull();
  });

  it('une ancienne sauvegarde au principal abîmé : la copie garde le précédent', async () => {
    const storage = withLegacy();
    storage.legacy.main = '{"abîmé';
    const library = new SaveLibrary(storage);
    const report = await library.open(createSettings);
    expect(report.migrated).toBe(true);
    // Les réglages du précédent, intact.
    expect(report.settings.controls.opacity).toBe(0.5);
    const loaded = await library.slotManager(1).load();
    expect(loaded.source).toBe('previous');
    expect(loaded.data?.checkpoint.levelId).toBe('bedroom');
  });

  it('une reprise qui échoue ne perd rien : la partie 1 lit encore l’ancienne sauvegarde', async () => {
    const storage = withLegacy();
    storage.failNextWrite = true;
    const library = new SaveLibrary(storage);
    const report = await library.open(createSettings);
    expect(report.migrated).toBe(false);
    expect(report.migrationError).toMatch(/interrompue/);
    expect(report.settings.controls.opacity).toBe(0.4);
    const manager = library.slotManager(1);
    expect((await manager.load()).data?.checkpoint.levelId).toBe('kitchen');
    // On joue : la partie s'écrit dans son emplacement, l'ancienne en précédent.
    await manager.save(game('garden'));
    // Au lancement suivant, la reprise ne recouvre pas la partie jouée.
    const next = new SaveLibrary(storage);
    expect((await next.open(createSettings)).migrated).toBe(false);
    const loaded = await next.slotManager(1).load();
    expect(loaded.data?.checkpoint.levelId).toBe('garden');
    expect(storage.values.get('slot1.previous')).toBe(storage.legacy.main);
    // Les réglages de l'ancienne sauvegarde ont été repris à ce lancement-là.
    expect((await next.settingsManager.load()).data?.controls.opacity).toBe(0.4);
  });

  it('les parties sont indépendantes, chacune avec son principal et son précédent', async () => {
    const storage = new MemorySaveLibraryStorage();
    const library = new SaveLibrary(storage);
    await library.open(createSettings);
    await library.slotManager(1).save(game('kitchen'));
    await library.slotManager(2).save(game('garden'));
    await library.slotManager(2).save(game('station'));
    await library.slotManager(3).save(game('sea'));
    await library.slotManager(3).clear();
    expect((await library.slotManager(1).load()).data?.checkpoint.levelId).toBe('kitchen');
    const second = await library.slotManager(2).load();
    expect(second.data?.checkpoint.levelId).toBe('station');
    expect(storage.values.get('slot2.previous')).toBe(serializeSave(game('garden')));
    expect((await library.slotManager(3).load()).data).toBeNull();
  });

  it('retient la dernière partie jouée ; une valeur invalide donne la partie 1', async () => {
    const storage = new MemorySaveLibraryStorage();
    const library = new SaveLibrary(storage);
    await library.open(createSettings);
    await library.setLastSlot(3);
    expect((await new SaveLibrary(storage).open(createSettings)).lastSlot).toBe(3);
    storage.values.set('last-slot', '7');
    expect(await library.lastSlot()).toBe(1);
    // Un échec d'écriture est sans conséquence.
    storage.failNextWrite = true;
    await library.setLastSlot(2);
    expect(await library.lastSlot()).toBe(1);
  });

  it('les réglages : relus, récupérés du précédent, sinon ceux par défaut', async () => {
    const storage = new MemorySaveLibraryStorage();
    const library = new SaveLibrary(storage);
    await library.open(createSettings);
    const settings = createSettings();
    settings.audio.volume = 0.2;
    await library.settingsManager.save(settings);
    settings.audio.volume = 0.7;
    await library.settingsManager.save(settings);
    expect((await new SaveLibrary(storage).open(createSettings)).settings.audio.volume).toBe(0.7);
    storage.values.set('settings.main', '{"abîmé');
    expect((await new SaveLibrary(storage).open(createSettings)).settings.audio.volume).toBe(0.2);
    storage.values.set('settings.previous', serializeSettings(settings).replace('0.7', '0.9'));
    const fallback = createSettings();
    fallback.audio.volume = 0.1;
    const report = await new SaveLibrary(storage).open(() => fallback);
    expect(report.settings.audio.volume).toBe(0.1);
  });
});
