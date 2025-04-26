import { ICoordinate, ITimeRange } from "types";

export type LocationOverwrites = {
  [conceptName: string]: {
    coordinate?: ICoordinate;
    times?: ITimeRange[];
  };
};

/**
 * Dining locations coordinates that we manually overwrite because they are
 * wrong on the dining API, or if we want to manually force a location to be closed.
 */

function makeCoordinates(lat: number, lng: number) {
  return { coordinate: { lat, lng } };
}

function makeTimeChange(times: ITimeRange[]) {
  return { times };
}

const overwrites: LocationOverwrites = {
  "AU BON PAIN AT SKIBO CAFÉ": makeCoordinates(40.444107, -79.942206),
  "BACK BAR GRILL": makeCoordinates(40.44352019390539, -79.94207258798099),
  BEEFSTEAK: makeCoordinates(40.443658, -79.942019),
  "CARNEGIE MELLON CAFÉ - THE EGG SHOPPE": makeCoordinates(40.442429, -79.9397),
  "CAPITAL GRAINS - ROHR COMMONS": {
    ...makeCoordinates(40.4449525806329, -79.94546729610397),
    ...makeTimeChange([]), // merged: coordinate + forced closed
  },
  CUCINA: makeCoordinates(40.442684, -79.940225),
  "ENTROPY+": makeCoordinates(40.442923, -79.942103),
  "THE EXCHANGE": makeCoordinates(40.441499, -79.941951),
  FRESH52: makeCoordinates(40.44250111062168, -79.94005528213043),
  "EL GALLO DE ORO": makeCoordinates(40.443152, -79.942049),
  "GLOBAL EATS": makeCoordinates(40.442541236943654, -79.94003221108981),
  GRANO: makeCoordinates(40.44360605619342, -79.9420424059931),
  "HUNAN EXPRESS": makeCoordinates(40.443486, -79.945528),
  "INNOVATION KITCHEN": makeCoordinates(40.443564509736284, -79.94204847169576),
  "ROHR CAFÉ  - LA PRIMA": makeCoordinates(40.443551, -79.944798),
  "MILLIE'S COFFEE 'N' CREAMERY - ROHR COMMONS": makeCoordinates(
    40.44487,
    -79.945319
  ),
  NOURISH: makeCoordinates(40.4438318, -79.9422587),
  "LA PRIMA ESPRESSO": makeCoordinates(40.442611, -79.945857),
  "ROHR COMMONS - TEPPER EATERY": makeCoordinates(40.448299, -79.945468),
  ROOTED: makeCoordinates(40.44253647844129, -79.94022110322688),
  "RUGE ATRIUM - ROTHBERG'S ROASTERS II": makeCoordinates(40.443, -79.946859),
  "SCHATZ DINING ROOM": makeCoordinates(40.44318, -79.942498),
  "STEPHANIE'S - MARKET C": makeCoordinates(40.4461, -79.951),
  TAHINI: makeCoordinates(40.44258976615644, -79.93993708177102),
  "TARTAN EXPRESS - ASIAN FUSION": makeCoordinates(40.442754, -79.941394),
  "TASTE OF INDIA": makeCoordinates(40.44257994858966, -79.94024963683377),
  "THE UNDERGROUND": makeCoordinates(40.44534396524053, -79.94331660360899),
  "URBAN REVOLUTION AND GLOBAL EATS": makeCoordinates(40.442522, -79.939982),
  "WILD BLUE SUSHI": makeCoordinates(40.442684, -79.940225),
  "ZEBRA LOUNGE": makeCoordinates(40.441633, -79.943015),
  "E.A.T. (EVENINGS AT TEPPER) - ROHR COMMONS": makeCoordinates(
    40.444902436996365,
    -79.94550403887685
  ),
  "THE EDGE CAFE & MARKET": makeCoordinates(
    40.4426740207827,
    -79.94023230189542
  ),
  "FORBES AVENUE SUBS - ROHR COMMONS": makeCoordinates(
    40.44496374074576,
    -79.9454977063049
  ),
  "CARNEGIE MELLON CAFÉ": makeCoordinates(40.442429, -79.9397),
  "HEINZ CAFÉ": makeCoordinates(40.444328, -79.94506),
  "THE MAGGIE MURPH CAFÉ - ROTHBERG'S ROASTERS": makeCoordinates(
    40.441137,
    -79.943472
  ),
};

export default overwrites;
