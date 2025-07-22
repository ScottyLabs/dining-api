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
      // assume that the list is unordered, so we'll just stringify everything and compare those, naively
      const prevSet = new Set(prevObject.map((obj) => JSON.stringify(obj)));
      const newSet = new Set(newObject.map((obj) => JSON.stringify(obj)));

      for (const prevVal of prevSet) {
        if (!newSet.has(prevVal)) {
          diffs.push(`deleted value at ${path}: ${prevVal}`);
        }
      }
      for (const newVal of newSet) {
        if (!prevSet.has(newVal)) {
          diffs.push(`inserted value at ${path}: ${newVal}`);
        }
      }
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
