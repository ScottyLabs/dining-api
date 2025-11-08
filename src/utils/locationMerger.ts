import { ILocation } from "types";

export default class ScrapeResultMerger {
  majorityDict: Partial<
    Record<
      number,
      Partial<Record<string, { cnt: number; originalData: ILocation }>>
    >
  > = {}; // Partial type because the values don't exist initially
  addLocation(location: ILocation) {
    const majorityDictLocationData =
      this.majorityDict[location.conceptId] ?? {};
    const hashedVersion = JSON.stringify(location);

    majorityDictLocationData[hashedVersion] = {
      cnt: (majorityDictLocationData[hashedVersion]?.cnt ?? 0) + 1,
      originalData: location, // theoretically this should be the same as all previous versions
    };
    this.majorityDict[location.conceptId] = majorityDictLocationData;
  }
  getMostFrequentLocations() {
    return Object.entries(this.majorityDict).map(([conceptId, freqData]) => {
      if (freqData === undefined) {
        throw new Error(`Expected frequency data for concept id ${conceptId}`);
      }

      const bestMatch = Object.values(freqData).reduce((bestMatch, curVal) => {
        if (curVal === undefined) throw new Error();
        return bestMatch === undefined || curVal.cnt > bestMatch.cnt
          ? curVal
          : bestMatch;
      }, undefined);
      if (bestMatch === undefined) throw new Error();
      console.log(
        `${bestMatch.originalData.name} frequencies: ${Object.values(
          freqData
        ).map((val) => val?.cnt)}`
      );
      return bestMatch.originalData;
    });
  }
}
