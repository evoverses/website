import { AccessError, bucket, permission } from '@/lib/downloads/server';
import { privateHeaders } from '@/lib/downloads/core';
import { getPlayerWebOrigin } from '@/lib/player/server';
import { reconcileVrf } from '@/lib/nursery/vrf-audit';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: privateHeaders() });
  try {
    if (request.headers.get('origin') !== getPlayerWebOrigin() || new URL(request.url).origin !== getPlayerWebOrigin()) throw new AccessError(403, 'ORIGIN_NOT_ALLOWED');
    await permission(true, true);
    const url = new URL(request.url), keeper = url.searchParams.get('keeper'), id = url.searchParams.get('id');
    if ((keeper !== 'bertha' && keeper !== 'hermann') || !id || !/^[1-9][0-9]{0,77}$/.test(id) || BigInt(id) >= 2n ** 256n) throw new AccessError(400, 'INVALID_REQUEST');
    return reply(await reconcileVrf(await bucket(), keeper, id));
  } catch (error) {
    const code = error instanceof AccessError ? error.code : 'VRF_AUDIT_UNAVAILABLE';
    console.warn('nursery_vrf_reconcile', { code });
    return reply({ error: code }, error instanceof AccessError ? error.status : 503);
  }
}
