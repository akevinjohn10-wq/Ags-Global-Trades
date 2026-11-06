import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  FileCheck,
  MessageSquare,
  PackageCheck,
  Search,
  Ship,
  ShieldCheck,
  Stamp,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Products', href: '#products' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

export const stats = [
 
  { value: '3+', label: 'Years Experience' },
  { value: '100%', label: 'Compliance Rate' },
];

export interface Service {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const services: Service[] = [
  {
    title: 'Import Services',
    description: 'Bring goods into your market with end-to-end handling, from supplier to warehouse.',
    icon: ArrowDownToLine,
  },
  {
    title: 'Export Services',
    description: 'Reach new markets with export planning, documentation, and reliable dispatch.',
    icon: ArrowUpFromLine,
  },
  {
    title: 'Freight and Logistics',
    description: 'Sea, air, and road freight coordinated on one plan with live shipment tracking.',
    icon: Truck,
  },
  {
    title: 'Customs Clearance',
    description: 'Accurate declarations and duty management that keep your cargo moving across borders.',
    icon: Stamp,
  },
  {
    title: 'Sourcing and Procurement',
    description: 'Vetted supplier networks and quality checks before every order leaves the factory.',
    icon: Search,
  },
  {
    title: 'Documentation and Compliance',
    description: 'Licences, certificates, and regulatory filings prepared and verified on time.',
    icon: FileCheck,
  },
];

export interface ProductCategory {
  name: string;
  description: string;
  image: string;
  alt: string;
}

export const productCategories: ProductCategory[] = [
  {
    name: 'General Trading',
    description: 'A wide range of goods sourced and supplied to match your business needs.',
    image: 'https://images.pexels.com/photos/35084787/pexels-photo-35084787.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Shelves of packaged goods in a market',
  },
  {
    name: 'Import & Export',
    description: 'End-to-end handling of cross-border shipments, from documentation to delivery.',
    image: 'https://images.pexels.com/photos/9694390/pexels-photo-9694390.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Stacked shipping containers in a logistics yard',
  },
  {
    name: 'Global Sourcing',
    description: 'Verified suppliers and competitive pricing from manufacturing hubs worldwide.',
    image: 'https://images.pexels.com/photos/9824794/pexels-photo-9824794.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Rolls of assorted fabrics from international suppliers',
  },
  {
    name: 'Wholesale Trading',
    description: 'Bulk supply for distributors, retailers, and resellers at scale.',
    image: 'https://images.pexels.com/photos/35084787/pexels-photo-35084787.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Wholesale goods stacked on shelves',
  },
  {
    name: 'Industrial Machinery',
    description: 'Machinery, spare parts, and production systems for a range of industries.',
    image: 'https://images.pexels.com/photos/7598915/pexels-photo-7598915.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Stainless steel tanks in an industrial production facility',
  },
  {
    name: 'Agricultural Commodities',
    description: 'Grains, pulses, and agricultural produce sourced directly from growers.',
    image: 'https://images.pexels.com/photos/11034660/pexels-photo-11034660.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Close-up of wheat grains on a wooden spoon',
  },
  {
    name: 'Metals & Minerals',
    description: 'Ferrous, non-ferrous, and mineral products supplied to specification.',
    image: 'https://images.pexels.com/photos/7598915/pexels-photo-7598915.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Stainless steel industrial equipment',
  },
  {
    name: 'Consumer Goods',
    description: 'Retail-ready products sourced for distribution across markets.',
    image: 'https://images.pexels.com/photos/3520692/pexels-photo-3520692.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Consumer electronic components',
  },
  {
    name: 'Construction Materials',
    description: 'Building and infrastructure materials delivered to project timelines.',
    image: 'https://images.pexels.com/photos/9694390/pexels-photo-9694390.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Bulk materials shipped in containers',
  },
  {
    name: 'OEM & ODM Procurement',
    description: 'Custom-manufactured and white-label products built to your specifications.',
    image: 'https://images.pexels.com/photos/3520692/pexels-photo-3520692.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Circuit board with precision electronic components',
  },
  {
    name: 'Supply Chain & Logistics Coordination',
    description: 'Freight, customs, and tracking managed so shipments arrive on schedule.',
    image: 'https://images.pexels.com/photos/9694390/pexels-photo-9694390.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Shipping containers ready for freight',
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

export const contactDetails = {
  address: ['AGS Trade', 'New Delhi 110045, India'],
  email: 'info@agsglobaltrades.in',
  phone: '+91 9013165871',
  hours: '9:00- 21:00 IST',
  linkedin: 'https://www.linkedin.com/in/aditya-dey-07708634a/',
};
