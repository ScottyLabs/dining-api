export function convertMapsLinkToCoordinates(link: string): [number, number] {
  const atIndex = link.indexOf("@");
  const locationUrl = link.slice(atIndex + 1, link.length);
  const commaIndex = locationUrl.indexOf(",");
  const latitude = locationUrl.slice(0, commaIndex);
  const longitude = locationUrl.slice(commaIndex + 1, locationUrl.length);
  return [parseFloat(latitude), parseFloat(longitude)];
}
