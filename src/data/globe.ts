// Illustrative trade hubs shown on the home-page globe.
// Edit freely: names appear as labels, coordinates are [latitude, longitude].
export interface Hub {
  name: string;
  lat: number;
  lon: number;
}

export const homeHub: Hub = { name: 'New Delhi', lat: 28.61, lon: 77.21 };

export const tradeHubs: Hub[] = [
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Dubai', lat: 25.2, lon: 55.27 },
  { name: 'Rotterdam', lat: 51.92, lon: 4.48 },
  { name: 'Singapore', lat: 1.35, lon: 103.82 },
  { name: 'Shanghai', lat: 31.23, lon: 121.47 },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
  { name: 'Santos', lat: -23.96, lon: -46.33 },
  { name: 'Durban', lat: -29.86, lon: 31.02 },
];
