import { describe, expect, it } from 'vitest';
import { SaveLibrary } from '../src/core/save/SaveLibrary';
import { SaveManager } from '../src/core/save/SaveManager';
import { SaveSession, SettingsSession } from '../src/core/save/SaveSession';
import { MemorySaveLibraryStorage, MemorySaveStorage } from '../src/core/save/SaveStorage';
import { createNewSave } from '../src/core/save/saveData';
import { createSettings } from '../src/core/save/settingsData';

describe('SaveSession', () => {
  it('enregistre checkpoint, réglages et import, relus après « fermeture »', async () => {
    const storage = new MemorySaveStorage();
    let clock = 10;
    const session = new SaveSession(
      new SaveManager(storage),
      createNewSave('premiers-pas', 0),
      () => clock++,
    );
    await session.setCheckpoint('checkpoints', 'c4-7');
    await session.setCheckpoint('checkpoints', 'c4-7');
    const reloaded = await new SaveManager(storage).load();
    expect(reloaded.data?.checkpoint).toEqual({ levelId: 'checkpoints', checkpointId: 'c4-7' });
    expect(reloaded.data?.activatedCheckpoints).toEqual(['checkpoints:c4-7']);
    expect(reloaded.data?.savedAt).toBe(11);

    const imported = createNewSave('tour', 0);
    await session.replace(imported);
    expect((await new SaveManager(storage).load()).data?.checkpoint.levelId).toBe('tour');
  });

  it('écrit les réglages à part, communs à toutes les parties (D-184)', async () => {
    const storage = new MemorySaveLibraryStorage();
    const library = new SaveLibrary(storage);
    const opened = await library.open(createSettings);
    const settings = new SettingsSession(library.settingsManager, opened.settings);
    const first = new SaveSession(library.slotManager(1), createNewSave('a', 0), () => 1, settings);
    await first.setDisplay({ renderMode: 'screen' });
    await first.setAudio({ volume: 0.3, muted: false, sfxVolume: 0.5 });
    // La partie elle-même n'est pas réécrite pour un réglage.
    expect((await library.slotManager(1).load()).data).toBeNull();
    const reopened = await new SaveLibrary(storage).open(createSettings);
    expect(reopened.settings.display.renderMode).toBe('screen');
    expect(reopened.settings.audio.volume).toBe(0.3);
    // Une autre partie voit les mêmes réglages.
    const other = new SaveSession(
      library.slotManager(2),
      createNewSave('b', 0),
      () => 2,
      new SettingsSession(library.settingsManager, reopened.settings),
    );
    expect(other.settings.data.display.renderMode).toBe('screen');
    await other.flush();
  });

  it('changer de salle sans checkpoint garde les checkpoints activés', async () => {
    const session = new SaveSession(
      new SaveManager(new MemorySaveStorage()),
      createNewSave('a', 0),
    );
    await session.setCheckpoint('a', 'c1-1');
    await session.setCheckpoint('b', null);
    expect(session.data.checkpoint).toEqual({ levelId: 'b', checkpointId: null });
    expect(session.data.activatedCheckpoints).toEqual(['a:c1-1']);
  });

  it('révèle une salle visitée une seule fois, sans toucher au point de retour', async () => {
    const storage = new MemorySaveStorage();
    let clock = 0;
    const session = new SaveSession(
      new SaveManager(storage),
      createNewSave('bedroom', 0),
      () => ++clock,
    );
    await session.setCheckpoint('bedroom', 'c20-19');
    await session.revealRoom('hall');
    await session.revealRoom('hall');
    expect(clock).toBe(2);
    const reloaded = (await new SaveManager(storage).load()).data;
    expect(reloaded?.progression.mapRevealed).toEqual(['hall']);
    expect(reloaded?.checkpoint).toEqual({ levelId: 'bedroom', checkpointId: 'c20-19' });
  });

  it('note une étape de l’histoire une seule fois, relue après « fermeture »', async () => {
    const storage = new MemorySaveStorage();
    let clock = 0;
    const session = new SaveSession(
      new SaveManager(storage),
      createNewSave('bedroom', 0),
      () => ++clock,
    );
    await session.addStoryFlag('evening.played');
    await session.addStoryFlag('evening.played');
    expect(clock).toBe(1);
    const reloaded = (await new SaveManager(storage).load()).data;
    expect(reloaded?.story.flags).toEqual(['evening.played']);
  });

  it('retire une étape réversible (la marée, D-95), relue après « fermeture »', async () => {
    const storage = new MemorySaveStorage();
    let clock = 0;
    const session = new SaveSession(
      new SaveManager(storage),
      createNewSave('bedroom', 0),
      () => ++clock,
    );
    await session.addStoryFlag('evening.played');
    await session.addStoryFlag('sea.tide-high');
    await session.removeStoryFlag('sea.tide-high');
    await session.removeStoryFlag('sea.tide-high');
    expect(clock).toBe(3);
    const reloaded = (await new SaveManager(storage).load()).data;
    expect(reloaded?.story.flags).toEqual(['evening.played']);
  });

  it('garde un souvenir une seule fois, relu après « fermeture » (D-38)', async () => {
    const storage = new MemorySaveStorage();
    let clock = 0;
    const session = new SaveSession(
      new SaveManager(storage),
      createNewSave('bedroom', 0),
      () => ++clock,
    );
    await session.addMemory('photo');
    await session.addMemory('photo');
    expect(clock).toBe(1);
    const reloaded = (await new SaveManager(storage).load()).data;
    expect(reloaded?.progression.memories).toEqual(['photo']);
  });

  it('note une coquille vue une seule fois, jamais une coquille déjà trouvée (D-148)', async () => {
    const storage = new MemorySaveStorage();
    let clock = 0;
    const session = new SaveSession(
      new SaveManager(storage),
      createNewSave('bedroom', 0),
      () => ++clock,
    );
    await session.addSeenCollectible('attic-ridge');
    await session.addSeenCollectible('attic-ridge');
    await session.addCollectible('hall-mirror');
    await session.addSeenCollectible('hall-mirror');
    expect(clock).toBe(2);
    const reloaded = (await new SaveManager(storage).load()).data;
    expect(reloaded?.progression.seenCollectibles).toEqual(['attic-ridge']);
    await session.removeCollectible('hall-mirror');
    expect(session.data.progression.collectibles).toEqual([]);
  });
});
