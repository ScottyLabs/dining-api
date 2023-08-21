type TapingoOverwrites = {
  [conceptName: string]: string;
};

/**
 * Dining locations Grubhub Links that we manually overwrite to provide
 * ordering on CMUEats.
 */
const tapingoOverwrites: TapingoOverwrites = {
  'AU BON PAIN AT SKIBO CAFÉ': 'https://kioskweb.tapingo.com/#5954818',
  'EL GALLO DE ORO': 'https://kioskweb.tapingo.com/#6013799',
  'DE FER COFFEE & TEA AT MAGGIE MURPH CAFÉ': 'https://kioskweb.tapingo.com/#8914187',
};

export default tapingoOverwrites;
