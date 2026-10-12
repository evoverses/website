import { z } from "zod";
const item=z.object({productId:z.enum(["vital_dew","evo_pack_2","evo_pack_4","evo_pack_6"]),revision:z.number().int().positive(),quantity:z.number().int().min(1).max(3)}).strict();
const winner=z.object({name:z.string().max(80),xp:z.number().int().nonnegative(),wins:z.number().int().positive().optional(),losses:z.number().int().nonnegative().optional(),battles:z.number().int().positive(),place:z.number().int().min(1).max(3),items:z.array(item).max(2),badge:z.enum(["gold","silver","bronze"]).nullable()}).strict();
const periodFields={id:z.string().uuid(),period:z.enum(["day","week","month"]),start:z.string().datetime(),end:z.string().datetime(),status:z.enum(["review","awarded","withheld"]),policyVersion:z.string().max(80),decidedAt:z.string().datetime().nullable()};
const publicPeriod=z.object({...periodFields,winners:z.array(winner)}).strict();
const adminPeriod=z.object({...periodFields,previewHash:z.string().regex(/^[a-f0-9]{64}$/),reason:z.string().nullable(),decidedBy:z.string().uuid().nullable(),winners:z.array(winner.extend({playerId:z.string().uuid()}))}).strict();
export const archiveSchema=z.object({page:z.number().int().nonnegative(),more:z.boolean(),periods:z.array(publicPeriod).max(20)}).strict();
export const adminRewardsSchema=z.object({flags:z.array(z.object({kind:z.string(),evidence:z.record(z.unknown())}).strict()).max(200).optional(),page:z.number().int().nonnegative(),more:z.boolean(),periods:z.array(adminPeriod).max(20)}).strict();
export const personalRewardsSchema=z.object({badges:z.array(z.object({medal:z.enum(["gold","silver","bronze"]),month:z.string().regex(/^\d{4}-\d{2}$/)}).strict()),rewards:z.array(publicPeriod).max(50)}).strict();
const decision={periodId:z.string().uuid(),previewHash:z.string().regex(/^[a-f0-9]{64}$/)};
export const rewardRequest=z.discriminatedUnion("operation",[
 z.object({operation:z.literal("list"),input:z.object({page:z.number().int().min(0).max(100000).optional()}).strict()}).strict(),
 z.object({operation:z.literal("prepare"),input:z.object({}).strict()}).strict(),
 z.object({operation:z.literal("approve"),input:z.object(decision).strict()}).strict(),
 z.object({operation:z.literal("withhold"),input:z.object({...decision,reason:z.string().trim().min(1).max(200).regex(/^[^\x00-\x1f\x7f]+$/)}).strict()}).strict(),
]);
export const decisionSchema=z.object({status:z.enum(["awarded","withheld","preview_changed"]),period:adminPeriod}).strict();
export const preparedSchema=z.object({prepared:z.object({week:z.number().int().min(0).max(20),month:z.number().int().min(0).max(20)}).strict()}).strict();
export type RewardPeriod=z.infer<typeof adminPeriod>;
export type AdminRewards=z.infer<typeof adminRewardsSchema>;
export type PersonalRewards=z.infer<typeof personalRewardsSchema>;
const itemNames:Record<string,string>={vital_dew:"Vital Dew",evo_pack_2:"2-Evo pack",evo_pack_4:"4-Evo pack",evo_pack_6:"6-Evo pack"};
export const rewardItemName=(id:string)=>itemNames[id]??id;
