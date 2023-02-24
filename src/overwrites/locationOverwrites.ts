import Coordinate from "../utils/coordinate";

type LocationOverwrites = {
  [conceptName: string]: Coordinate,
};

/**
 * Dining locations coordinates that we manually overwrite because they are
 * wrong on the dining API.
 */
const overwrites: LocationOverwrites = {
  'E.A.T. (EVENINGS AT TEPPER) - ROHR COMMONS':
    new Coordinate(40.444902436996365, -79.94550403887685),
  'FORBES AVENUE SUBS - ROHR COMMONS':
    new Coordinate(40.44496374074576, -79.9454977063049),
  'THE UNDERGROUND':
    new Coordinate(40.44534396524053, -79.94331660360899),
  'TASTE OF INDIA':
    new Coordinate(40.44257994858966, -79.94024963683377),
  'ROOTED':
    new Coordinate(40.44253647844129, -79.94022110322688),
  'TAHINI':
    new Coordinate(40.44258976615644, -79.93993708177102),
  'GLOBAL EATS':
    new Coordinate(40.442541236943654, -79.94003221108981),
  'FRESH52':
    new Coordinate(40.44250111062168, -79.94005528213043),
  'THE EDGE CAFE & MARKET':
    new Coordinate(40.4426740207827, -79.94023230189542),
  'GRANO':
    new Coordinate(40.44360605619342, -79.9420424059931),
  'INNOVATION KITCHEN':
    new Coordinate(40.443564509736284, -79.94204847169576),
  'BACK BAR GRILL':
    new Coordinate(40.44352019390539, -79.94207258798099),
  'CAPITAL GRAINS - ROHR COMMONS':
    new Coordinate(40.4449525806329, -79.94546729610397),
};

export default overwrites;
