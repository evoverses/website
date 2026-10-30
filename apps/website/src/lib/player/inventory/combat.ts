import choiceCatalogue from "@/data/move-learning.json";

type ChoiceCatalogue = {
  species: Record<string, { starters: number[]; groups: Record<string, number[]> }>;
  moveNames: Record<string, string>;
};
const catalogues = choiceCatalogue.catalogues as Record<string, ChoiceCatalogue>;
// Mutable battle state is supplied by the account service, independently of NFT metadata.
export type CombatState = {
  resourceKey: string; currentHealth: number; maxHealth: number; version: number;
  recoverAt: string | null; equipped: number[];
  level?: number; experience?: number;
  learning?: { catalogueVersion: string; learned: number[] };
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
  // Older responses may omit progression; current responses must supply a valid pair.
  const hasProgression = value.level !== undefined || value.experience !== undefined;
  if (hasProgression && (!whole(value.level, 1, 100) || !whole(value.experience, 0, Number.MAX_SAFE_INTEGER))) return invalid();
  const equipped = value.equipped as number[];
  const moves = value.moves.map(m => {
    if (!record(m) || !whole(m.id, 1, 2147483647) || !whole(m.maximum, 1, 1000) || !whole(m.remaining, 0, Number(m.maximum)) ||
        typeof m.equipped !== 'boolean' || m.equipped !== equipped.includes(m.id)) return invalid();
    return {id:m.id, remaining:m.remaining, maximum:m.maximum, equipped:m.equipped};
  });
  if(new Set(moves.map(m=>m.id)).size!==moves.length || equipped.some(id=>!moves.some(m=>m.id===id))) return invalid();
  let learning: CombatState["learning"];
  if (value.learning !== undefined && value.learning !== null) {
    const v = value.learning;
    if (!record(v) || v.resourceKey !== value.resourceKey || typeof v.catalogueVersion !== "string" ||
        !Object.hasOwn(catalogues, v.catalogueVersion) || !hasProgression ||
        !Array.isArray(v.learned) || v.learned.length < 4 || v.learned.length > 241 ||
        v.learned.some(id => !whole(id, 1, 2147483647)) || new Set(v.learned).size !== v.learned.length ||
        v.learned.length !== moves.length || v.learned.some(id => !moves.some(m => m.id === id))) return invalid();
    learning = { catalogueVersion: v.catalogueVersion, learned: v.learned as number[] };
  }
  return {...(hasProgression ? {level:value.level as number,experience:value.experience as number} : {}),...(learning ? {learning} : {}),resourceKey:value.resourceKey,currentHealth:value.currentHealth,maxHealth:value.maxHealth as number,version:value.version,recoverAt:value.recoverAt as string|null,equipped,moves};
}
export function combatDetails<T extends {currentHealth:number; values?:Record<string,number>; moves:{id:number;equipped:boolean;unlocked:boolean}[]}>(details:T, state:CombatState, species?: string): T & {maxHealth:number;combatVerified:true;recoverAt:string|null;combatVersion:number} {
  let moves = details.moves;
  if (state.learning) {
    const policy = catalogues[state.learning.catalogueVersion];
    const rule = species && policy?.species[species.toLowerCase()];
    if (!rule) throw Error("Invalid move learning species");
    const levels = new Map(rule.starters.map(id => [id, 1]));
    for (const [gate, ids] of Object.entries(rule.groups)) for (const id of ids) levels.set(id, Number(gate));
    const learned = new Set(state.learning.learned);
    if (rule.starters.some(id => !learned.has(id)) || state.learning.learned.some(id => !levels.has(id)) ||
        learned.size !== state.moves.length || state.moves.some(m => !learned.has(m.id))) throw Error("Invalid learned combat move");
    // Reaching a choice gate does not learn every eligible move. Only the
    // authenticated service's saved learned collection reveals names and PP.
    moves = [...levels].map(([id, level]) => ({ id, level, choice: true,
      name: learned.has(id) ? policy.moveNames[id]! : "New move",
      unlocked: learned.has(id), equipped: state.equipped.includes(id),
    })).sort((a, b) => a.level - b.level || a.id - b.id);
  }
  // Legacy accounts still use their authored automatic unlocks.
  if(state.moves.some(m=>!moves.some(d=>d.id===m.id&&d.unlocked))) throw Error('Invalid unlocked combat move');
  return {...details,currentHealth:state.currentHealth,maxHealth:state.maxHealth,...(details.values?{values:{...details.values,health:state.maxHealth}}:{}),combatVerified:true,recoverAt:state.recoverAt,combatVersion:state.version,
    moves:moves.map(m=>{const pp=state.moves.find(p=>p.id===m.id);return {...m,equipped:state.equipped.includes(m.id),...(pp?{remainingPP:pp.remaining,maximumPP:pp.maximum}:{} )};})};
}
