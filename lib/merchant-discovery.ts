import { ApiError } from "./api";

export type DiscoveredBusiness = {
  displayName: string; normalizedName: string; phone?: string; website?: string;
  address: Record<string, unknown>; latitude?: number; longitude?: number; category?: string;
  provider: string; sourceRecordId: string; sourceUrl?: string; raw: Record<string, unknown>; confidence: number;
};

export interface MerchantDiscoveryProvider {
  name: string;
  searchBusinesses(query: string): Promise<DiscoveredBusiness[]>;
  getBusinessDetails(sourceRecordId: string): Promise<DiscoveredBusiness | null>;
  searchNearby(latitude: number, longitude: number, query?: string): Promise<DiscoveredBusiness[]>;
  resolveLocation(query: string): Promise<DiscoveredBusiness | null>;
  findPossibleRelatedLocations(candidate: DiscoveredBusiness): Promise<DiscoveredBusiness[]>;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

function mapboxAddress(feature: { place_name?: string; center?: [number, number]; properties?: Record<string, unknown>; context?: Array<{ id: string; text: string }> }): Record<string, unknown> {
  const address = (feature.context ?? []).reduce<Record<string, unknown>>((result, item) => {
    if (item.id.startsWith("address")) result.addressLine1 = item.text;
    if (item.id.startsWith("place") || item.id.startsWith("locality")) result.city = item.text;
    if (item.id.startsWith("region")) result.state = item.text;
    if (item.id.startsWith("postcode")) result.postalCode = item.text;
    if (item.id.startsWith("country")) result.country = item.text;
    return result;
  }, {});
  if (feature.place_name) address.formatted = feature.place_name;
  if (feature.properties?.address) address.addressLine1 = feature.properties.address;
  return address;
}

export class MapboxDiscoveryProvider implements MerchantDiscoveryProvider {
  name = "MAPBOX";
  private token = process.env.MAPBOX_ACCESS_TOKEN;
  private endpoint = process.env.GEOCODING_PROVIDER_URL ?? "https://api.mapbox.com/geocoding/v5/mapbox.places";
  private async request(query: string): Promise<DiscoveredBusiness[]> {
    if (!this.token) throw new ApiError("DISCOVERY_PROVIDER_NOT_CONFIGURED", 503);
    const response = await fetch(`${this.endpoint}/${encodeURIComponent(query)}.json?autocomplete=true&limit=10&types=poi,address,place&access_token=${encodeURIComponent(this.token)}`, { cache: "no-store" });
    if (!response.ok) throw new ApiError("DISCOVERY_PROVIDER_UNAVAILABLE", 503);
    const body = await response.json() as { features?: Array<{ id: string; text?: string; place_name?: string; center?: [number, number]; properties?: Record<string, unknown>; context?: Array<{ id: string; text: string }> }> };
    return (body.features ?? []).map((feature) => {
      const displayName = feature.text ?? feature.place_name ?? query;
      return { displayName, normalizedName: normalize(displayName), address: mapboxAddress(feature), latitude: feature.center?.[1], longitude: feature.center?.[0], category: typeof feature.properties?.category === "string" ? feature.properties.category : undefined, provider: this.name, sourceRecordId: feature.id, raw: feature as unknown as Record<string, unknown>, confidence: 0.75 };
    });
  }
  searchBusinesses(query: string) { return this.request(query); }
  async getBusinessDetails(sourceRecordId: string) { return (await this.request(sourceRecordId)).find((item) => item.sourceRecordId === sourceRecordId) ?? null; }
  searchNearby(latitude: number, longitude: number, query?: string) { return this.request(`${query ?? "business"} near ${latitude},${longitude}`); }
  async resolveLocation(query: string) { return (await this.request(query))[0] ?? null; }
  findPossibleRelatedLocations(candidate: DiscoveredBusiness) { return this.request(candidate.displayName); }
}

export class PitchAgencyDataAxleProvider implements MerchantDiscoveryProvider {
  name = "PITCH_AGENCY_DATAXLE";
  private base = process.env.PITCH_AGENCY_BASE_URL;
  private token = process.env.PITCH_AGENCY_ADMIN_JWT;
  private path = process.env.PITCH_AGENCY_DISCOVERY_PATH ?? "/api/admin/pie/data-axle";
  private async call(path: string, body: Record<string, unknown>) {
    if (!this.base || !this.token) throw new ApiError("DISCOVERY_PROVIDER_NOT_CONFIGURED", 503);
    const response = await fetch(`${this.base.replace(/\/$/, "")}${path}`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.token}` }, body: JSON.stringify(body), cache: "no-store" });
    if (!response.ok) throw new ApiError("DISCOVERY_PROVIDER_UNAVAILABLE", 503);
    const payload = await response.json() as { leads?: Array<Record<string, unknown>> };
    return (payload.leads ?? []).map((record) => {
      const displayName = String(record.businessName ?? record.company ?? "Unknown business");
      const address = { addressLine1: record.address, city: record.city, state: record.state, postalCode: record.postalCode, formatted: [record.address, record.city, record.state, record.postalCode].filter(Boolean).join(", ") };
      return { displayName, normalizedName: normalize(displayName), phone: record.phone ? String(record.phone) : undefined, website: record.website ? String(record.website) : undefined, address, latitude: typeof record.latitude === "number" ? record.latitude : undefined, longitude: typeof record.longitude === "number" ? record.longitude : undefined, category: record.industry ? String(record.industry) : undefined, provider: this.name, sourceRecordId: String(record.id ?? `${displayName}:${address.formatted}`), raw: record, confidence: 0.9 };
    });
  }
  searchBusinesses(query: string) { return this.call(this.path, { action: "search", keyword: query, limit: 100 }); }
  getBusinessDetails(sourceRecordId: string) { return this.call(this.path, { action: "search", keyword: sourceRecordId, limit: 10 }).then((items) => items[0] ?? null); }
  searchNearby(latitude: number, longitude: number, query?: string) { return this.call(this.path, { action: "search", keyword: query, latitude, longitude, limit: 100 }); }
  resolveLocation(query: string) { return this.searchBusinesses(query).then((items) => items[0] ?? null); }
  findPossibleRelatedLocations(candidate: DiscoveredBusiness) { return this.searchBusinesses(candidate.displayName); }
}

export function configuredDiscoveryProviders(): MerchantDiscoveryProvider[] {
  const providers: MerchantDiscoveryProvider[] = [];
  if (process.env.PITCH_AGENCY_BASE_URL && process.env.PITCH_AGENCY_ADMIN_JWT) providers.push(new PitchAgencyDataAxleProvider());
  if (process.env.MAPBOX_ACCESS_TOKEN) providers.push(new MapboxDiscoveryProvider());
  return providers;
}
