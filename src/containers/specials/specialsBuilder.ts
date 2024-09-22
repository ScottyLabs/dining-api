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
  const cards = $("div.card").toArray();

  const locationSpecialMap: Record<string, ISpecial[]> = {};

  for (const card of cards) {
    const name = load(card)("h3.name").text().trim();
    const specialsBuilder = new SpecialsBuilder();

    const specialsText = load(card)("div.specialDetails").text().trim();
    const specialsArray = specialsText.split(/(?<=\n)\s*(?=\S)/);

    for (let i = 0; i < specialsArray.length; i += 2) {
      const title = specialsArray[i].trim();
      const description = specialsArray[i + 1]?.trim() || "";
      specialsBuilder.addSpecial(title, description);
    }

    locationSpecialMap[name] = specialsBuilder.build();
  }

  return locationSpecialMap;
}
