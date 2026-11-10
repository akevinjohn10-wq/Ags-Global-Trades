// Sourcing and delivery markets drawn on the world maps.
// The cities are illustrative examples for each region; edit freely.
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
    id: 'east-asia',
    name: 'East Asia',
    summary: 'Deep factory bases for electronics, consumer goods, machinery and custom OEM products.',
    hubs: [
      { name: 'Shenzhen', lat: 22.54, lon: 114.06 },
      { name: 'Yiwu', lat: 29.31, lon: 120.08 },
      { name: 'Busan', lat: 35.1, lon: 129.04 },
    ],
  },
  {
    id: 'southeast-asia',
    name: 'Southeast Asia',
    summary: 'Growing manufacturing for textiles, furniture, food products and components.',
    hubs: [
      { name: 'Ho Chi Minh City', lat: 10.82, lon: 106.63 },
      { name: 'Bangkok', lat: 13.76, lon: 100.5 },
    ],
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    summary: 'Trading hubs for fast regional supply and re-export across the Gulf.',
    hubs: [
      { name: 'Dubai', lat: 25.2, lon: 55.27 },
      { name: 'Jeddah', lat: 21.49, lon: 39.19 },
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    summary: 'Specialist manufacturers and distributors, and deliveries into Europe’s gateway ports.',
    hubs: [
      { name: 'Istanbul', lat: 41.01, lon: 28.98 },
      { name: 'Rotterdam', lat: 51.92, lon: 4.48 },
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    summary: 'Agricultural produce and minerals, and deliveries to East and Southern Africa.',
    hubs: [
      { name: 'Mombasa', lat: -4.04, lon: 39.67 },
      { name: 'Durban', lat: -29.86, lon: 31.02 },
    ],
  },
  {
    id: 'americas',
    name: 'Americas',
    summary: 'Long-haul supply to buyers across North and South America.',
    hubs: [
      { name: 'New York', lat: 40.71, lon: -74.0 },
      { name: 'Los Angeles', lat: 34.05, lon: -118.24 },
      { name: 'Santos', lat: -23.96, lon: -46.33 },
    ],
  },
];

export const allHubs: Hub[] = corridors.flatMap((corridor) => corridor.hubs);
