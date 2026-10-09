import { describeShells } from './shellIntent';

/** La gare (D-148) : chaque coquille tient son intention. */
describeShells('les coquilles de la gare (D-148)', [
  'station-tracks',
  'station-platforms',
  'station-hall',
  'station-lost',
  'station-depot',
]);
