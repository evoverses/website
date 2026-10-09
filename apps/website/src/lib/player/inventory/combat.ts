// Mutable battle state is supplied by the account service, independently of NFT metadata.
export type CombatState = {
  resourceKey: string; currentHealth: number; maxHealth: number; version: number;
  recoverAt: string | null; equipped: number[];
  moves: { id: number; remaining: number; maximum: number; equipped: boolean }[];
};
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const whole = (v: unknown, min: number, max: number): v is number => Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max;
export function parseCombat(value: unknown, expectedKey?: string): CombatState {
  const invalid = (): never => { throw Error('Invalid Evo combat state'); };
  if (!record(value) || typeof value.resourceKey !== 'string' || value.resourceKey.length > 160 ||
      (expectedKey !== undefined && value.resourceKey !== expectedKey) || !whole(value.maxHealth,1,10000) ||
      !whole(value.currentHealth, 0, Number(value.maxHealth)) || !whole(value.version, 0, Number.MAX_SAFE_INTEGER) ||
      !(value.recoverAt === null || (typeof value.recoverAt === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.recoverAt) && Number.isFinite(Date.parse(value.recoverAt)))) ||
      !Array.isArray(value.moves) || !value.moves.length || value.moves.length > 300 ||
      !Array.isArray(value.equipped) || !value.equipped.length || value.equipped.length > 4 ||
      new Set(value.equipped).size !== value.equipped.length || value.equipped.some(id => !whole(id, 1, 2147483647))) return invalid();
  const equipped = value.equipped as number[];
  const moves = value.moves.map(m => {
    if (!record(m) || !whole(m.id, 1, 2147483647) || !whole(m.maximum, 1, 1000) || !whole(m.remaining, 0, Number(m.maximum)) ||
        typeof m.equipped !== 'boolean' || m.equipped !== equipped.includes(m.id)) return invalid();
    return {id:m.id, remaining:m.remaining, maximum:m.maximum, equipped:m.equipped};
  });
  if(new Set(moves.map(m=>m.id)).size!==moves.length || equipped.some(id=>!moves.some(m=>m.id===id))) return invalid();
  return {resourceKey:value.resourceKey,currentHealth:value.currentHealth,maxHealth:value.maxHealth as number,version:value.version,recoverAt:value.recoverAt as string|null,equipped,moves};
}
export function combatDetails<T extends {currentHealth:number; values?:Record<string,number>; moves:{id:number;equipped:boolean;unlocked:boolean}[]}>(details:T, state:CombatState): T & {maxHealth:number;combatVerified:true;recoverAt:string|null;combatVersion:number} {
  // Existing level/unlock rules stay authoritative; a malformed projection is never displayed as full PP.
  if(state.moves.some(m=>!details.moves.some(d=>d.id===m.id&&d.unlocked))) throw Error('Invalid unlocked combat move');
  return {...details,currentHealth:state.currentHealth,maxHealth:state.maxHealth,...(details.values?{values:{...details.values,health:state.maxHealth}}:{}),combatVerified:true,recoverAt:state.recoverAt,combatVersion:state.version,
    moves:details.moves.map(m=>{const pp=state.moves.find(p=>p.id===m.id);return {...m,equipped:state.equipped.includes(m.id),...(pp?{remainingPP:pp.remaining,maximumPP:pp.maximum}:{} )};})};
}
