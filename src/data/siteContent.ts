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
  { label: 'How it works', href: '#process' },
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
    image: '/images/art/service-sourcing.svg',
    alt: 'Illustration of factory buildings and loading docks seen from above',
  },
  {
    title: 'Supplier Verification',
    short: 'Checked before you commit',
    description: 'We check supplier credentials, certifications and samples before any order is placed, so you only deal with makers who can deliver.',
    icon: ShieldCheck,
    image: '/images/art/service-documentation.svg',
    alt: 'Illustration of supplier documents and a verification checklist',
  },
  {
    title: 'Quotes & Negotiation',
    short: 'One clear price',
    description: 'We negotiate on your behalf and send one clear quote covering the product, packing and shipping to your destination.',
    icon: Receipt,
    image: '/images/art/service-quote.svg',
    alt: 'Illustration of order documents with an approved stamp',
  },
  {
    title: 'Bulk & Custom Orders',
    short: 'Trial runs to full loads',
    description: 'From trial quantities to full container loads, including private-label, OEM and made-to-specification products.',
    icon: Boxes,
    image: '/images/art/product-general-trading.svg',
    alt: 'Illustration of pallets of mixed goods ready for dispatch',
  },
  {
    title: 'Quality Inspection',
    short: 'Right goods, right count',
    description: 'Pre-shipment checks on quantity, packing and finish, so what arrives matches what you ordered.',
    icon: ClipboardList,
    image: '/images/art/product-wholesale.svg',
    alt: 'Illustration of a warehouse with goods being checked and moved',
  },
  {
    title: 'Shipping & Delivery',
    short: 'Sea, air and courier',
    description: 'We book your goods with established shipping lines, freight agents or courier services and share tracking until delivery.',
    icon: Truck,
    image: '/images/art/service-export.svg',
    alt: 'Illustration of a loaded container ship departing a port',
  },
];

export interface ProductCategory {
  name: string;
  description: string;
  icon: LucideIcon;
  image: string;
  alt: string;
  /** "Why choose us" points shown when the row is opened */
  points: string[];
}

export const productCategories: ProductCategory[] = [
  {
    name: 'General Trading',
    description: 'A wide range of goods sourced and supplied to match your business needs.',
    icon: Package,
    image: '/images/art/product-general-trading.svg',
    alt: 'Illustration of pallets of mixed goods in a distribution centre',
    points: ['One contact for mixed orders', 'Sourcing matched to your specification', 'Combined shipping where it saves cost'],
  },
  {
    name: 'Cross-Border Supply',
    description: 'Products sourced in one country and delivered to buyers in another, with paperwork prepared for both ends.',
    icon: Globe,
    image: '/images/art/product-import-export.svg',
    alt: 'Illustration of a container yard with stacked shipping containers',
    points: ['Suppliers matched to your destination market', 'Export paperwork prepared with the supplier', 'Shipping booked through trusted partners'],
  },
  {
    name: 'Global Sourcing',
    description: 'Verified suppliers and competitive pricing from manufacturing hubs worldwide.',
    icon: Search,
    image: '/images/art/product-global-sourcing.svg',
    alt: 'Illustration of a dotted world map with sourcing routes',
    points: ['Suppliers checked before we place an order', 'Prices negotiated on your behalf', 'Samples arranged before bulk production'],
  },
  {
    name: 'Wholesale Trading',
    description: 'Bulk supply for distributors, retailers, and resellers at scale.',
    icon: Warehouse,
    image: '/images/art/product-wholesale.svg',
    alt: 'Illustration of warehouse racking with forklifts in the aisles',
    points: ['Bulk volumes for distributors and resellers', 'Packing suited to onward distribution', 'Repeat orders on a schedule'],
  },
  {
    name: 'Industrial Machinery',
    description: 'Machinery, spare parts, and production systems for a range of industries.',
    icon: Cog,
    image: '/images/art/product-machinery.svg',
    alt: 'Illustration of interlocking machine gears',
    points: ['Machinery and spares sourced to specification', 'Technical documents checked before dispatch', 'Heavy cargo booked with specialist carriers'],
  },
  {
    name: 'Agricultural Commodities',
    description: 'Grains, pulses, and agricultural produce sourced directly from growers.',
    icon: Wheat,
    image: '/images/art/product-agriculture.svg',
    alt: 'Illustration of crop fields, a harvester and grain silos from above',
    points: ['Produce sourced directly from growers', 'Origin and quality certificates collected', 'Shipments timed to harvest cycles'],
  },
  {
    name: 'Metals & Minerals',
    description: 'Ferrous, non-ferrous, and mineral products supplied to specification.',
    icon: Layers,
    image: '/images/art/product-metals.svg',
    alt: 'Illustration of steel coils and beams ready for shipment',
    points: ['Grades supplied to your specification', 'Mill test certificates collected', 'Bulk and break-bulk shipping arranged'],
  },
  {
    name: 'Consumer Goods',
    description: 'Retail-ready products sourced for distribution across markets.',
    icon: ShoppingBag,
    image: '/images/art/product-consumer-goods.svg',
    alt: 'Illustration of boxed consumer goods on conveyor belts',
    points: ['Retail-ready packing and labelling', 'Flexible order sizes', 'Courier shipping for smaller orders'],
  },
  {
    name: 'Construction Materials',
    description: 'Building and infrastructure materials delivered to project timelines.',
    icon: Blocks,
    image: '/images/art/product-construction.svg',
    alt: 'Illustration of a construction site with a tower crane and materials',
    points: ['Deliveries planned around project milestones', 'Bulk materials sourced to specification', 'Site-ready documentation'],
  },
  {
    name: 'OEM & ODM Procurement',
    description: 'Custom-manufactured and white-label products built to your specifications.',
    icon: Cpu,
    image: '/images/art/product-oem-odm.svg',
    alt: 'Illustration of a circuit board representing custom OEM and ODM manufacturing',
    points: ['Manufacturers matched to your design', 'Samples approved before production runs', 'Private-label packaging coordinated'],
  },
  {
    name: 'Shipping Coordination',
    description: 'Your sourced goods booked with established shipping lines and courier partners, door to door.',
    icon: Network,
    image: '/images/art/product-supply-chain.svg',
    alt: 'Illustration of a network with goods moving between hubs',
    points: ['Sea, air or courier chosen to suit the order', 'Tracking shared until delivery', 'A named contact for each shipment'],
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
    image: '/images/art/service-documentation.svg',
    alt: 'Illustration of an order request with a checklist',
  },
  {
    title: 'Source',
    description: 'We shortlist verified suppliers and manufacturers that can make your order.',
    icon: Search,
    image: '/images/art/service-sourcing.svg',
    alt: 'Illustration of factories seen from above',
  },
  {
    title: 'Quote',
    description: 'You receive one clear quote for the goods, packing and shipping. Approve it and we place the order.',
    icon: FileCheck,
    image: '/images/art/service-quote.svg',
    alt: 'Illustration of order documents with an approved stamp',
  },
  {
    title: 'Inspect',
    description: 'Goods are checked for quantity, packing and finish before they leave the supplier.',
    icon: Eye,
    image: '/images/art/product-general-trading.svg',
    alt: 'Illustration of packed pallets ready for inspection',
  },
  {
    title: 'Ship',
    description: 'We book sea, air or courier freight with trusted partners and share the tracking with you.',
    icon: Ship,
    image: '/images/art/service-export.svg',
    alt: 'Illustration of a container ship leaving port',
  },
  {
    title: 'Deliver',
    description: 'Your order arrives at your door or warehouse, with proof of delivery on record.',
    icon: PackageCheck,
    image: '/images/art/service-freight.svg',
    alt: 'Illustration of delivery trucks on a highway',
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
};
