import path from "path";
import fs from "fs";

export function last<T>(ar: T[]) {
  return ar[ar.length - 1];
}
export function getFileContent(localFilePath: string): string;
export function getFileContent(localFilePath: undefined): undefined;
export function getFileContent(
  localFilePath: string | undefined
): string | undefined;
export function getFileContent(localFilePath: string | undefined) {
  if (localFilePath === undefined) return undefined;
  const fullFilePath = path.resolve(__dirname, localFilePath);
  if (!fs.existsSync(fullFilePath))
    throw new Error(`${fullFilePath} not found!`);
  return fs.readFileSync(fullFilePath, {
    encoding: "utf8",
  });
}
