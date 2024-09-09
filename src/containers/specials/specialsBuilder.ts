export interface ISpecial {
  title: string;
  description?: string;
}

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
