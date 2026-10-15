import type { MarkStorage } from '../core/platform/quietRelaunch';

/** `sessionStorage`, ou null si le navigateur le refuse (son simple accès peut lever une erreur). */
export function sessionMarks(): MarkStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
