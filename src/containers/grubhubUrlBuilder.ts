import { IGrubhubAuthResponse, IGrubhubData } from "types";
import grubhubLinkIds from "./grubhubLinkIds";
import { DBType } from "db/db";
import { configTable } from "db/schema";
import { eq } from "drizzle-orm";

const GRUBHUB_REFRESH_TOKEN_KEY = "grubhub_refresh_token";
const DEFAULT_REFRESH_TOKEN = "e209dd9f-fbfc-442d-8f86-63b13db152cd";

/**
 * For building the Grubhub deep links.
 */
export default class GrubhubUrlBuilder {
  private readonly AUTH_URL = "https://api-gtm.grubhub.com/auth/refresh";
  private readonly API_URL = "https://api-gtm.grubhub.com/topics-gateway/v1/topic/content?applicationId=ios&location=POINT(-79.93882752%2040.44434738)&locationMode=PICKUP&position=1&operationId=ab529cdc-4546-4a51-8b08-5738c175445c&pageSource=CAMPUS&topicSource=campus/search&topicId=dd1de4dc-6a7e-4bb4-bf02-2d37f2c66217&applicationVersion=2025.40&timezoneOffset=-14400000&parameter=locationMode:PICKUP&parameter=radius:5.0&dinerLocation=POINT(-79.93882752%2040.44434738)&geohash=dppnhfwm6kcc";
  
  private readonly CLIENT_ID = "ghiphone_Vkuxbs6t0f4SZjTOW42Y52z1itJ7Li0Tw3FEcboT";
  private db: DBType;

  constructor(db: DBType) {
    this.db = db;
  }

  public async build(): Promise<Record<string, string>> {
    const accessToken = await this.refreshToken();
    const restaurantData = await this.fetchRestaurantData(accessToken);
    //console.log(restaurantData);
    const deepLinks = this.parseAndBuildLinks(restaurantData);

    const conceptToDeepLinks: Record<string, string> = {};
    Object.entries(grubhubLinkIds).map(([concept_id, rest_id]) => {
      const link = deepLinks[rest_id];
      if (link !== undefined) {
        conceptToDeepLinks[concept_id] = link;
      }
    });

    console.table(conceptToDeepLinks);

    return conceptToDeepLinks;
  }

  private async getRefreshToken(): Promise<string> {
    const result = await this.db
      .select()
      .from(configTable)
      .where(eq(configTable.key, GRUBHUB_REFRESH_TOKEN_KEY));

    if (result.length > 0) {
      return result[0]!.value;
    }

    // Seed the default token into the DB on first use
    await this.setRefreshToken(DEFAULT_REFRESH_TOKEN);
    return DEFAULT_REFRESH_TOKEN;
  }

  private async setRefreshToken(token: string): Promise<void> {
    await this.db
      .insert(configTable)
      .values({ key: GRUBHUB_REFRESH_TOKEN_KEY, value: token })
      .onConflictDoUpdate({
        target: configTable.key,
        set: { value: token },
      });
  }

  private async refreshToken(): Promise<string> {
    const currentRefreshToken = await this.getRefreshToken();

    const payload = {
      refresh_token: currentRefreshToken,
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

    await this.setRefreshToken(data.session_handle.refresh_token);

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

    const data = await response.json();

    // 2. Log the stored data (JSON.stringify makes it easier to read)
    console.log("DEBUG DATA:", JSON.stringify(data, null, 2));
    
    // 3. Return the stored data
    return data as IGrubhubData;
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
