import Coordinate from '../utils/coordinate';

type LocationOverwrites = {
  [conceptName: string]: Coordinate;
};

/**
 * Dining locations coordinates that we manually overwrite because they are
 * wrong on the dining API.
 */
const overwrites: LocationOverwrites = {
  'E.A.T. (EVENINGS AT TEPPER) - ROHR COMMONS': new Coordinate(
    40.444902436996365,
    -79.94550403887685
  ),
  'FORBES AVENUE SUBS - ROHR COMMONS': new Coordinate(
    40.44496374074576,
    -79.9454977063049
  ),
  'THE UNDERGROUND': new Coordinate(40.44534396524053, -79.94331660360899),
  'TASTE OF INDIA': new Coordinate(40.44257994858966, -79.94024963683377),
  ROOTED: new Coordinate(40.44253647844129, -79.94022110322688),
  TAHINI: new Coordinate(40.44258976615644, -79.93993708177102),
  'GLOBAL EATS': new Coordinate(40.442541236943654, -79.94003221108981),
  FRESH52: new Coordinate(40.44250111062168, -79.94005528213043),
  'THE EDGE CAFE & MARKET': new Coordinate(
    40.4426740207827,
    -79.94023230189542
  ),
  GRANO: new Coordinate(40.44360605619342, -79.9420424059931),
  'INNOVATION KITCHEN': new Coordinate(40.443564509736284, -79.94204847169576),
  'BACK BAR GRILL': new Coordinate(40.44352019390539, -79.94207258798099),
  'CAPITAL GRAINS - ROHR COMMONS': new Coordinate(
    40.4449525806329,
    -79.94546729610397
  ),
  'HUNAN EXPRESS': new Coordinate(40.443392, -79.9502298),
  'ENTROPY+': new Coordinate(40.4429707, -79.9446505),
  'AU BON PAIN AT SKIBO CAFÉ': new Coordinate(40.4440982, -79.9447276),
  'EL GALLO DE ORO': new Coordinate(40.4431636, -79.9445513),
  'THE EXCHANGE': new Coordinate(40.4432416, -79.9634495),
  'LA PRIMA ESPRESSO': new Coordinate(40.4426526, -79.9484589),
  "MILLIE'S COFFEE 'N' CREAMERY - ROHR COMMONS": new Coordinate(
    40.4432403,
    -79.9561105
  ),
  'SCHATZ DINING ROOM': new Coordinate(40.4430838, -79.945142),
  'DE FER COFFEE & TEA AT MAGGIE MURPH CAFÉ': new Coordinate(
    40.4410794,
    -79.9461264
  ),
  /* NEED TO ADD 'FOOD HALL AT RESNIK', 'STEPHANIE'S - MARKET C', 'NOURISH', 
    'REVOLUTION NOODLE', 'BUILD PIZZA - ROHR COMMONS', 'BURGER 412 - ROHR COMMONS',
    'ROHR CAFÉ - LA PRIMA', 'POM AND HONEY - ROHR COMMONS', 'WILD BLUE SUSHI - RUGE ATRIUM' */
};

export default overwrites;
