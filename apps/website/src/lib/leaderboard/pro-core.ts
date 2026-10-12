import { z } from "zod";
export const monthSchema=z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/);
const amount=z.string().regex(/^(0|[1-9]\d{0,12})(\.\d{1,18})?$/);
const address=z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable();
const entry=z.object({rank:z.number().int().positive(),name:z.string().min(1).max(80),level:z.number().int().min(1).max(100),xp:z.number().int().nonnegative(),battles:z.number().int().nonnegative(),wins:z.number().int().nonnegative(),losses:z.number().int().nonnegative()}).strict();
export const proBoardSchema=z.object({month:monthSchema,page:z.number().int().nonnegative(),total:z.number().int().nonnegative(),calculatedAt:z.string().datetime(),pool:amount.nullable(),finalized:z.boolean(),entries:z.array(entry).max(50)}).strict();
const payout=z.object({id:z.string().uuid().nullable(),playerId:z.string().uuid(),name:z.string().max(80),rank:z.number().int().min(1).max(3),xp:z.number().int().positive(),amount,wallet:address,walletLinkId:z.string().uuid().nullable(),paid:z.boolean(),transactionHash:z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable(),paidAt:z.string().datetime().nullable(),version:z.number().int().nonnegative()}).strict();
export const proAdminSchema=z.object({month:monthSchema,pool:amount.nullable(),version:z.number().int().nonnegative(),finalized:z.boolean(),previewHash:z.string().regex(/^[a-f0-9]{64}$/),winners:z.array(payout).max(1000),audit:z.array(z.object({id:z.string().uuid(),administratorId:z.string().uuid(),action:z.enum(['set_pool','finalize','payment']),details:z.record(z.unknown()),createdAt:z.string().datetime()}).strict()).max(50)}).strict();
const common={requestId:z.string().uuid(),month:monthSchema,expectedVersion:z.number().int().nonnegative()};
export const proRequest=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('list'),input:z.object({month:monthSchema}).strict()}).strict(),
 z.object({operation:z.literal('change'),input:z.discriminatedUnion('action',[
  z.object({...common,action:z.literal('set_pool'),amount}).strict(),
  z.object({...common,action:z.literal('finalize'),previewHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
  z.object({...common,action:z.literal('payment'),payoutId:z.string().uuid(),paid:z.boolean(),transactionHash:z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable(),reason:z.string().trim().min(1).max(200)}).strict(),
 ])}).strict(),
]);
export const proSavedSchema=z.object({saved:z.literal(true),month:monthSchema}).strict();
export type ProAdmin=z.infer<typeof proAdminSchema>;
export type ProChange=Extract<z.infer<typeof proRequest>,{operation:'change'}>['input'];
