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
    name: 'China & Japan',
    summary: 'Deep factory bases for electronics, consumer goods, machinery and custom OEM products.',
    hubs: [
      { name: 'Shenzhen', lat: 22.54, lon: 114.06 },
      { name: 'Yiwu', lat: 29.31, lon: 120.08 },
      { name: 'Tokyo', lat: 35.68, lon: 139.69 },
    ],
  },
  {
    id: 'asia-pacific',
    name: 'Indonesia & Australia',
    summary: 'Commodities, materials and growing markets across Southeast Asia and Oceania.',
    hubs: [
      { name: 'Jakarta', lat: -6.21, lon: 106.85 },
      { name: 'Sydney', lat: -33.87, lon: 151.21 },
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    summary: 'Specialist manufacturers in Italy and Slovakia, and deliveries across Europe.',
    hubs: [
      { name: 'Milan', lat: 45.46, lon: 9.19 },
      { name: 'Bratislava', lat: 48.15, lon: 17.11 },
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    summary: 'Agricultural produce and minerals, and deliveries to East and Southern Africa.',
    hubs: [
      { name: 'Mombasa', lat: -4.04, lon: 39.67 },
      { name: 'Durban', lat: -29.86, lon: 31.02 },
      { name: 'Cape Town', lat: -33.92, lon: 18.42 },
    ],
  },
];

export const allHubs: Hub[] = corridors.flatMap((corridor) => corridor.hubs);
