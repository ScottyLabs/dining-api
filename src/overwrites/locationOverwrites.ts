import { ICoordinate } from "types";
import locationCoordinateOverwrites from "./locationCoordinateOverwrites";

/**
 * Overwrite dining locations' coordinates because they are wrong on the dining website.
 */
const locationCoordinates = new Map<number, ICoordinate>(
    Object.entries(locationCoordinateOverwrites).map(([conceptIdString, coordinates]) => {
      const conceptId = parseInt(conceptIdString, 10);
      return [conceptId, { lat: coordinates.labelLatitude, lng: coordinates.labelLongitude }];
    })
  );

export default locationCoordinates;
