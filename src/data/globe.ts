// Sourcing and delivery markets drawn on the world maps.
// The cities are illustrative examples for each region; edit freely.
// Coordinates are latitude / longitude in degrees.
export interface Hub {
  name: string;
  lat: number;
  lon: number;
  /** Shown on the map's pin card */
  country?: string;
  note?: string;
}

export interface Corridor {
  id: string;
  name: string;
  summary: string;
  hubs: Hub[];
}

export const homeHub: Hub = { name: 'New Delhi', lat: 28.61, lon: 77.21, country: 'India', note: 'Our base. Every order is managed from here, from the first enquiry to delivery at your door.' };

export const corridors: Corridor[] = [
  {
    id: 'east-asia',
    name: 'China & Japan',
    summary: 'Deep factory bases for electronics, consumer goods, machinery and custom OEM products.',
    hubs: [
      { name: 'Shenzhen', lat: 22.54, lon: 114.06, country: 'China', note: 'Electronics, components and custom OEM products from established factories.' },
      { name: 'Yiwu', lat: 29.31, lon: 120.08, country: 'China', note: 'Consumer goods and small commodities, bought wholesale and consolidated.' },
      { name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'Japan', note: 'Precision machinery, tools and specialist parts.' },
    ],
  },
  {
    id: 'asia-pacific',
    name: 'Indonesia & Australia',
    summary: 'Commodities, materials and growing markets across Southeast Asia and Oceania.',
    hubs: [
      { name: 'Jakarta', lat: -6.21, lon: 106.85, country: 'Indonesia', note: 'Agricultural commodities, rubber and textiles from Southeast Asia.' },
      { name: 'Sydney', lat: -33.87, lon: 151.21, country: 'Australia', note: 'Metals and minerals, and deliveries across Oceania.' },
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    summary: 'Specialist manufacturers in Italy and Slovakia, and deliveries across Europe.',
    hubs: [
      { name: 'Milan', lat: 45.46, lon: 9.19, country: 'Italy', note: 'Industrial machinery and specialist European manufacturers.' },
      { name: 'Bratislava', lat: 48.15, lon: 17.11, country: 'Slovakia', note: 'Automotive parts and engineering components from Central Europe.' },
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    summary: 'Agricultural produce and minerals, and deliveries to East and Southern Africa.',
    hubs: [
      { name: 'Mombasa', lat: -4.04, lon: 39.67, country: 'Kenya', note: 'Tea, coffee and fresh produce, and deliveries across East Africa.' },
      { name: 'Durban', lat: -29.86, lon: 31.02, country: 'South Africa', note: 'A gateway for deliveries across Southern Africa.' },
      { name: 'Cape Town', lat: -33.92, lon: 18.42, country: 'South Africa', note: 'Fruit, produce and minerals, and deliveries to the Cape.' },
    ],
  },
];

export const allHubs: Hub[] = corridors.flatMap((corridor) => corridor.hubs);

/** The four regions marked on the hero globe, each linked to New Delhi */
export const globeRegions: Hub[] = [
  { name: 'Asia', lat: 31.23, lon: 121.47, country: 'China, Japan, Southeast Asia and the Gulf', note: 'Electronics, consumer goods, machinery and raw materials from verified factories across Asia.' },
  { name: 'Europe', lat: 50.5, lon: 7.5, country: 'Italy, Germany, the Netherlands and the UK', note: 'Industrial machinery, engineering parts and specialist products, with deliveries across Europe.' },
  { name: 'Africa', lat: 2.0, lon: 22.0, country: 'Kenya, Nigeria, South Africa and Egypt', note: 'Produce, minerals and commodities, and door-to-door deliveries across the continent.' },
  { name: 'Americas', lat: 39.0, lon: -95.0, country: 'United States, Canada, Mexico and Brazil', note: 'Deliveries to North and South America, with freight, customs and documents handled.' },
];
