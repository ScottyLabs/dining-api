import Coordinate from "../utils/coordinate";

type LocationOverwrites = {
  [conceptName: string]: Coordinate;
};

/**
 * Dining locations coordinates that we manually overwrite because they are
 * wrong on the dining API.
 */
const overwrites: LocationOverwrites = {
  "AU BON PAIN AT SKIBO CAFÉ": new Coordinate(40.444107, -79.942206),
  "BACK BAR GRILL": new Coordinate(40.44352019390539, -79.94207258798099),
  BEEFSTEAK: new Coordinate(40.443658, -79.942019),
  "CARNEGIE MELLON CAFÉ - THE EGG SHOPPE": new Coordinate(40.442429, -79.9397),
  CUCINA: new Coordinate(40.442684, -79.940225),
  "ENTROPY+": new Coordinate(40.442923, -79.942103),
  "THE EXCHANGE": new Coordinate(40.441499, -79.941951),
  FRESH52: new Coordinate(40.44250111062168, -79.94005528213043),
  "EL GALLO DE ORO": new Coordinate(40.443152, -79.942049),
  "GLOBAL EATS": new Coordinate(40.442541236943654, -79.94003221108981),
  GRANO: new Coordinate(40.44360605619342, -79.9420424059931),
  "HUNAN EXPRESS": new Coordinate(40.443486, -79.945528),
  "INNOVATION KITCHEN": new Coordinate(40.443564509736284, -79.94204847169576),
  "ROHR CAFÉ  - LA PRIMA": new Coordinate(40.443551, -79.944798),
  "MILLIE'S COFFEE 'N' CREAMERY - ROHR COMMONS": new Coordinate(
    40.44487,
    -79.945319
  ),
  NOURISH: new Coordinate(40.4438318, -79.9422587),
  "LA PRIMA ESPRESSO": new Coordinate(40.442611, -79.945857),
  "ROHR COMMONS - TEPPER EATERY": new Coordinate(40.448299, -79.945468),
  ROOTED: new Coordinate(40.44253647844129, -79.94022110322688),
  "RUGE ATRIUM - ROTHBERG'S ROASTERS II": new Coordinate(40.443, -79.946859),
  "SCHATZ DINING ROOM": new Coordinate(40.44318, -79.942498),
  "STEPHANIE'S - MARKET C": new Coordinate(40.4461, -79.951),
  TAHINI: new Coordinate(40.44258976615644, -79.93993708177102),
  "TARTAN EXPRESS - ASIAN FUSION": new Coordinate(40.442754, -79.941394),
  "TASTE OF INDIA": new Coordinate(40.44257994858966, -79.94024963683377),
  "THE UNDERGROUND": new Coordinate(40.44534396524053, -79.94331660360899),
  "URBAN REVOLUTION AND GLOBAL EATS": new Coordinate(40.442522, -79.939982),
  "WILD BLUE SUSHI": new Coordinate(40.442684, -79.940225),
  "ZEBRA LOUNGE": new Coordinate(40.441633, -79.943015),
  "CAPITAL GRAINS - ROHR COMMONS": new Coordinate(
    40.4449525806329,
    -79.94546729610397
  ),
  "E.A.T. (EVENINGS AT TEPPER) - ROHR COMMONS": new Coordinate(
    40.444902436996365,
    -79.94550403887685
  ),
  "THE EDGE CAFE & MARKET": new Coordinate(
    40.4426740207827,
    -79.94023230189542
  ),
  "FORBES AVENUE SUBS - ROHR COMMONS": new Coordinate(
    40.44496374074576,
    -79.9454977063049
  ),
  "CARNEGIE MELLON CAFÉ": new Coordinate(40.442429, -79.9397),
  "HEINZ CAFÉ": new Coordinate(40.444328, -79.94506),
  "THE MAGGIE MURPH CAFÉ - ROTHBERG'S ROASTERS": new Coordinate(
    40.441137,
    -79.943472
  ),
};

export default overwrites;
