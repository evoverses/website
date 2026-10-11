// Storage-independent rules, shared by routes and synthetic tests.
export const partSize = 16 * 1024 * 1024;
export const maximumSize = 5 * 1024 * 1024 * 1024;
export const buildIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export type Build = { id:string; version:string; filename:string; size:number; notes:string; createdAt:string; administratorId:string; uploadId:string; ready?:boolean; aborted?:boolean };
export function validateBuild(value:unknown) {
 const v=value as Record<string,unknown>;
 if(!v || Object.keys(v).some(k=>!['version','filename','size','notes'].includes(k)) || typeof v.version!=='string' || !/^[A-Za-z0-9][A-Za-z0-9._ -]{0,63}$/.test(v.version) || typeof v.filename!=='string' || !/^[A-Za-z0-9][A-Za-z0-9._ -]{0,119}\.zip$/i.test(v.filename) || typeof v.size!=='number' || !Number.isSafeInteger(v.size) || v.size<1 || v.size>maximumSize || typeof v.notes!=='string' || v.notes.length>2000) throw Error('INVALID_BUILD');
 return {version:v.version,filename:v.filename,size:v.size,notes:v.notes};
}
export function expectedPart(size:number, part:number) {
 if(!Number.isInteger(part)||part<1||part>Math.ceil(size/partSize))throw Error('INVALID_PART');
 return Math.min(partSize,size-(part-1)*partSize);
}
export function byteRange(value:string|null,size:number):{offset:number;length:number}|null {
 if(!value)return null;
 const m=/^bytes=(\d*)-(\d*)$/.exec(value);
 if(!m||(!m[1]&&!m[2]))throw Error('INVALID_RANGE');
 const start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));
 const end=m[1]?(m[2]?Math.min(Number(m[2]),size-1):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw Error('INVALID_RANGE');
 return {offset:start,length:end-start+1};
}
export function privateHeaders() {return new Headers({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'});}
