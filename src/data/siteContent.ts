import {
  BadgeCheck,
  Blocks,
  ClipboardList,
  Cog,
  Cpu,
  Eye,
  FileCheck,
  Globe,
  Handshake,
  Layers,
  MessageSquare,
  Network,
  Package,
  PackageCheck,
  PackageSearch,
  Receipt,
  Search,
  Ship,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
  Warehouse,
  Wheat,
  Boxes,
  type LucideIcon,
} from 'lucide-react';

export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Products', href: '#catalogue' },
  { label: 'Network', href: '#network' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

/** Rotating statements in the hero (change as you scroll). */
export const heroStatements = [
  'Tell us the product and the quantity. We find the right supplier.',
  'Every order is checked before it leaves the factory.',
  'Shipped to your door through trusted shipping and courier partners.',
];

/** The company in one paragraph; shown word-by-word as the visitor scrolls. */
export const missionStatement =
  'AGS Trade is a sourcing and supply company. You tell us what you need and how many. We find verified suppliers, negotiate the price, check the goods and arrange shipping through established shipping lines and courier partners, so your order arrives ready to sell or use.';

/** Four pillars shown as scattered cards (bluesqx "Vision + Experience" layout). */
export const pillars: { title: string; text: string; icon: LucideIcon }[] = [
  { title: 'Source', text: 'Any product, any quantity: matched to manufacturers and suppliers that can deliver it.', icon: PackageSearch },
  { title: 'Verify', text: 'Supplier checks, samples and quality inspection before you pay for the full order.', icon: BadgeCheck },
  { title: 'Ship', text: 'Booked with established shipping lines and courier partners, with tracking shared.', icon: Ship },
  { title: 'Support', text: 'One named contact from first enquiry to the day your goods arrive.', icon: Handshake },
];

export interface Service {
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
  image: string;
  alt: string;
}

export const services: Service[] = [
  {
    title: 'Product Sourcing',
    short: 'Any product, any quantity',
    description: 'Tell us what you need and how many. We search our supplier network and manufacturing hubs to find the right maker at the right price.',
    icon: Search,
    image: '/images/photos/global-sourcing.jpg',
    alt: 'Sourcing specialists reviewing parts against a global supplier network screen',
  },
  {
    title: 'Supplier Verification',
    short: 'Checked before you commit',
    description: 'We check supplier credentials, certifications and samples before any order is placed, so you only deal with makers who can deliver.',
    icon: ShieldCheck,
    image: '/images/photos/industrial-machinery.jpg',
    alt: 'Machinery on a factory floor being checked',
  },
  {
    title: 'Quotes & Negotiation',
    short: 'One clear price',
    description: 'We negotiate on your behalf and send one clear quote covering the product, packing and shipping to your destination.',
    icon: Receipt,
    image: '/images/photos/consumer-goods.jpg',
    alt: 'Retail-ready products displayed for sourcing',
  },
  {
    title: 'Bulk & Custom Orders',
    short: 'Trial runs to full loads',
    description: 'From trial quantities to full container loads, including private-label, OEM and made-to-specification products.',
    icon: Boxes,
    image: '/images/photos/wholesale-trading.jpg',
    alt: 'Warehouse racks stacked with bulk orders',
  },
  {
    title: 'Quality Inspection',
    short: 'Right goods, right count',
    description: 'Pre-shipment checks on quantity, packing and finish, so what arrives matches what you ordered.',
    icon: ClipboardList,
    image: '/images/photos/metals-minerals.jpg',
    alt: 'Pallets of metal products and steel coils ready for inspection',
  },
  {
    title: 'Shipping & Delivery',
    short: 'Sea freight and courier',
    description: 'We book your goods with established shipping lines, freight agents or courier services and share tracking until delivery.',
    icon: Truck,
    image: '/images/photos/import-export.jpg',
    alt: 'Container ship and cranes at a port at sunrise',
  },
];

export interface ProductCategory {
  name: string;
  description: string;
  icon: LucideIcon;
  image: string;
  alt: string;
  /** Optional looping animation shown instead of the photo when the row is opened */
  video?: string;
  /** "Why choose us" points shown when the row is opened */
  points: string[];
}

export const productCategories: ProductCategory[] = [
  {
    name: 'General Trading',
    video: '/videos/general-trading.mp4',
    description: 'A wide range of goods sourced and supplied to match your business needs.',
    icon: Package,
    image: '/images/photos/general-trading.jpg',
    alt: 'Port terminal with stacked containers and a trading warehouse',
    points: ['One contact for mixed orders', 'Sourcing matched to your specification', 'Combined shipping where it saves cost'],
  },
  {
    name: 'Cross-Border Supply',
    video: '/videos/cross-border-supply.mp4',
    description: 'Products sourced in one country and delivered to buyers in another, with paperwork prepared for both ends.',
    icon: Globe,
    image: '/images/photos/import-export.jpg',
    alt: 'Container ship at a port with cranes at sunrise',
    points: ['Suppliers matched to your destination market', 'Export paperwork prepared with the supplier', 'Shipping booked through trusted partners'],
  },
  {
    name: 'Global Sourcing',
    video: '/videos/global-sourcing.mp4',
    description: 'Verified suppliers and competitive pricing from manufacturing hubs worldwide.',
    icon: Search,
    image: '/images/photos/global-sourcing.jpg',
    alt: 'Sourcing team inspecting parts in front of a global supply network display',
    points: ['Suppliers checked before we place an order', 'Prices negotiated on your behalf', 'Samples arranged before bulk production'],
  },
  {
    name: 'Wholesale Trading',
    video: '/videos/wholesale-trading.mp4',
    description: 'Bulk supply for distributors, retailers, and resellers at scale.',
    icon: Warehouse,
    image: '/images/photos/wholesale-trading.jpg',
    alt: 'Warehouse racking stacked with bulk goods',
    points: ['Bulk volumes for distributors and resellers', 'Packing suited to onward distribution', 'Repeat orders on a schedule'],
  },
  {
    name: 'Industrial Machinery',
    video: '/videos/industrial-machinery.mp4',
    description: 'Machinery, spare parts, and production systems for a range of industries.',
    icon: Cog,
    image: '/images/photos/industrial-machinery.jpg',
    alt: 'Factory floor with CNC machines and engineers',
    points: ['Machinery and spares sourced to specification', 'Technical documents checked before dispatch', 'Heavy cargo booked with specialist carriers'],
  },
  {
    name: 'Agricultural Commodities',
    video: '/videos/agricultural-commodities.mp4',
    description: 'Grains, pulses, and agricultural produce sourced directly from growers.',
    icon: Wheat,
    image: '/images/photos/agricultural-commodities.jpg',
    alt: 'Sacks of grains, pulses and spices on pallets in a warehouse',
    points: ['Produce sourced directly from growers', 'Origin and quality certificates collected', 'Shipments timed to harvest cycles'],
  },
  {
    name: 'Metals & Minerals',
    video: '/videos/metals-and-minerals.mp4',
    description: 'Ferrous, non-ferrous, and mineral products supplied to specification.',
    icon: Layers,
    image: '/images/photos/metals-minerals.jpg',
    alt: 'Copper cathodes and steel coils in a metals warehouse',
    points: ['Grades supplied to your specification', 'Mill test certificates collected', 'Bulk and break-bulk shipping arranged'],
  },
  {
    name: 'Consumer Goods',
    video: '/videos/consumer-goods.mp4',
    description: 'Retail-ready products sourced for distribution across markets.',
    icon: ShoppingBag,
    image: '/images/photos/consumer-goods.jpg',
    alt: 'Shelves of retail-ready consumer products',
    points: ['Retail-ready packing and labelling', 'Flexible order sizes', 'Courier shipping for smaller orders'],
  },
  {
    name: 'Construction Materials',
    video: '/videos/construction-materials.mp4',
    description: 'Building and infrastructure materials delivered to project timelines.',
    icon: Blocks,
    image: '/images/photos/construction-materials.jpg',
    alt: 'Steel beams, timber, bricks and cement bags in a materials yard',
    points: ['Deliveries planned around project milestones', 'Bulk materials sourced to specification', 'Site-ready documentation'],
  },
  {
    name: 'OEM & ODM Procurement',
    video: '/videos/oem-odm-procurement.mp4',
    description: 'Custom-manufactured and white-label products built to your specifications.',
    icon: Cpu,
    image: 'https://images.pexels.com/photos/3520692/pexels-photo-3520692.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Circuit board with precision electronic components',
    points: ['Manufacturers matched to your design', 'Samples approved before production runs', 'Private-label packaging coordinated'],
  },
  {
    name: 'Shipping Coordination',
    video: '/videos/shipping-coordination.mp4',
    description: 'Your sourced goods booked with established shipping lines and courier partners, door to door.',
    icon: Network,
    image: 'https://images.pexels.com/photos/9694390/pexels-photo-9694390.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Stacked shipping containers in a logistics yard',
    points: ['Sea freight or courier chosen to suit the order', 'Tracking shared until delivery', 'A named contact for each shipment'],
  },
];

export interface ProcessStep {
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
  alt: string;
}

/** The order journey, told as the visitor scrolls. */
export const processSteps: ProcessStep[] = [
  {
    title: 'Request',
    description: 'Send us the product, the quantity, your target price and where it needs to go.',
    icon: MessageSquare,
    image: '/images/photos/consumer-goods.jpg',
    alt: 'Products a buyer might request',
  },
  {
    title: 'Source',
    description: 'We shortlist verified suppliers and manufacturers that can make your order.',
    icon: Search,
    image: '/images/photos/global-sourcing.jpg',
    alt: 'Sourcing team checking supplier parts',
  },
  {
    title: 'Quote',
    description: 'You receive one clear quote for the goods, packing and shipping. Approve it and we place the order.',
    icon: FileCheck,
    image: '/images/photos/general-trading.jpg',
    alt: 'Trading hub where orders are placed',
  },
  {
    title: 'Inspect',
    description: 'Goods are checked for quantity, packing and finish before they leave the supplier.',
    icon: Eye,
    image: '/images/photos/wholesale-trading.jpg',
    alt: 'Warehouse where goods are checked and packed',
  },
  {
    title: 'Ship',
    description: 'We book sea freight or courier shipping with trusted partners and share the tracking with you.',
    icon: Ship,
    image: '/images/photos/import-export.jpg',
    alt: 'Container ship departing port',
  },
  {
    title: 'Deliver',
    description: 'Your order arrives at your door or warehouse, with proof of delivery on record.',
    icon: PackageCheck,
    image: 'https://images.pexels.com/photos/9694390/pexels-photo-9694390.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Containers ready for final delivery',
  },
];

export const valuePoints = [
  {
    title: 'Verified Suppliers',
    description: 'Every supplier is checked for quality, certification, and reliability before we place an order.',
    icon: ShieldCheck,
  },
  {
    title: 'Clear, Honest Quotes',
    description: 'One price for the product, packing and shipping, with no surprises when the goods arrive.',
    icon: Receipt,
  },
  {
    title: 'One Point of Contact',
    description: 'A named manager who knows your products, your quantities, and your deadlines.',
    icon: Users,
  },
  {
    title: 'Shipping Handled',
    description: 'We work with established shipping lines and courier partners and keep you updated until delivery.',
    icon: Truck,
  },
];

export const tickerItems = [
  'Product sourcing',
  'Supplier verification',
  'Bulk & custom orders',
  'Quality inspection',
  'Shipping & delivery',
  'Any product · any quantity',
];

export const contactDetails = {
  address: ['AGS Trade', 'New Delhi 110045, India'],
  email: 'info@agsglobaltrades.in',
  phone: '+91 9013165871',
  hours: '9:00- 21:00 IST',
  linkedin: 'https://www.linkedin.com/in/aditya-dey-07708634a/',
  instagram: 'https://www.instagram.com/agstrades.in/',
};
