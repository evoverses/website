import { z } from "zod";
export const monthSchema=z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
const amount=z.string().regex(/^(0|[1-9]\d{0,12})(\.\d{1,18})?$/);
const address=z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable();
const entry=z.object({rank:z.number().int().positive(),name:z.string().min(1).max(80),level:z.number().int().min(1).max(100),xp:z.number().int().nonnegative(),battles:z.number().int().nonnegative(),wins:z.number().int().nonnegative(),losses:z.number().int().nonnegative()}).strict();
export const proBoardSchema=z.object({month:monthSchema,page:z.number().int().nonnegative(),total:z.number().int().nonnegative(),calculatedAt:z.string().datetime(),pool:amount.nullable(),finalized:z.boolean(),entries:z.array(entry).max(50)}).strict();
const payout=z.object({id:z.string().uuid().nullable(),playerId:z.string().uuid(),name:z.string().max(80),rank:z.number().int().min(1).max(3),xp:z.number().int().nonnegative(),wins:z.number().int().nonnegative().nullable(),losses:z.number().int().nonnegative().nullable(),amount,wallet:address,walletLinkId:z.string().uuid().nullable(),paid:z.boolean(),transactionHash:z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable(),paidAt:z.string().datetime().nullable(),version:z.number().int().nonnegative()}).strict();
const flags=z.array(z.object({kind:z.string(),evidence:z.record(z.unknown())}).strict()).max(200);
const entryAdmin=z.object({page:z.number().int().nonnegative().default(0),reserve:amount.default('0'),rollover:amount.default('0'),fee:amount.nullable(),bonus:amount,collected:amount,commission:amount,cancelled:z.boolean(),more:z.boolean(),entrants:z.array(z.object({intentId:z.string().uuid(),name:z.string(),playerId:z.string().uuid(),fee:amount,wallet:address,transactionHash:z.string(),refundHash:z.string().nullable()}).strict()).max(500)}).strict();
export const proAdminSchema=z.object({entry:entryAdmin,flags,month:monthSchema,pool:amount.nullable(),version:z.number().int().nonnegative(),finalized:z.boolean(),previewHash:z.string().regex(/^[a-f0-9]{64}$/),winners:z.array(payout).max(1000),audit:z.array(z.object({id:z.string().uuid(),administratorId:z.string().uuid(),administratorName:z.string().max(80).nullable().default(null),action:z.enum(['set_pool','finalize','payment','publish_fee','bonus','cancel','refund','rollover']),details:z.record(z.unknown()),createdAt:z.string().datetime()}).strict()).max(50)}).strict();
const common={requestId:z.string().uuid(),month:monthSchema,expectedVersion:z.number().int().nonnegative()};
export const proRequest=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('list'),input:z.object({month:monthSchema,entryPage:z.number().int().min(0).max(100000).optional()}).strict()}).strict(),
 z.object({operation:z.literal('change'),input:z.discriminatedUnion('action',[
  z.object({...common,action:z.enum(['set_pool','publish_fee','bonus']),amount}).strict(),
  z.object({...common,action:z.literal('rollover'),targetMonth:monthSchema,amount,reason:z.string().trim().min(1).max(200)}).strict(),
  z.object({...common,action:z.literal('cancel'),reason:z.string().trim().min(1).max(200)}).strict(),
  z.object({...common,action:z.literal('refund'),intentId:z.string().uuid(),transactionHash:z.string().regex(/^0x[a-f0-9]{64}$/),reason:z.string().trim().min(1).max(200)}).strict(),
  z.object({...common,action:z.literal('finalize'),previewHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
  z.object({...common,action:z.literal('payment'),payoutId:z.string().uuid(),paid:z.boolean(),transactionHash:z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable(),reason:z.string().trim().min(1).max(200)}).strict(),
 ])}).strict(),
]);
export const proSavedSchema=z.object({saved:z.literal(true),month:monthSchema}).strict();
export type ProAdmin=z.infer<typeof proAdminSchema>;
export type ProChange=Extract<z.infer<typeof proRequest>,{operation:'change'}>['input'];

export const proEntryStatus=z.object({month:monthSchema,enabled:z.boolean(),opensAt:z.string().datetime(),closesAt:z.string().datetime(),feeUnits:z.string().regex(/^\d+$/).nullable(),cancelled:z.boolean(),enrolled:z.boolean(),intentId:z.string().uuid().nullable(),transactionHash:z.string().nullable(),chainId:z.literal(43114),token:z.string(),treasury:z.string()}).strict();
export const proEntryRequest=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('status'),input:z.object({month:monthSchema}).strict()}).strict(),
 z.object({operation:z.literal('intent'),input:z.object({month:monthSchema,address:z.string().regex(/^0x[a-fA-F0-9]{40}$/)}).strict()}).strict(),
 z.object({operation:z.literal('verify'),input:z.object({intentId:z.string().uuid(),transactionHash:z.string().regex(/^0x[a-fA-F0-9]{64}$/)}).strict()}).strict(),
]);

export const proEntryIntent=z.object({intentId:z.string().uuid()}).strict();
export const proEntryVerified=z.object({enrolled:z.literal(true)}).strict();
