import type { PaymentProvider, PaymentStatus } from "./payments";
export class AuthorizeNetAdapter implements PaymentProvider {
  private unavailable(){return Promise.reject(new Error("AUTHORIZE_NET_CREDENTIALS_NOT_CONFIGURED"));}
  authorize(_input:{amountCents:number;currency:string;reference:string}):Promise<{providerReference:string;status:PaymentStatus}>{return this.unavailable() as Promise<never>;}
  capture():Promise<{status:PaymentStatus}>{return this.unavailable() as Promise<never>;}
  refund():Promise<{status:PaymentStatus}>{return this.unavailable() as Promise<never>;}
  void():Promise<{status:PaymentStatus}>{return this.unavailable() as Promise<never>;}
  status():Promise<{status:PaymentStatus}>{return this.unavailable() as Promise<never>;}
}
