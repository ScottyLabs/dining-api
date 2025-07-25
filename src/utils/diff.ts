import { ILocation } from "types";

type T = { [key: string]: T } | T[] | string | number | undefined;
export function getObjDiffs(
  prevObject: T,
  newObject: T,
  path: string = "~"
): string[] {
  let diffs: string[] = [];
  if (typeof prevObject === "object" && typeof newObject === "object") {
    if (prevObject instanceof Array && newObject instanceof Array) {
      diffs = diffs.concat(getArrayDiffs(prevObject, newObject, path));
    } else if (
      !(prevObject instanceof Array) &&
      !(newObject instanceof Array)
    ) {
      // two objects, so we just compare the values key by key
      const setOfAllKeys = new Set([
        ...Object.keys(prevObject),
        ...Object.keys(newObject),
      ]);
      for (const key of setOfAllKeys) {
        let newDiffs = getObjDiffs(
          prevObject[key],
          newObject[key],
          path + "/" + key
        );
        // always merge the smaller list into the larger one for slightly more efficiency (kinda unnecessary)
        // see: https://usaco.guide/plat/merging?lang=cpp
        if (newDiffs.length > diffs.length) {
          [diffs, newDiffs] = [newDiffs, diffs]; // with ES6, we can now write cursed abominations like this
        }
        diffs = diffs.concat(newDiffs);
      }
    } else {
      // comparing an array to a plain object
      diffs.push(
        `diff in object type at ${path}! ${JSON.stringify(
          prevObject
        )} ${JSON.stringify(newObject)}`
      );
    }
  } else {
    if (prevObject === undefined && newObject !== undefined) {
      diffs.push(`inserted value at ${path}: ${JSON.stringify(newObject)}`);
    } else if (prevObject !== undefined && newObject === undefined) {
      diffs.push(`deleted value at ${path}: ${JSON.stringify(prevObject)}`);
    } else if (prevObject !== newObject) {
      diffs.push(`changed value at ${path}: ${prevObject} ${newObject}`);
    }
  }
  return diffs;
}
export function getDiffsBetweenLocationData(
  prevLocations: ILocation[],
  newLocations: ILocation[]
) {
  // get list into dict form
  const prevLocationDict = prevLocations.reduce(
    (combinedDict, location) => ({
      [location.conceptId]: location,
      ...combinedDict,
    }),
    {}
  );
  const newLocationDict = newLocations.reduce(
    (combinedDict, location) => ({
      [location.conceptId]: location,
      ...combinedDict,
    }),
    {}
  );

  return getObjDiffs(prevLocationDict, newLocationDict, "~");
}

function getArrayDiffs(prevArray: any[], newArray: any[], path: string) {
  const diffs: string[] = [];
  // assume that the list is unordered, so we'll just stringify everything and compare those, naively
  const prevFreqCnt = getFreqMap(prevArray.map((obj) => JSON.stringify(obj)));
  const newFreqCnt = getFreqMap(newArray.map((obj) => JSON.stringify(obj)));
  const allKeys = new Set([
    ...Object.keys(prevFreqCnt),
    ...Object.keys(newFreqCnt),
  ]);
  for (const key of allKeys) {
    if (prevFreqCnt[key] !== newFreqCnt[key]) {
      if (prevFreqCnt[key] === undefined) {
        diffs.push(
          `inserted value at ${path} ${
            newFreqCnt[key] > 1 ? newFreqCnt[key] + " times" : ""
          }: ${key}`
        );
      } else if (newFreqCnt[key] === undefined) {
        diffs.push(
          `deleted value at ${path} ${
            prevFreqCnt[key] > 1 ? prevFreqCnt[key] + " times" : ""
          }: ${key}`
        );
      } else {
        diffs.push(
          `frequency of ${key} changed from ${prevFreqCnt[key]} to ${newFreqCnt[key]}`
        );
      }
    }
  }
  return diffs;
}
function getFreqMap(strs: string[]) {
  const freqMap: Record<string, number> = {};
  for (const str of strs) {
    freqMap[str] = (freqMap[str] ?? 0) + 1;
  }
  return freqMap;
}
