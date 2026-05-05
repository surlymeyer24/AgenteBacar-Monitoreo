import { getFirebaseAuth } from '../lib/firebase';

/**
 * Fetch al backend Spring con `Authorization: Bearer <JWT>` cuando hay sesión Firebase.
 * Misma firma que `fetch`.
 */
export async function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers ?? {});
  const auth = getFirebaseAuth();
  if (auth?.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
