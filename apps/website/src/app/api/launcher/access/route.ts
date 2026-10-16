import { AccessError, permission } from '@/lib/downloads/server';
import { privateHeaders } from '@/lib/downloads/core';
export const dynamic = 'force-dynamic';
export async function GET() {
 try { const id = await permission(true, true); return Response.json({ id }, { headers: privateHeaders() }); }
 catch (error) { return Response.json({ error: error instanceof AccessError ? error.code : 'SERVICE_UNAVAILABLE' }, { status: error instanceof AccessError ? error.status : 503, headers: privateHeaders() }); }
}
