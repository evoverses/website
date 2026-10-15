import { AccessError, permission } from '@/lib/downloads/server';
import { privateHeaders } from '@/lib/downloads/core';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await permission(true, true);
    return Response.json({ masterAdministrator: true }, { headers: privateHeaders() });
  } catch (error) {
    console.warn("nursery_access_denied", { traceId: crypto.randomUUID(), status: error instanceof AccessError ? error.status : 503 });
    return Response.json({ masterAdministrator: false, error: error instanceof AccessError ? error.code : 'SERVICE_UNAVAILABLE' }, {
      status: error instanceof AccessError ? error.status : 503, headers: privateHeaders(),
    });
  }
}
