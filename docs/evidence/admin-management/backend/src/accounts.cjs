'use strict';
const { createHash, randomBytes, randomUUID } = require('node:crypto');
const { inspect } = require('node:util');
const { epicDisplayName } = require('./profile.cjs');
const { EconomyError } = require('./economy.cjs');
const fail = code => { throw new EconomyError(code); };
const first = async (tx, sql, args = []) => (await tx.query(sql, args)).rows[0];
function fields(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) fail('INVALID_REQUEST');
}
function tokenHash(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9._~+/=-]{32,1024}$/.test(token)) fail('INVALID_SESSION');
  return createHash('sha256').update(token).digest('hex');
}
const playerDto = p => Object.freeze({ id: p.id, displayName: p.display_name, experience: p.experience });
const dbNow = async tx => Number((await first(tx, 'SELECT extract(epoch FROM clock_timestamp())::text AS seconds')).seconds);

// Local test-mode backend seam. Inject a trusted verifier; never accept verified
// identity claims from a browser. epic.cjs supplies the separate server-only verifier.
class PlayerAccounts {
  constructor({ database, mode, verifyEpicEvidence, epic, sessionTtlSeconds = 900, grantNewPlayer }) {
    if (mode !== 'test') fail('LIVE_MODE_DISABLED');
    if (!database || typeof database.transaction !== 'function' || typeof verifyEpicEvidence !== 'function') fail('INVALID_CONFIGURATION');
    fields(epic, ['issuer','scope','audiences']);
    if (![epic.issuer, epic.scope].every(s => typeof s === 'string' && s.length > 0 && s.length <= 200) ||
        !Array.isArray(epic.audiences) || epic.audiences.length < 1 || epic.audiences.length > 8 ||
        !epic.audiences.every(s => typeof s === 'string' && s.length > 0 && s.length <= 200) ||
        !Number.isInteger(sessionTtlSeconds) || sessionTtlSeconds < 1 || sessionTtlSeconds > 604800) fail('INVALID_CONFIGURATION');
    this.database = database;
    this.verifyEpicEvidence = verifyEpicEvidence;
    this.epic = Object.freeze({ ...epic, audiences: Object.freeze([...epic.audiences]) });
    this.sessionTtlSeconds = sessionTtlSeconds;
    if (grantNewPlayer !== undefined && typeof grantNewPlayer !== 'function') fail('INVALID_CONFIGURATION');
    this.grantNewPlayer = grantNewPlayer;
  }
  async transaction(work) {
    for (let attempt = 0; ; attempt++) {
      try { return await this.database.transaction(work); }
      catch (error) {
        if (['40001','40P01'].includes(error.code) && attempt < 2) continue;
        if (error instanceof EconomyError) throw error;
        fail('STORAGE_FAILURE');
      }
    }
  }
  validateEvidence(evidence, now) {
    if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence) ||
        Object.keys(evidence).some(k => !['provider','scope','subject','issuer','audience','issuedAt','expiresAt','displayName'].includes(k)) ||
        evidence.provider !== 'epic' || evidence.scope !== this.epic.scope || evidence.issuer !== this.epic.issuer ||
        !this.epic.audiences.includes(evidence.audience) || typeof evidence.subject !== 'string' ||
        !/^[A-Za-z0-9:_-]{1,200}$/.test(evidence.subject) ||
        !Number.isSafeInteger(evidence.issuedAt) || !Number.isSafeInteger(evidence.expiresAt) ||
        (evidence.displayName !== undefined && epicDisplayName(evidence.displayName) !== evidence.displayName) ||
        evidence.issuedAt < 0 || evidence.issuedAt > now || evidence.expiresAt <= now || evidence.expiresAt <= evidence.issuedAt) fail('INVALID_PROVIDER_EVIDENCE');
  }
  async audit(tx, playerId, action, actor, details = {}, operationId = randomUUID()) {
    await tx.query(`INSERT INTO player.account_audit(id,player_id,action,actor,operation_id,details)
      VALUES($1,$2,$3,$4,$5,$6)`, [randomUUID(),playerId,action,actor,operationId,JSON.stringify(details)]);
  }
  async sessionPlayer(tx, token) {
    const hash = tokenHash(token);
    const p = await first(tx, `SELECT p.id,p.display_name,p.status,p.experience FROM player.sessions s
      JOIN player.players p ON p.id=s.player_id WHERE s.token_hash=$1 FOR UPDATE OF p,s`, [hash]);
    if (!p) fail('INVALID_SESSION');
    // Recheck expiry/revocation after acquiring the locks, using current DB time.
    const session = await first(tx, `SELECT 1 FROM player.sessions WHERE token_hash=$1 AND revoked_at IS NULL
      AND issued_at<=clock_timestamp() AND expires_at>clock_timestamp()`, [hash]);
    if (!session) fail('INVALID_SESSION');
    if (p.status !== 'active') fail('ACCOUNT_UNAVAILABLE');
    return p;
  }
  async login(input) {
    fields(input, ['proof','confirmNewPlayer']);
    const confirmation = input.confirmNewPlayer === undefined ? false : input.confirmNewPlayer;
    if (typeof input.proof !== 'string' || input.proof.length < 1 || input.proof.length > 16384 || typeof confirmation !== 'boolean') fail('INVALID_REQUEST');
    let evidence;
    try { evidence = Object.freeze({ ...await this.verifyEpicEvidence({ proof: input.proof }) }); }
    catch { fail('PROVIDER_UNAVAILABLE'); }
    // Verification is outside the transaction. Recheck returned evidence after
    // taking the identity/player locks so queued expired evidence cannot log in.
    return this.transaction(async tx => {
      this.validateEvidence(evidence, await dbNow(tx));
      const lock = createHash('sha256').update(JSON.stringify(['evoverses-login-v1', evidence.provider, evidence.scope, evidence.subject])).digest().readBigInt64BE(0).toString();
      await tx.query('SELECT pg_advisory_xact_lock($1::bigint)', [lock]);
      let mapping = await first(tx, 'SELECT player_id FROM player.identities WHERE provider=$1 AND scope=$2 AND subject=$3',
        [evidence.provider,evidence.scope,evidence.subject]);
      const operationId = randomUUID();
      if (!mapping) {
        if (!confirmation) fail('NEW_PLAYER_CONFIRMATION_REQUIRED');
        const playerId = randomUUID();
        await tx.query('INSERT INTO player.players(id,display_name) VALUES($1,$2)', [playerId,evidence.displayName ?? 'New Trainer']);
        await tx.query('INSERT INTO player.balances(player_id) VALUES($1)', [playerId]);
        await tx.query('INSERT INTO player.identities(provider,scope,subject,player_id,verified_at) VALUES($1,$2,$3,$4,clock_timestamp())',
          [evidence.provider,evidence.scope,evidence.subject,playerId]);
        if (this.grantNewPlayer) await this.grantNewPlayer(tx, playerId);
        mapping = { player_id: playerId };
        await this.audit(tx, playerId, 'player_created', 'provider', { provider: 'epic' }, operationId);
      }
      let p = await first(tx, 'SELECT id,display_name,status,experience FROM player.players WHERE id=$1 FOR UPDATE', [mapping.player_id]);
      this.validateEvidence(evidence, await dbNow(tx));
      if (!p || p.status !== 'active') fail('ACCOUNT_UNAVAILABLE');
      // Sync verified Epic profile text; the immutable subject mapping and all
      // progression/inventory stay on the same player. This rolls back with login.
      const nameUpdated = evidence.displayName !== undefined && evidence.displayName !== p.display_name;
      if (nameUpdated) p = await first(tx,
        'UPDATE player.players SET display_name=$1 WHERE id=$2 RETURNING id,display_name,status,experience', [evidence.displayName,p.id]);
      const token = randomBytes(32).toString('hex');
      const session = await first(tx, `INSERT INTO player.sessions(token_hash,player_id,issued_at,expires_at)
        SELECT $1,$2,t,t+($3::integer * interval '1 second') FROM (SELECT clock_timestamp() AS t) now_time
        RETURNING issued_at,expires_at`, [tokenHash(token),p.id,this.sessionTtlSeconds]);
      await this.audit(tx, p.id, 'session_issued', 'provider', evidence.displayName === undefined ? {} :
        { epicDisplayNameApplied: true, epicDisplayNameUpdated: nameUpdated }, operationId);
      const safe = { player: playerDto(p), issuedAt: new Date(session.issued_at).getTime()/1000, expiresAt: new Date(session.expires_at).getTime()/1000 };
      const result = { ...safe };
      Object.defineProperty(result, 'sessionToken', { value: token, enumerable: false });
      Object.defineProperty(result, inspect.custom, { value: () => ({ ...safe }) });
      return Object.freeze(result); // Credentials omitted by JSON and normal inspection.
    });
  }
  session(token) { return this.transaction(async tx => playerDto(await this.sessionPlayer(tx, token))); }
  async logout(token) {
    const hash = tokenHash(token);
    return this.transaction(async tx => {
      const saved = await first(tx, 'SELECT player_id FROM player.sessions WHERE token_hash=$1', [hash]);
      if (!saved) return;
      await tx.query('SELECT id FROM player.players WHERE id=$1 FOR UPDATE', [saved.player_id]);
      const result = await tx.query('UPDATE player.sessions SET revoked_at=clock_timestamp() WHERE token_hash=$1 AND revoked_at IS NULL RETURNING player_id', [hash]);
      if (result.rows.length) await this.audit(tx, saved.player_id, 'session_logged_out', 'player');
    });
  }
  async revokePlayer(tx, playerId) {
    return (await tx.query('UPDATE player.sessions SET revoked_at=clock_timestamp() WHERE player_id=$1 AND revoked_at IS NULL RETURNING token_hash', [playerId])).rows.length;
  }
  logoutEverywhere(token) {
    return this.transaction(async tx => {
      const p = await this.sessionPlayer(tx, token);
      const sessionsRevoked = await this.revokePlayer(tx, p.id);
      await this.audit(tx, p.id, 'sessions_logged_out', 'player', { sessionsRevoked });
      return { sessionsRevoked };
    });
  }
  auditEvents(token) {
    return this.transaction(async tx => {
      const p = await this.sessionPlayer(tx, token);
      return (await tx.query('SELECT id,action,actor,operation_id,occurred_at,details FROM player.account_audit WHERE player_id=$1 ORDER BY occurred_at,id', [p.id])).rows;
    });
  }
  async _changeStatus(playerId, status, reasonCode, actor) {
    if (!(actor instanceof FixtureAccountAdministration) || actor.accounts !== this) fail('INVALID_CONFIGURATION');
    if (typeof playerId !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(playerId) ||
        !['security','moderation','local-test'].includes(reasonCode) || !['active','suspended'].includes(status)) fail('INVALID_REQUEST');
    return this.transaction(async tx => {
      const p = await first(tx, 'SELECT id,display_name,status,experience FROM player.players WHERE id=$1 FOR UPDATE', [playerId]);
      if (!p || p.status === 'closed') fail('ACCOUNT_UNAVAILABLE');
      if (status === 'active' && p.status === 'active') return playerDto(p);
      const changed = p.status !== status;
      const sessionsRevoked = await this.revokePlayer(tx, p.id);
      if (changed) await tx.query('UPDATE player.players SET status=$1 WHERE id=$2', [status,p.id]);
      if (changed || sessionsRevoked) await this.audit(tx, p.id, status === 'suspended' ? 'player_suspended' : 'player_reactivated', 'fixture_admin', { reasonCode,sessionsRevoked });
      return playerDto(p);
    });
  }
}
// Fabricated local administrator, matching the earlier prototype. This is NOT
// production authorisation and must never be exposed through an HTTP endpoint.
class FixtureAccountAdministration {
  constructor(accounts, actor) {
    if (!(accounts instanceof PlayerAccounts) || actor !== 'fixture-admin:local') fail('INVALID_CONFIGURATION');
    this.accounts = accounts;
    Object.freeze(this);
  }
  suspendPlayer(id, reasonCode = 'local-test') { return this.accounts._changeStatus(id, 'suspended', reasonCode, this); }
  reactivatePlayer(id, reasonCode = 'local-test') { return this.accounts._changeStatus(id, 'active', reasonCode, this); }
}
module.exports = { PlayerAccounts, FixtureAccountAdministration };
