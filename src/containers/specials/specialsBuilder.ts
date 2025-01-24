import { load } from "cheerio";
import { ISpecial } from "types";

/**
 * For building the specials/soups data structure
 */
export default class SpecialsBuilder {
  private specials: ISpecial[];
  constructor() {
    this.specials = [];
  }

  addSpecial(title: string, description?: string): SpecialsBuilder {
    this.specials.push({
      title,
      description,
    });
    return this;
  }

  build(): ISpecial[] {
    return this.specials;
  }
}

export async function retrieveSpecials(htmlContent: string) {
  const $ = load(htmlContent);

  const locationSpecialMap: Record<string, ISpecial[]> = {};

  const specialsSections = $("h2:contains('Today's Specials'), h2:contains('Today's Soups')")
    .nextUntil("h2")
    .find("li");

  specialsSections.each((_, element) => {
    const name = $(element).closest("h2").text().trim();
    const specialsBuilder = locationSpecialMap[name] || new SpecialsBuilder();

    const title = $(element).find("strong").text().trim();
    const description = $(element).text().replace(title, "").trim();

    specialsBuilder.addSpecial(title, description);
    locationSpecialMap[name] = specialsBuilder.build();
  });

  return locationSpecialMap;
}