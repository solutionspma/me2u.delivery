import { db } from "./db";
export type NotificationChannel="SMS"|"EMAIL"|"PUSH";
export interface NotificationProvider { send(input:{channel:NotificationChannel;destination:string;eventType:string;payload:Record<string,unknown>}):Promise<void>; }
export class DevelopmentNotificationProvider implements NotificationProvider { async send():Promise<void> { return; } }
export async function recordNotification(input:{tenantId:string;deliveryId?:string;eventType:string;channel:NotificationChannel;payload:Record<string,unknown>}) { await db().query("INSERT INTO notification_event(tenant_id,delivery_id,channel,event_type,payload) VALUES($1,$2,$3,$4,$5)",[input.tenantId,input.deliveryId ?? null,input.channel,input.eventType,JSON.stringify(input.payload)]); }
