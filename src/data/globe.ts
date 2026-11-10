// Trade corridors drawn on the world maps.
// The ports are illustrative examples for each corridor; edit freely.
// Coordinates are latitude / longitude in degrees.
export interface Hub {
  name: string;
  lat: number;
  lon: number;
}

export interface Corridor {
  id: string;
  name: string;
  summary: string;
  hubs: Hub[];
}

export const homeHub: Hub = { name: 'New Delhi', lat: 28.61, lon: 77.21 };

export const corridors: Corridor[] = [
  {
    id: 'middle-east',
    name: 'Middle East',
    summary: 'Short sea and air lanes between India and the Gulf’s trading hubs.',
    hubs: [
      { name: 'Dubai', lat: 25.2, lon: 55.27 },
      { name: 'Jeddah', lat: 21.49, lon: 39.19 },
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    summary: 'Ocean freight through Suez into Europe’s main gateway ports.',
    hubs: [
      { name: 'Rotterdam', lat: 51.92, lon: 4.48 },
      { name: 'Hamburg', lat: 53.55, lon: 9.99 },
    ],
  },
  {
    id: 'southeast-asia',
    name: 'Southeast Asia',
    summary: 'Fast transhipment links across the Bay of Bengal and the Malacca Strait.',
    hubs: [
      { name: 'Singapore', lat: 1.35, lon: 103.82 },
      { name: 'Port Klang', lat: 3.0, lon: 101.39 },
    ],
  },
  {
    id: 'east-asia',
    name: 'East Asia',
    summary: 'Direct access to the manufacturing hubs of China and Korea.',
    hubs: [
      { name: 'Shanghai', lat: 31.23, lon: 121.47 },
      { name: 'Busan', lat: 35.1, lon: 129.04 },
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    summary: 'Growing lanes to East and Southern Africa across the Indian Ocean.',
    hubs: [
      { name: 'Mombasa', lat: -4.04, lon: 39.67 },
      { name: 'Durban', lat: -29.86, lon: 31.02 },
    ],
  },
  {
    id: 'americas',
    name: 'Americas',
    summary: 'Long-haul ocean and air freight to North and South America.',
    hubs: [
      { name: 'New York', lat: 40.71, lon: -74.0 },
      { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
      { name: 'Santos', lat: -23.96, lon: -46.33 },
    ],
  },
];

export const allHubs: Hub[] = corridors.flatMap((corridor) => corridor.hubs);
