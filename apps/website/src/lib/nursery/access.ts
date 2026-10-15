// The account service remains authoritative. Never persist permission in browser storage.
export const nurseryAccessMessage = "Nursery actions are available to master administrators during beta testing.";
export async function requireNurseryAccess() {
  const response = await fetch('/api/nursery/access', { cache: 'no-store', credentials: 'same-origin', redirect: 'error' });
  if (!response.ok || (await response.json()).masterAdministrator !== true) throw new Error(nurseryAccessMessage);
}
