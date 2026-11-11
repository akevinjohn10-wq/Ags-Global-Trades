import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import DotMap from '@/components/ui/DotMap';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { allHubs, corridors, homeHub, type Hub } from '@/data/globe';

/** Interactive world map: pick a corridor (or click a port) to light up its routes from New Delhi. */
export default function GlobalReach() {
  const [activeId, setActiveId] = useState(corridors[0].id);
  const corridor = corridors.find((c) => c.id === activeId) ?? corridors[0];
  const activeHubs = useMemo(() => corridor.hubs.map((h) => h.name), [corridor]);

  const selectHub = (hub: Hub) => {
    const match = corridors.find((c) => c.hubs.some((h) => h.name === hub.name));
    if (match) setActiveId(match.id);
  };

  return (
    <section id="network" className="section-y scroll-mt-24 overflow-hidden bg-mist">
      <div className="container-x">
        <SectionHeading
          align="split"
          eyebrow="Sourcing network"
          title={'Sourced worldwide,\ndelivered to you.'}
          description="From our base in New Delhi we source from manufacturing hubs around the world and deliver to buyers wherever they are. Choose a region, or click a city on the map."
        />

        {/* Corridor tabs */}
        <Reveal className="mt-12 lg:mt-16">
          <div role="tablist" aria-label="Regions" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            {corridors.map((c) => {
              const selected = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="corridor-panel"
                  onClick={() => setActiveId(c.id)}
                  className={`group flex shrink-0 items-center gap-2 rounded-md border px-4 py-2.5 font-mono text-[13px] lg:text-[14px] uppercase tracking-eyebrow transition-all duration-300 ${
                    selected ? 'border-accent bg-accent text-white' : 'border-ink/10 bg-paper text-ink/70 hover:border-ink hover:text-ink'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 transition-colors ${selected ? 'bg-white' : 'bg-accent'}`} aria-hidden="true" />
                  {c.name}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={120} className="mt-6">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#050B1E] shadow-[0_40px_90px_-50px_rgba(10,22,64,0.8)]">
            <div className="relative aspect-[2/1] sm:aspect-[2.45/1]">
              <DotMap
                theme="night"
                hubs={allHubs}
                activeHubs={activeHubs}
                interactive
                onHubSelect={selectHub}
                density={8}
                label={`World map highlighting routes from ${homeHub.name} to ${corridor.name}`}
              />
            </div>

            {/* Corridor details card */}
            <div
              id="corridor-panel"
              role="tabpanel"
              aria-live="polite"
              className="border-t border-line p-5 sm:absolute sm:bottom-6 sm:right-6 sm:w-[340px] sm:rounded-md sm:border sm:bg-paper/95 sm:p-6 sm:shadow-[0_20px_60px_-30px_rgba(27,30,36,0.4)] sm:backdrop-blur-md"
            >
              <div key={corridor.id} className="animate-panelin">
                <p className="mono-caps text-accent">Region</p>
                <h3 className="mt-2 font-display text-[26px] leading-none text-ink">{corridor.name}</h3>
                <p className="mt-3 text-[16px] lg:text-[17px] leading-[1.6] text-muted">{corridor.summary}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  <li className="flex items-center gap-1.5 rounded bg-accent px-2.5 py-1.5 font-mono text-[12px] lg:text-[13px] uppercase tracking-eyebrow text-white">
                    <span className="h-1.5 w-1.5 bg-white" aria-hidden="true" />
                    {homeHub.name}
                  </li>
                  {corridor.hubs.map((hub) => (
                    <li key={hub.name} className="flex items-center gap-1.5 rounded bg-mist px-2.5 py-1.5 font-mono text-[12px] lg:text-[13px] uppercase tracking-eyebrow text-ink">
                      <MapPin size={12} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
                      {hub.name}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[13px] lg:text-[14px] text-soft">Example cities shown for each region.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
