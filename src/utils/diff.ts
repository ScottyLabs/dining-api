import { ILocation } from "types";
import { notifySlack } from "./slack";

type T = { [key: string]: T } | T[] | string | number | undefined;
export function logObjDiffs(prevObject: T, newObject: T, path: string = "~") {
  if (typeof prevObject === "object" && typeof newObject === "object") {
    if (prevObject instanceof Array && newObject instanceof Array) {
      // assume that the list is unordered, so we'll just stringify everything and compare those, naively
      const prevSet = new Set(prevObject.map((obj) => JSON.stringify(obj)));
      const newSet = new Set(newObject.map((obj) => JSON.stringify(obj)));

      for (const prevVal of prevSet) {
        if (!newSet.has(prevVal)) {
          notifySlack(`deleted value at ${path}: ${prevVal}`);
        }
      }
      for (const newVal of newSet) {
        if (!prevSet.has(newVal)) {
          notifySlack(`inserted value at ${path}: ${newVal}`);
        }
      }
    } else if (
      !(prevObject instanceof Array) &&
      !(newObject instanceof Array)
    ) {
      const setOfAllKeys = new Set([
        ...Object.keys(prevObject),
        ...Object.keys(newObject),
      ]);
      for (const key of setOfAllKeys) {
        logObjDiffs(prevObject[key], newObject[key], path + "/" + key);
      }
    } else {
      // comparing an array to a plain object
      notifySlack(
        `diff in object type at ${path}! ${JSON.stringify(
          prevObject
        )} ${JSON.stringify(newObject)}`
      );
    }
  } else {
    if (prevObject === undefined && newObject !== undefined) {
      notifySlack(`inserted value at ${path}: ${JSON.stringify(newObject)}`);
    } else if (prevObject !== undefined && newObject === undefined) {
      notifySlack(`deleted value at ${path}: ${JSON.stringify(prevObject)}`);
    } else if (prevObject !== newObject) {
      notifySlack(`changed value at ${path}: ${prevObject} ${newObject}`);
    }
  }
}
export function logDiffs(
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

  logObjDiffs(prevLocationDict, newLocationDict);
}
