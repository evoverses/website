import { byteRange, partSize, expectedPart, privateHeaders } from "./core";
import type { Bucket } from "./server";

type Environment = { GAME_BUILDS?: Bucket; EVOVERSES_UPDATER_PUBLIC_KEY?: string; EVOVERSES_WEB_ORIGIN?: string };
type Context = { waitUntil(promise: Promise<unknown>): void };
type NextWorker = { fetch(request: Request, env: Environment, ctx: Context): Promise<Response> };
type Entry = { path: string; size: number; sha256: string; url: string };
type Manifest = { schema: number; launcherProtocol: number; readyProtocol: number; release: string; sourceCommit: string; files: Entry[] };
type Envelope = { payload: string; signature: string };
type Setup = { filename: string; size: number; sha256: string };
type Draft = { envelope: Envelope; manifest: Manifest; installer: Setup; administratorId: string };
const hex = /^[a-f0-9]{64}$/, releaseId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const base = "/api/launcher/", prefix = "launcher/", pointerKey = prefix + "published.json";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: privateHeaders() });
class Failure extends Error { constructor(public status: number, public code: string) { super(code); } }
function requireValue(value: unknown, status = 400, code = "INVALID_REQUEST"): asserts value { if (!value) throw new Failure(status, code); }
const digest = async (data: BufferSource) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data))).map(v => v.toString(16).padStart(2, "0")).join("");
const decode = (s: string) => Uint8Array.from(atob(s), v => v.charCodeAt(0));
const b64url = (s: string) => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function browserToken(request: Request) {
 const values = (request.headers.get("cookie") || "").split(";").map(v => v.trim()).filter(v => v.startsWith("ev:player-session="));
 const value = values.length === 1 ? values[0]!.slice("ev:player-session=".length) : "";
 return hex.test(value) ? value : null;
}
async function bounded(request: Request, limit: number) {
 requireValue(Number(request.headers.get("content-length") || 0) <= limit, 413, "UPLOAD_TOO_LARGE");
 const reader = request.body?.getReader(); requireValue(reader);
 const chunks: Uint8Array[] = []; let size = 0;
 try { while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > limit) { await reader.cancel(); throw new Failure(413, "UPLOAD_TOO_LARGE"); } chunks.push(item.value); } } finally { reader.releaseLock(); }
 const result = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; } return result;
}
async function input(request: Request, limit = 4096) { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await bounded(request, limit))); }
export async function verifyEnvelope(value: unknown, publicXml: string | undefined): Promise<{ envelope: Envelope; manifest: Manifest }> {
 requireValue(publicXml, 503, "UPDATE_TRUST_NOT_CONFIGURED");
 const key = /^<RSAKeyValue>\s*<Modulus>([A-Za-z0-9+/=]+)<\/Modulus>\s*<Exponent>([A-Za-z0-9+/=]+)<\/Exponent>\s*<\/RSAKeyValue>$/.exec(publicXml.trim());
 requireValue(key && decode(key[1]!).length >= 384, 503, "UPDATE_TRUST_NOT_CONFIGURED");
 const envelope = value as Envelope;
 requireValue(envelope && typeof envelope.payload === "string" && envelope.payload.length <= 3 * 1024 * 1024 && typeof envelope.signature === "string" && envelope.signature.length <= 2048);
 const publicKey = await crypto.subtle.importKey("jwk", { kty: "RSA", n: b64url(key[1]!), e: b64url(key[2]!), alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
 const payload = decode(envelope.payload);
 requireValue(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, decode(envelope.signature), payload), 400, "INVALID_RELEASE_SIGNATURE");
 const manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(payload)) as Manifest;
 requireValue(manifest.schema === 1 && manifest.launcherProtocol === 1 && manifest.readyProtocol === 1 && releaseId.test(manifest.release) && /^[a-f0-9]{40}$/.test(manifest.sourceCommit) && Array.isArray(manifest.files) && manifest.files.length > 0 && manifest.files.length <= 20000);
 const paths = new Set<string>(); let total = 0;
 for (const f of manifest.files) {
  requireValue(f && typeof f.path === "string" && f.path.length < 240 && !/[\\:<>"|?*]/.test(f.path) && !Array.from(f.path).some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127) && f.path.split("/").every(p => p && p !== "." && p !== ".." && !/[. ]$/.test(p) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p)));
  const path = f.path.toLowerCase(); requireValue(!paths.has(path)); paths.add(path);
  requireValue(Number.isSafeInteger(f.size) && f.size >= 0 && f.size <= 5 * 1024 ** 3 && hex.test(f.sha256) && f.url === "files/" + f.sha256); total += f.size;
 }
 requireValue(total <= 10 * 1024 ** 3 && paths.has("evoverses/binaries/win64/evoverses.exe") && paths.has("launcher/evoversesupdater.exe"));
 return { envelope: { payload: envelope.payload, signature: envelope.signature }, manifest };
}
function html(body: string, status = 200, script = false) {
 const headers = privateHeaders(); headers.set("Content-Type", "text/html; charset=utf-8");
 headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" + (script ? "; script-src 'unsafe-inline'; connect-src 'self'" : ""));
 return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Evoverses Beta Launcher</title><style>body{background:#251838;color:white;font:17px system-ui;max-width:650px;margin:10vh auto;padding:24px}button,a{color:white}button{background:#661cb8;border:0;border-radius:8px;padding:14px;font:inherit;cursor:pointer}a{display:inline-block;margin:12px 0}input{display:block;margin:18px 0}progress{width:100%}pre{white-space:pre-wrap}</style><main><h1>Evoverses Beta Launcher</h1>' + body + '</main></html>', { status, headers });
}
const adminPage = `<p>Select the prepared release's <b>Upload</b> folder. Files are verified before publication. Uploading alone does not change the version offered to players.</p><input id="files" type="file" webkitdirectory multiple><button id="upload">Upload release</button> <button id="publish" disabled>Publish this release</button><progress id="progress" max="100" value="0"></progress><pre id="status" role="status"></pre><script>
const status=document.getElementById('status'),progress=document.getElementById('progress'),upload=document.getElementById('upload'),publish=document.getElementById('publish');let selected=null,expected=null;
async function call(action,data,hash,part){const url='/api/launcher/admin?action='+action+(selected?'&release='+encodeURIComponent(selected.manifest.release):'')+(hash?'&hash='+hash:'')+(part?'&part='+part:'');for(let attempt=0;attempt<4;attempt++){const response=await fetch(url,{method:'POST',headers:data instanceof Blob?{}:{'Content-Type':'application/json'},body:data instanceof Blob?data:JSON.stringify(data)});if([429,503].includes(response.status)&&attempt<3){await new Promise(r=>setTimeout(r,1500*(attempt+1)));continue;}const value=await response.json();if(!response.ok)throw Error(value.error||'Request failed');return value;}}
upload.onclick=async()=>{upload.disabled=true;publish.disabled=true;try{const files=[...document.getElementById('files').files],get=name=>files.find(f=>f.webkitRelativePath.endsWith('/'+name));const manifestFile=get('latest.json'),installerFile=get('installer.json');if(!manifestFile||!installerFile)throw Error('Choose the Upload folder prepared with this installer.');const envelope=JSON.parse(await manifestFile.text()),installer=JSON.parse(await installerFile.text()),manifest=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(envelope.payload),c=>c.charCodeAt(0))));selected={manifest};const state=await fetch('/api/launcher/admin').then(async r=>{if(!r.ok)throw Error('Administrator sign-in required');return r.json()});expected=state.publishedRelease;await call('begin',{envelope,installer});const specs=[...new Map([...manifest.files,{sha256:installer.sha256,size:installer.size}].map(f=>[f.sha256,f])).values()];const total=specs.reduce((n,f)=>n+f.size,0);let done=0;for(const spec of specs){const file=get('files/'+spec.sha256);if(!file||file.size!==spec.size)throw Error('Missing release file '+spec.sha256);status.textContent='Uploading '+manifest.release+' — '+Math.floor(done/1048576)+' / '+Math.ceil(total/1048576)+' MB';if(spec.size<=16777216)await call('file',file,spec.sha256);else{const started=await call('start',{},spec.sha256);if(!started.complete){for(let n=1;n<=Math.ceil(spec.size/16777216);n++){await call('part',file.slice((n-1)*16777216,Math.min(n*16777216,spec.size)),spec.sha256,n);progress.value=100*(done+Math.min(n*16777216,spec.size))/total;}await call('complete',{},spec.sha256);}}done+=spec.size;progress.value=100*done/total;}status.textContent='Upload verified. Ready to publish '+manifest.release+'.';publish.disabled=false;}catch(error){status.textContent=error.message;}finally{upload.disabled=false;}};
publish.onclick=async()=>{if(!selected||!confirm('Publish '+selected.manifest.release+' to beta players?'))return;publish.disabled=true;try{await call('publish',{expectedPublishedRelease:expected});status.textContent='Published '+selected.manifest.release+'. Players can download the installer and receive updates.';expected=selected.manifest.release;}catch(error){status.textContent=error.message;publish.disabled=false;}};
</script>`;

export function createLauncherWorker(next: NextWorker): NextWorker {
 return { async fetch(request, env, ctx) {
  const url = new URL(request.url); if (!url.pathname.startsWith(base)) return next.fetch(request, env, ctx);
  // This administrator Next route is also reachable directly but returns only status/identity,
  // never cookies or account credentials. It preserves existing account-service rules.
  if (url.pathname === base + "access") return next.fetch(request, env, ctx);
  try {
   const b = env.GAME_BUILDS; requireValue(b, 503, "STORAGE_UNAVAILABLE");
   async function authorize(token: string | null, admin = false) {
    const headers = new Headers(); if (token) headers.set("cookie", "ev:player-session=" + token);
    const check = await next.fetch(new Request(url.origin + base + "access" + (admin ? "?admin=1" : ""), { headers }), env, ctx);
    if (check.status !== 200) { await check.body?.cancel(); throw new Failure([401,403,429].includes(check.status) ? check.status : 503, check.status === 401 ? "SIGN_IN_REQUIRED" : check.status === 403 ? "BETA_APPROVAL_REQUIRED" : "SERVICE_UNAVAILABLE"); }
    const value = await check.json() as { id: string }; requireValue(value.id, 503, "SERVICE_UNAVAILABLE"); return value.id;
   }
   function origin() { requireValue(request.headers.get("origin") === url.origin && ["https://beta.evoverses.com", "https://evoverses.com"].includes(env.EVOVERSES_WEB_ORIGIN ?? "https://beta.evoverses.com") && url.origin === (env.EVOVERSES_WEB_ORIGIN ?? "https://beta.evoverses.com"), 403, "ORIGIN_NOT_ALLOWED"); }
   if (url.pathname === base + "admin") {
    const administratorId = await authorize(browserToken(request), true);
    const current = await b.get(pointerKey), pointer = current ? await current.json<{ release: string; installer: Setup }>() : null;
    if (request.method === "GET") return request.headers.get("accept")?.includes("text/html") ? html(adminPage, 200, true) : json({ publishedRelease: pointer?.release || null });
    requireValue(request.method === "POST", 405, "METHOD_NOT_ALLOWED"); origin();
    const action = url.searchParams.get("action");
    if (action === "begin") {
     const value = await input(request, 4 * 1024 * 1024), verified = await verifyEnvelope(value.envelope, env.EVOVERSES_UPDATER_PUBLIC_KEY), installer = value.installer as Setup;
     requireValue(installer && /^(?:Evoverses_Beta_Launcher|Evoverses Beta Launcher|(?:EvoVersesSetup|EvoversesBetaLauncher-Setup)-[A-Za-z0-9_-]+)\.exe$/.test(installer.filename) && Number.isSafeInteger(installer.size) && installer.size > 0 && installer.size <= 5 * 1024 ** 3 && hex.test(installer.sha256));
     const key = prefix + "drafts/" + verified.manifest.release + ".json", prior = await b.get(key);
     if (prior) { const old = await prior.json<Draft>(); requireValue(old.envelope.payload === verified.envelope.payload && JSON.stringify(old.installer) === JSON.stringify(installer), 409, "RELEASE_CHANGED"); }
     else { const created = await b.put(key, JSON.stringify({ ...verified, installer, administratorId }), { onlyIf: { etagDoesNotMatch: "*" } }); requireValue(created, 409, "RELEASE_CHANGED"); }
     return json({ ready: true });
    }
    const release = url.searchParams.get("release") || ""; requireValue(releaseId.test(release));
    const object = await b.get(prefix + "drafts/" + release + ".json"); requireValue(object, 404, "RELEASE_NOT_FOUND"); const draft = await object.json<Draft>();
    if (action === "publish") {
     const value = await input(request); requireValue(typeof value.expectedPublishedRelease === "string" || value.expectedPublishedRelease === null);
     requireValue((pointer?.release || null) === value.expectedPublishedRelease, 409, "PUBLICATION_CHANGED");
     await verifyEnvelope(draft.envelope, env.EVOVERSES_UPDATER_PUBLIC_KEY);
     const specs = [...new Map([...draft.manifest.files, draft.installer].map(f => [f.sha256, f])).values()];
     for (const file of specs) { const ready = await b.get(prefix + "verified/" + file.sha256 + ".json"), blob = await b.head(prefix + "files/" + file.sha256); requireValue(ready && blob && blob.size === file.size, 409, "UPLOAD_INCOMPLETE"); const receipt = await ready.json<{ etag: string }>(); requireValue(blob.etag === receipt.etag, 409, "FILE_CHANGED"); }
     const priorManifest = await b.get(prefix + "releases/" + release + ".json");
     if (priorManifest) requireValue((await priorManifest.json<Envelope>()).payload === draft.envelope.payload, 409, "RELEASE_CHANGED");
     else await b.put(prefix + "releases/" + release + ".json", JSON.stringify(draft.envelope), { onlyIf: { etagDoesNotMatch: "*" } });
     // Files are reachable only after an explicit publication. Store identity/size/ETag.
     for (const file of specs) { const blob = await b.head(prefix + "files/" + file.sha256); const allowed = prefix + "released-files/" + file.sha256 + ".json"; if (!await b.head(allowed)) await b.put(allowed, JSON.stringify({ size: file.size, etag: blob!.etag }), { onlyIf: { etagDoesNotMatch: "*" } }); }
     const saved = await b.put(pointerKey, JSON.stringify({ release, installer: draft.installer, administratorId, publishedAt: new Date().toISOString() }), { onlyIf: current ? { etagMatches: current.etag } : { etagDoesNotMatch: "*" } }); requireValue(saved, 409, "PUBLICATION_CHANGED");
     await b.put(prefix + "audit/" + crypto.randomUUID() + ".json", JSON.stringify({ release, previous: pointer?.release || null, administratorId, at: new Date().toISOString() })); return json({ publishedRelease: release });
    }
    const hash = url.searchParams.get("hash") || ""; requireValue(hex.test(hash));
    const file = [...draft.manifest.files, draft.installer].find(f => f.sha256 === hash); requireValue(file);
    const blobKey = prefix + "files/" + hash, receiptKey = prefix + "verified/" + hash + ".json";
    const existing = await b.head(blobKey), verified = await b.get(receiptKey);
    if (existing && verified && (await verified.json<{ etag: string }>()).etag === existing.etag && existing.size === file.size) return json({ complete: true });
    if (action === "file") {
     requireValue(file.size <= partSize); const data = await bounded(request, partSize); requireValue(data.byteLength === file.size && await digest(data) === hash, 400, "FILE_HASH_MISMATCH");
     const saved = await b.put(blobKey, data.buffer as ArrayBuffer, { onlyIf: { etagDoesNotMatch: "*" } }); requireValue(saved, 409, "FILE_CHANGED");
     await b.put(receiptKey, JSON.stringify({ etag: saved.etag })); return json({ complete: true });
    }
    requireValue(file.size > partSize);
    const uploadKey = prefix + "uploads/" + release + "/" + hash + ".json", prior = await b.get(uploadKey);
    if (action === "start") {
     if (!prior) { const upload = await b.createMultipartUpload(blobKey); const claimed = await b.put(uploadKey, JSON.stringify({ uploadId: upload.uploadId }), { onlyIf: { etagDoesNotMatch: "*" } }); if (!claimed) await b.resumeMultipartUpload(blobKey, upload.uploadId).abort(); }
     return json({ started: true });
    }
    requireValue(prior, 409, "UPLOAD_NOT_STARTED"); const { uploadId } = await prior.json<{ uploadId: string }>(), upload = b.resumeMultipartUpload(blobKey, uploadId);
    if (action === "part") {
     const n = Number(url.searchParams.get("part")), size = expectedPart(file.size, n), data = await bounded(request, partSize); requireValue(data.byteLength === size, 400, "INVALID_PART_SIZE");
     const sha = await digest(data), key = prefix + "parts/" + release + "/" + hash + "/" + n + ".json", old = await b.get(key);
     if (old) requireValue((await old.json<{ digest: string }>()).digest === sha, 409, "PART_CHANGED");
     else { const part = await upload.uploadPart(n, data.buffer as ArrayBuffer); const recorded = await b.put(key, JSON.stringify({ ...part, digest: sha }), { onlyIf: { etagDoesNotMatch: "*" } }); requireValue(recorded, 409, "PART_CHANGED"); }
     return json({ part: n });
    }
    requireValue(action === "complete", 400, "INVALID_ACTION");
    // Serialise finalisation with a per-file lease to protect already published blobs.
    const leaseKey = prefix + "leases/" + hash + ".json", oldLease = await b.get(leaseKey);
    requireValue(!oldLease || (await oldLease.json<{ expiresAt: number }>()).expiresAt < Date.now(), 409, "UPLOAD_BUSY");
    const lease = await b.put(leaseKey, JSON.stringify({ expiresAt: Date.now() + 120000 }), { onlyIf: oldLease ? { etagMatches: oldLease.etag } : { etagDoesNotMatch: "*" } }); requireValue(lease, 409, "UPLOAD_BUSY");
    try {
     const parts = []; for (let n = 1; n <= Math.ceil(file.size / partSize); n++) { const part = await b.get(prefix + "parts/" + release + "/" + hash + "/" + n + ".json"); requireValue(part, 409, "UPLOAD_INCOMPLETE"); const receipt = await part.json<{ partNumber: number; etag: string }>(); parts.push({ partNumber: receipt.partNumber, etag: receipt.etag }); }
     let blob = await b.head(blobKey); if (!blob) blob = await upload.complete(parts);
     requireValue(blob.size === file.size, 409, "FILE_SIZE_MISMATCH");
     const object = await b.get(blobKey); requireValue(object, 409, "UPLOAD_INCOMPLETE");
     const Crypto = crypto as unknown as { DigestStream: new (algorithm: string) => WritableStream<Uint8Array> & { digest: Promise<ArrayBuffer> } };
     const stream = new Crypto.DigestStream("SHA-256"); await object.body.pipeTo(stream); const actual = Array.from(new Uint8Array(await stream.digest)).map(v => v.toString(16).padStart(2, "0")).join("");
     if (actual !== hash) { await b.delete([blobKey, uploadKey, ...parts.map(part => prefix + "parts/" + release + "/" + hash + "/" + part.partNumber + ".json")]); throw new Failure(400, "FILE_HASH_MISMATCH"); }
     await b.put(receiptKey, JSON.stringify({ etag: blob.etag })); return json({ complete: true });
    } finally { await new Promise(resolve => setTimeout(resolve, 1100)); await b.put(leaseKey, JSON.stringify({ expiresAt: 0 }), { onlyIf: { etagMatches: lease.etag } }); }
   }
   requireValue(["GET", "HEAD"].includes(request.method), 405, "METHOD_NOT_ALLOWED");
   if (url.pathname === base + "latest.json") {
    const current = await b.get(pointerKey); requireValue(current, 404, "NO_UPDATE_PUBLISHED"); const { release } = await current.json<{ release: string }>(); requireValue(releaseId.test(release), 503, "INVALID_PUBLICATION");
    const envelope = await b.get(prefix + "releases/" + release + ".json"); requireValue(envelope, 503, "INVALID_PUBLICATION"); const text = JSON.stringify(await envelope.json<Envelope>()); const headers = privateHeaders(); headers.set("Content-Type", "application/json"); headers.set("Content-Length", String(new TextEncoder().encode(text).length)); return new Response(request.method === "HEAD" ? null : text, { headers });
   }
   let hash = url.pathname.slice((base + "files/").length), filename: string | null = null;
   if (url.pathname === base + "setup") { const current = await b.get(pointerKey); requireValue(current, 404, "NO_UPDATE_PUBLISHED"); const pointer = await current.json<{ installer: Setup }>(); hash = pointer.installer.sha256; filename = pointer.installer.filename; }
   else requireValue(url.pathname.startsWith(base + "files/"), 404, "NOT_FOUND");
   requireValue(hex.test(hash), 404, "NOT_FOUND"); const released = await b.get(prefix + "released-files/" + hash + ".json"); requireValue(released, 404, "NOT_PUBLISHED");
   const record = await released.json<{ size: number; etag: string }>(), meta = await b.head(prefix + "files/" + hash); requireValue(meta && meta.size === record.size && meta.etag === record.etag, 503, "FILE_CHANGED");
   const headers = privateHeaders(); headers.set("Content-Type", "application/octet-stream"); headers.set("Accept-Ranges", "bytes"); headers.set("ETag", meta.httpEtag); headers.set("Cache-Control", "private, no-store, no-transform"); if (filename) headers.set("Content-Disposition", 'attachment; filename="' + filename.replace(/[^A-Za-z0-9_.-]/g, "_") + '"');
   let range = null; try { range = request.headers.has("if-range") && request.headers.get("if-range") !== meta.httpEtag ? null : byteRange(request.headers.get("range"), meta.size); } catch { headers.set("Content-Range", "bytes */" + meta.size); return new Response(null, { status: 416, headers }); }
   const length = range?.length ?? meta.size, status = range ? 206 : 200; headers.set("Content-Length", String(length)); if (range) headers.set("Content-Range", `bytes ${range.offset}-${range.offset + length - 1}/${meta.size}`);
   if (request.method === "HEAD" || length === 0) return new Response(request.method === "HEAD" ? null : new Uint8Array(), { status, headers });
   const object = await b.get(prefix + "files/" + hash, range ? { range } : undefined); requireValue(object && object.etag === meta.etag && object.size === meta.size, 503, "FILE_CHANGED");
   const Native = globalThis as unknown as { FixedLengthStream: new (length: number) => { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> } };
   const stream = new Native.FixedLengthStream(length); ctx.waitUntil(object.body.pipeTo(stream.writable).catch(() => { console.error("Launcher download interrupted"); })); return new Response(stream.readable, { status, headers });
  } catch (e) { if (e instanceof Failure) return json({ error: e.code }, e.status); if (e instanceof SyntaxError || e instanceof TypeError || e instanceof DOMException || e instanceof Error && e.message === "INVALID_PART") return json({ error: "INVALID_REQUEST" }, 400); return json({ error: "SERVICE_UNAVAILABLE" }, 503); }
 } };
}
