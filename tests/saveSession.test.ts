import { describe, expect, it } from 'vitest';
import { SaveManager } from '../src/core/save/SaveManager';
import { SaveSession } from '../src/core/save/SaveSession';
import { MemorySaveStorage } from '../src/core/save/SaveStorage';
import { createNewSave } from '../src/core/save/saveData';

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
    await session.setDisplay({ renderMode: 'screen' });
    const reloaded = await new SaveManager(storage).load();
    expect(reloaded.data?.checkpoint).toEqual({ levelId: 'checkpoints', checkpointId: 'c4-7' });
    expect(reloaded.data?.activatedCheckpoints).toEqual(['checkpoints:c4-7']);
    expect(reloaded.data?.settings.display.renderMode).toBe('screen');
    expect(reloaded.data?.savedAt).toBe(12);

    const imported = createNewSave('tour', 0);
    await session.replace(imported);
    expect((await new SaveManager(storage).load()).data?.checkpoint.levelId).toBe('tour');
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
});
