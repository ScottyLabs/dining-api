import path from "path";
import fs from "fs";

export function last<T>(ar: T[]) {
  return ar[ar.length - 1];
}
export function getFileContent(localFilePath: string) {
  const fullFilePath = path.resolve(__dirname, localFilePath);
  if (!fs.existsSync(fullFilePath))
    throw new Error(`${fullFilePath} not found!`);
  return {
    data: fs.readFileSync(fullFilePath, {
      encoding: "utf8",
    }),
  };
}
