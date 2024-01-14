import axios from "axios";

const wait = (ms: number) => {
  return new Promise((re) => setTimeout(re, ms));
};

export async function getHTMLResponse(url: URL, retriesLeft = 4): Promise<any> {
  try {
    const response = await axios.get(url.toString());
    return response.data;
  } catch (err) {
    console.error(err);
    if (retriesLeft > 0) {
      await wait(1000);
      return await getHTMLResponse(url, retriesLeft - 1);
    } else throw err;
  }
}
