import axios from "axios";

export async function getHTMLResponse(url: URL) {
  try {
    const response = await axios.get(url.toString());
    return response.data;
  } catch (err) {
    console.error(err);
  }
}
