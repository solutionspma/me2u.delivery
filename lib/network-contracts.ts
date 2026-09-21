export type NetworkSource="BRANDS"|"ROUTE"|"HAUL"|"GORUNIT";
export type NetworkMapping={sourceProduct:NetworkSource;sourceType:string;sourceId:string;me2uType:string;me2uId:string;contractVersion:"v1";metadata:Record<string,unknown>};
export const networkContract={version:"v1",products:{BRANDS:"brand",ROUTE:"route",HAUL:"haul",GORUNIT:"mobility"},rules:["No direct cross-application database access","Mappings are tenant scoped","Source systems remain authoritative"]} as const;
