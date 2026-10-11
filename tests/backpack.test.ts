import { describe, expect, it } from 'vitest';
import { BACKPACK_PAGES, BACKPACK_TABS, openingPage, tabOf } from '../src/core/world/backpack';

describe('le sac à dos (D-159)', () => {
  it('s’ouvre toujours sur la carte ; Pause ouvre les réglages ; sans carte, les réglages', () => {
    expect(openingPage('bag', true)).toBe('map');
    expect(openingPage('hidden', true)).toBe('map');
    expect(openingPage('pause', true)).toBe('settings');
    expect(openingPage('bag', false)).toBe('settings');
    expect(openingPage('hidden', false)).toBe('settings');
  });

  it('chaque page est dans un seul onglet ; le cahier commence par la carte', () => {
    const pages = BACKPACK_TABS.flatMap((tab) => BACKPACK_PAGES[tab]);
    expect(new Set(pages).size).toBe(pages.length);
    expect(BACKPACK_PAGES.notebook[0]).toBe('map');
    for (const tab of BACKPACK_TABS) {
      for (const page of BACKPACK_PAGES[tab]) {
        expect(tabOf(page)).toBe(tab);
      }
    }
  });
});
