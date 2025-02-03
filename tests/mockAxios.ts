import { getFileContent, last } from "./utils";
import axios from "axios";

const ALL_LOCATIONS_URL =
  "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/?page=listConcepts";
const SPECIALS_URL =
  "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Specials";
const SOUPS_URL =
  "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Soups";
const LOCATION_URL_PREFIX =
  "https://apps.studentaffairs.cmu.edu/dining/conceptinfo/Concept/";

/**
 *
 * @param param0 Anything property that is undefined (or returns undefined) will effectively simulate a 404 page
 */
export function mockAxiosGETMethod({
  conceptListHTML,
  specialsHTML,
  soupsHTML,
  conceptHTML,
}: {
  conceptListHTML?: string;
  specialsHTML?: string;
  soupsHTML?: string;
  conceptHTML?: (id: string) => string | undefined;
}) {
  (axios.get as jest.Mock).mockImplementation(async (url: string) => {
    return { data: getHTML(url) };
  });

  const getHTML = (url: string) => {
    if (url === ALL_LOCATIONS_URL && conceptListHTML !== undefined)
      return conceptListHTML;
    if (url === SPECIALS_URL && specialsHTML !== undefined) return specialsHTML;
    if (url === SOUPS_URL && soupsHTML !== undefined) return soupsHTML;
    if (url.startsWith(LOCATION_URL_PREFIX) && conceptHTML !== undefined)
      return conceptHTML(last(url.split("/")));
    throw new Error(`url ${url} not found!`);
  };
}
/**
 *
 * @param param0 Any file path that is not provided will make the corresponding GET call error out
 */
export function mockAxiosGETMethodWithFilePaths({
  conceptListFilePath,
  specialsFilePath,
  soupsFilePath,
  getConceptFilePath,
}: {
  conceptListFilePath?: string;
  specialsFilePath?: string;
  soupsFilePath?: string;
  getConceptFilePath?: (locationId: string) => string;
}) {
  mockAxiosGETMethod({
    conceptListHTML: getFileContent(conceptListFilePath),
    specialsHTML: getFileContent(specialsFilePath),
    soupsHTML: getFileContent(soupsFilePath),
    conceptHTML: (conceptId) =>
      getConceptFilePath
        ? getFileContent(getConceptFilePath(conceptId))
        : undefined,
  });
}
