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

  addSpecial(title: string, description: string): SpecialsBuilder {
    if (title.length === 0) return this; // if a special doesn't have a title, it's probably not supposed to be there
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

export async function retrieveSpecials(
  htmlContent: string
): Promise<Record<number, ISpecial[]>> {
  const $ = load(htmlContent);
  const locationSpecialMap: Record<number, SpecialsBuilder> = {};

  const specialCards = $(".specialsList>.card");
  for (const card of specialCards) {
    const id = parseInt(
      $(card).find(".detailsLink").attr("onclick")?.split("/")[1] ?? ""
    );
    if (isNaN(id)) {
      console.error("Failed to parse out id of card", $(card).html());
      continue;
    }
    const specialBuilder = locationSpecialMap[id] || new SpecialsBuilder(); // just in case two cards have the same corresponding id... you never know

    const specials = $(card).find(".specialDetails>ul>li");
    for (const special of specials) {
      const fullText = $(special).text();
      const title = $(special).find("strong").text().trim();
      const description = fullText.replace(title, "").trim();
      specialBuilder.addSpecial(
        title.replace(/\s+/g, " "),
        description.replace(/\s+/g, " ")
      );
    }
    locationSpecialMap[id] = specialBuilder;
  }

  return Object.entries(locationSpecialMap).reduce(
    (acc, [key, val]) => ({
      ...acc,
      [parseInt(key)]: val.build(),
    }),
    {}
  );
}
