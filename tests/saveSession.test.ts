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
});
