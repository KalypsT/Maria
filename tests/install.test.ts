import { describe, expect, it } from 'vitest';
import {
  installHint,
  isInstalled,
  isIos,
  type InstallEnvironment,
} from '../src/core/platform/install';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';

function env(overrides: Partial<InstallEnvironment>): InstallEnvironment {
  return {
    userAgent: IPHONE,
    maxTouchPoints: 5,
    displayModeInstalled: false,
    iosStandalone: false,
    ...overrides,
  };
}

describe('installation (D-23)', () => {
  it('propose l’aide « Partager → Sur l’écran d’accueil » sur iOS, hors installation', () => {
    expect(installHint(env({}))).toBe('ios-share');
    expect(installHint(env({ userAgent: IPAD_AS_MAC }))).toBe('ios-share');
  });

  it('ne propose rien une fois installé, sur Android, sur ordinateur, ni dans une appli intégrée', () => {
    expect(installHint(env({ iosStandalone: true }))).toBe('none');
    expect(installHint(env({ displayModeInstalled: true }))).toBe('none');
    expect(installHint(env({ userAgent: ANDROID }))).toBe('none');
    expect(installHint(env({ userAgent: IPAD_AS_MAC, maxTouchPoints: 0 }))).toBe('none');
    expect(installHint(env({ userAgent: `${IPHONE} Instagram 300.0` }))).toBe('none');
  });

  it('reconnaît iOS et l’application installée', () => {
    expect(isIos(env({}))).toBe(true);
    expect(isIos(env({ userAgent: ANDROID }))).toBe(false);
    expect(isInstalled(env({ displayModeInstalled: true }))).toBe(true);
    expect(isInstalled(env({ iosStandalone: undefined }))).toBe(false);
  });
});
