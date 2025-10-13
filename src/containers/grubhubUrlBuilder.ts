import { IGrubhubAuthResponse, IGrubhubData } from "types";
import grubhubLinkIds from "./grubhubLinkIds";

/**
 * For building the Grubhub deep links.
 */
export default class GrubhubUrlBuilder {
  private readonly AUTH_URL = "https://api-gtm.grubhub.com/auth/refresh";
  private readonly API_URL = "https://api-gtm.grubhub.com/topics-gateway/v1/topic/content?applicationId=ios&location=POINT(-79.93882752%2040.44434738)&locationMode=PICKUP&position=1&operationId=ab529cdc-4546-4a51-8b08-5738c175445c&pageSource=CAMPUS&topicSource=campus/search&topicId=dd1de4dc-6a7e-4bb4-bf02-2d37f2c66217&applicationVersion=2025.40&timezoneOffset=-14400000&parameter=locationMode:PICKUP&parameter=radius:5.0&dinerLocation=POINT(-79.93882752%2040.44434738)&geohash=dppnhfwm6kcc";
  
  private readonly REFRESH_TOKEN = "0d15d62e-8b88-4a64-8b5b-42ccf789c295";
  private readonly CLIENT_ID = "ghiphone_Vkuxbs6t0f4SZjTOW42Y52z1itJ7Li0Tw3FEcboT";


  constructor() {}

  public async build(): Promise<Record<string, string>> {
    const accessToken = await this.refreshToken();
    const restaurantData = await this.fetchRestaurantData(accessToken);
    const deepLinks = this.parseAndBuildLinks(restaurantData);

    const conceptToDeepLinks: Record<string, string> = {};
    Object.entries(grubhubLinkIds).map(([concept_id, rest_id]) => {
      conceptToDeepLinks[concept_id] = deepLinks[rest_id];
    });

    return deepLinks;
  }

  private async refreshToken(): Promise<string> {
    const payload = {
      refresh_token: this.REFRESH_TOKEN,
      client_id: this.CLIENT_ID
    };

    const response = await fetch(this.AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data: IGrubhubAuthResponse = await response.json();
    if (!data.session_handle?.access_token) {
        throw Error("Access token not found in refresh response");
    }

    return data.session_handle.access_token;
  }

  private async fetchRestaurantData(token: string): Promise<IGrubhubData> {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'GrubHub/2025.40 (iPhone; iOS 26.0.1; Scale/3.00)',
    };

    const response = await fetch(this.API_URL, { headers });

    if (!response.ok) {
      throw Error(`Failed to fetch restaurant data: ${response.statusText}`);
    }
    
    return await response.json() as IGrubhubData;
  }

  private parseAndBuildLinks(apiData: IGrubhubData): Record<string, string> {
    const links: Record<string, string> = {};
    const content = apiData.object?.data?.content || [];
    const urlPrefix = "https://www.grubhub.com/restaurant/";

    for (const item of content) {
      const entity = item.entity;
      if (!entity) continue;

      const keyId = entity.restaurant_id;
      
      const nameSlug = this.slugify(entity.name);
      const addrSlug = this.slugify(entity.address.street_address);
      const localitySlug = this.slugify(entity.address.address_locality);

      const fullLink = `${urlPrefix}${nameSlug}-${addrSlug}-${localitySlug}/${entity.restaurant_id}`;
      
      links[keyId] = fullLink;
    }
    
    return links;
  }

  /**
   * A simple utility to convert a string into a URL-friendly slug.
   * @param text - The string to slugify.
   * @returns A slugified string.
   */
  private slugify(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, '-');
  }
}
