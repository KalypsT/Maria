import { describe, expect, it } from 'vitest';
import { SaveManager } from '../src/core/save/SaveManager';
import { MemorySaveStorage } from '../src/core/save/SaveStorage';
import { createNewSave, deserializeSave, type SaveData } from '../src/core/save/saveData';

function save(n: number): SaveData {
  const data = createNewSave('premiers-pas', 1000 + n);
  data.activatedCheckpoints = [`premiers-pas:c${n}-1`];
  return data;
}

describe('SaveManager', () => {
  it('démarre sans sauvegarde, puis relit la dernière écrite', async () => {
    const storage = new MemorySaveStorage();
    const manager = new SaveManager(storage);
    expect((await manager.load()).source).toBe('none');
    await manager.save(save(1));
    await manager.save(save(2));
    const report = await new SaveManager(storage).load();
    expect(report.source).toBe('main');
    expect(report.data).toEqual(save(2));
    // Le précédent est l'avant-dernier état valide.
    const previous = deserializeSave(storage.slots.previous);
    expect(previous.ok && previous.data).toEqual(save(1));
  });

  it('récupère l’état précédent si le principal est abîmé', async () => {
    const storage = new MemorySaveStorage();
    const manager = new SaveManager(storage);
    await manager.save(save(1));
    await manager.save(save(2));
    storage.slots.main = (storage.slots.main ?? '').replace('c2-1', 'c9-1');
    const report = await new SaveManager(storage).load();
    expect(report.source).toBe('previous');
    expect(report.mainProblem).toBe('checksum');
    expect(report.data).toEqual(save(1));
  });

  it('une écriture interrompue ne perd rien', async () => {
    const storage = new MemorySaveStorage();
    const manager = new SaveManager(storage);
    await manager.save(save(1));
    storage.failNextWrite = true;
    await manager.save(save(2));
    expect(manager.lastError).toMatch(/interrompue/);
    expect((await new SaveManager(storage).load()).data).toEqual(save(1));
    // L'écriture suivante réussit et garde save(1) comme précédent.
    await manager.save(save(3));
    const previous = deserializeSave(storage.slots.previous);
    expect(previous.ok && previous.data).toEqual(save(1));
  });

  it('ne fait jamais d’un principal abîmé le nouvel état précédent', async () => {
    const storage = new MemorySaveStorage();
    await new SaveManager(storage).save(save(1));
    // Un nouveau gestionnaire qui écrit sans charger conserve quand même le principal valide.
    await new SaveManager(storage).save(save(2));
    const kept = deserializeSave(storage.slots.previous);
    expect(kept.ok && kept.data).toEqual(save(1));
    storage.slots = { main: '{"abîmé', previous: storage.slots.main };
    const manager = new SaveManager(storage);
    const report = await manager.load();
    expect(report.source).toBe('previous');
    await manager.save(save(3));
    const previous = deserializeSave(storage.slots.previous);
    expect(previous.ok && previous.data).toEqual(save(2));
  });

  it('démarre une partie neuve si les deux emplacements sont inutilisables', async () => {
    const storage = new MemorySaveStorage();
    storage.slots = { main: 'x', previous: '{"format":"maria-save"}' };
    const report = await new SaveManager(storage).load();
    expect(report).toMatchObject({
      data: null,
      source: 'none',
      mainProblem: 'unreadable',
      previousProblem: 'format',
    });
  });

  it('survit à un stockage illisible', async () => {
    const storage = new MemorySaveStorage();
    storage.read = () => Promise.reject(new Error('stockage indisponible'));
    const report = await new SaveManager(storage).load();
    expect(report).toMatchObject({ data: null, readFailed: true });
  });

  it('met les écritures en file, dans l’ordre', async () => {
    const storage = new MemorySaveStorage();
    const manager = new SaveManager(storage);
    await Promise.all([manager.save(save(1)), manager.save(save(2)), manager.save(save(3))]);
    expect(storage.writes).toBe(3);
    expect((await new SaveManager(storage).load()).data).toEqual(save(3));
    await manager.clear();
    expect((await new SaveManager(storage).load()).source).toBe('none');
  });

  it('attend les écritures en cours avant de quitter, sans réécrire', async () => {
    const storage = new MemorySaveStorage();
    const manager = new SaveManager(storage);
    void manager.save(save(1));
    void manager.save(save(2));
    await manager.flush();
    expect(storage.writes).toBe(2);
    expect((await new SaveManager(storage).load()).data).toEqual(save(2));
  });
});
