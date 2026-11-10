import { Container, Package, Plane, Ship, Truck, TrainFront, Warehouse, Boxes } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';

const MODES = [
  { label: 'Sea freight · Full container', icon: Container },
  { label: 'Sea freight · Shared container', icon: Boxes },
  { label: 'Air freight', icon: Plane },
  { label: 'Express courier', icon: Package },
  { label: 'Road freight', icon: Truck },
  { label: 'Rail freight', icon: TrainFront },
  { label: 'Ocean shipping lines', icon: Ship },
  { label: 'Door-to-door delivery', icon: Warehouse },
];

/** Grid of the ways an order can travel, laid out like a partner-logo wall. */
export default function ShippingModes() {
  return (
    <section aria-label="How we ship" className="section-y bg-mist">
      <div className="container-x">
        <SectionHeading
          align="split"
          eyebrow="How we ship"
          title={'The right route\nfor every order.'}
          description="We choose the shipping method that suits your order's size, budget and deadline, and book it with established shipping lines, freight agents and courier partners."
        />
        <Reveal className="mt-14 lg:mt-20">
          <ul className="grid grid-cols-2 border-l border-t border-dashed border-ink/20 sm:grid-cols-4">
            {MODES.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="group relative flex aspect-[4/3] flex-col items-center justify-center gap-4 border-b border-r border-dashed border-ink/20 p-4 text-center transition-colors duration-500 hover:bg-accent hover:text-white"
              >
                <span aria-hidden="true" className="absolute -left-[5px] -top-[5px] h-[9px] w-[9px] bg-mist text-[9px] leading-[9px] text-ink/40">
                  +
                </span>
                <Icon size={30} strokeWidth={1.25} aria-hidden="true" className="text-ink transition-transform duration-500 ease-expo group-hover:-translate-y-1 group-hover:text-white" />
                <span className="mono-caps text-ink/70 group-hover:text-white">{label}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
