import "server-only";
import type { StorePlayerService } from "./core";

/**
 * Integration boundary for the game-account work. Never substitute an address,
 * browser-supplied player ID, fixture login or in-memory balance as real authority.
 * Install the reviewed durable implementation here when that service is ready.
 */
export function getStorePlayerService(): StorePlayerService | null {
  return null;
}
