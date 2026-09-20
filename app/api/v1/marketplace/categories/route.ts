import { listMarketplaceCategories } from "../../../../../lib/repository";
import { responseError, responseOk } from "../../../../../lib/api";
export async function GET(){try{return responseOk(await listMarketplaceCategories());}catch(error){return responseError(error);}}
