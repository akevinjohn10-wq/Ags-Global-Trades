import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Blocks,
  Cog,
  Container,
  Cpu,
  Eye,
  FileCheck,
  Globe,
  MessageSquare,
  Network,
  Package,
  PackageCheck,
  Search,
  Ship,
  ShieldCheck,
  ShoppingBag,
  Stamp,
  Truck,
  Users,
  Warehouse,
  Wheat,
  Layers,
  type LucideIcon,
} from 'lucide-react';

export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Products', href: '#products' },
  { label: 'Network', href: '#network' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

/** Rotating statements in the hero (change as you scroll). */
export const heroStatements = [
  'Reliable import-export solutions that move your goods across borders.',
  'From sourcing and customs clearance to final delivery.',
  'One trading partner for every stage of the shipment.',
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
    title: 'Import Services',
    short: 'Supplier to warehouse',
    description: 'Bring goods into your market with end-to-end handling, from supplier to warehouse.',
    icon: ArrowDownToLine,
    image: '/images/art/service-import.svg',
    alt: 'Illustration of a container ship arriving at a port with cranes and stacked containers',
  },
  {
    title: 'Export Services',
    short: 'New markets, reliably',
    description: 'Reach new markets with export planning, documentation, and reliable dispatch.',
    icon: ArrowUpFromLine,
    image: '/images/art/service-export.svg',
    alt: 'Illustration of a loaded container ship departing a port',
  },
  {
    title: 'Freight and Logistics',
    short: 'Sea, air and road',
    description: 'Sea, air, and road freight coordinated on one plan with live shipment tracking.',
    icon: Truck,
    image: '/images/art/service-freight.svg',
    alt: 'Illustration of freight trucks on a highway seen from above',
  },
  {
    title: 'Customs Clearance',
    short: 'Cargo keeps moving',
    description: 'Accurate declarations and duty management that keep your cargo moving across borders.',
    icon: Stamp,
    image: '/images/art/service-customs.svg',
    alt: 'Illustration of customs documents with a cleared stamp',
  },
  {
    title: 'Sourcing and Procurement',
    short: 'Vetted suppliers',
    description: 'Vetted supplier networks and quality checks before every order leaves the factory.',
    icon: Search,
    image: '/images/art/service-sourcing.svg',
    alt: 'Illustration of factory buildings and loading docks seen from above',
  },
  {
    title: 'Documentation and Compliance',
    short: 'Filed on time',
    description: 'Licences, certificates, and regulatory filings prepared and verified on time.',
    icon: FileCheck,
    image: '/images/art/service-documentation.svg',
    alt: 'Illustration of trade documents and a compliance checklist',
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
    points: ['One contact for mixed orders', 'Sourcing matched to your specification', 'Consolidated shipping where it saves cost'],
  },
  {
    name: 'Import & Export',
    description: 'End-to-end handling of cross-border shipments, from documentation to delivery.',
    icon: Container,
    image: '/images/art/product-import-export.svg',
    alt: 'Illustration of a container yard with stacked shipping containers',
    points: ['Documentation prepared for both ends of the route', 'Freight booked on a single plan', 'Updates at every milestone'],
  },
  {
    name: 'Global Sourcing',
    description: 'Verified suppliers and competitive pricing from manufacturing hubs worldwide.',
    icon: Globe,
    image: '/images/art/product-global-sourcing.svg',
    alt: 'Illustration of a dotted world map with sourcing routes from New Delhi',
    points: ['Suppliers audited before we place an order', 'Pricing negotiated on your behalf', 'Quality checks before dispatch'],
  },
  {
    name: 'Wholesale Trading',
    description: 'Bulk supply for distributors, retailers, and resellers at scale.',
    icon: Warehouse,
    image: '/images/art/product-wholesale.svg',
    alt: 'Illustration of warehouse racking with forklifts in the aisles',
    points: ['Bulk volumes for distributors and resellers', 'Packing suited to onward distribution', 'Scheduled replenishment shipments'],
  },
  {
    name: 'Industrial Machinery',
    description: 'Machinery, spare parts, and production systems for a range of industries.',
    icon: Cog,
    image: '/images/art/product-machinery.svg',
    alt: 'Illustration of interlocking machine gears',
    points: ['Machinery and spare parts sourced to specification', 'Heavy and oversized cargo coordinated', 'Technical documents checked before shipping'],
  },
  {
    name: 'Agricultural Commodities',
    description: 'Grains, pulses, and agricultural produce sourced directly from growers.',
    icon: Wheat,
    image: '/images/art/product-agriculture.svg',
    alt: 'Illustration of crop fields, a harvester and grain silos from above',
    points: ['Produce sourced directly from growers', 'Phytosanitary and origin paperwork handled', 'Shipments timed to harvest cycles'],
  },
  {
    name: 'Metals & Minerals',
    description: 'Ferrous, non-ferrous, and mineral products supplied to specification.',
    icon: Layers,
    image: '/images/art/product-metals.svg',
    alt: 'Illustration of steel coils and beams ready for shipment',
    points: ['Grades supplied to your specification', 'Test certificates collected from mills', 'Bulk and break-bulk freight arranged'],
  },
  {
    name: 'Consumer Goods',
    description: 'Retail-ready products sourced for distribution across markets.',
    icon: ShoppingBag,
    image: '/images/art/product-consumer-goods.svg',
    alt: 'Illustration of boxed consumer goods on conveyor belts',
    points: ['Retail-ready packing and labelling', 'Market compliance checked before shipping', 'Flexible order sizes'],
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
    points: ['Manufacturers matched to your design', 'Samples and quality checks before production runs', 'White-label packaging coordinated'],
  },
  {
    name: 'Supply Chain & Logistics Coordination',
    description: 'Freight, customs, and tracking managed so shipments arrive on schedule.',
    icon: Network,
    image: '/images/art/product-supply-chain.svg',
    alt: 'Illustration of a supply chain network with goods moving between hubs',
    points: ['Every leg managed on one plan', 'Customs and tracking in one place', 'A named contact for each shipment'],
  },
];

export interface ProcessStep {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const processSteps: ProcessStep[] = [
  {
    title: 'Inquiry',
    description: 'Share your product, volumes, and timeline. We reply with a tailored proposal within one business day.',
    icon: MessageSquare,
  },
  {
    title: 'Sourcing',
    description: 'We identify vetted suppliers, verify quality and pricing, and negotiate terms on your behalf.',
    icon: Search,
  },
  {
    title: 'Shipping',
    description: 'We book freight, prepare customs paperwork, and track every consignment from origin to port.',
    icon: Ship,
  },
  {
    title: 'Delivery',
    description: 'Goods clear customs and reach your warehouse on schedule, with proof of delivery on record.',
    icon: PackageCheck,
  },
];

export const valuePoints = [
  {
    title: 'Verified Supplier Network',
    description: 'Every partner is audited for quality, certification, and ethical standards before we place an order.',
    icon: ShieldCheck,
  },
  {
    title: 'Real-Time Visibility',
    description: 'Follow each shipment across air, sea, and road, with a clear update at every milestone.',
    icon: Eye,
  },
  {
    title: 'Dedicated Account Team',
    description: 'A named manager who knows your products, your markets, and your priorities.',
    icon: Users,
  },
  {
    title: 'Full Compliance',
    description: 'Customs, tax, and trade documentation handled to the letter, reducing delays and penalties.',
    icon: FileCheck,
  },
];

export const tickerItems = [
  'Import services',
  'Export services',
  'Freight & logistics',
  'Customs clearance',
  'Sourcing & procurement',
  'Documentation & compliance',
];

export const contactDetails = {
  address: ['AGS Trade', 'New Delhi 110045, India'],
  email: 'info@agsglobaltrades.in',
  phone: '+91 9013165871',
  hours: '9:00- 21:00 IST',
  linkedin: 'https://www.linkedin.com/in/aditya-dey-07708634a/',
};
