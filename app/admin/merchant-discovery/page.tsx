import { requirePageRole } from "../../../lib/page-auth";
import MerchantDiscoveryClient from "./client";

export const dynamic = "force-dynamic";

export default async function MerchantDiscoveryPage() {
  await requirePageRole(["PLATFORM_ADMIN", "PLATFORM_OPERATIONS"], "/admin/merchant-discovery");
  return <MerchantDiscoveryClient />;
}
