import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { LegalDocument } from '@/data/legal';

interface LegalModalProps {
  doc: LegalDocument;
  onClose: () => void;
}

export default function LegalModal({ doc, onClose }: LegalModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg border border-line bg-paper shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div>
            <h2 id="legal-title" className="text-xl font-medium text-ink sm:text-2xl">
              {doc.title}
            </h2>
            <p className="mt-1 text-sm text-muted">Last updated: {doc.updated}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md border border-line p-2 text-muted transition-colors hover:border-ink hover:bg-ink hover:text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 text-[15px] leading-[1.7] text-muted sm:p-6">
          <p>{doc.intro}</p>
          {doc.sections.map((section) => (
            <section key={section.heading} className="mt-6">
              <h3 className="text-base font-medium text-ink">{section.heading}</h3>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-2">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
