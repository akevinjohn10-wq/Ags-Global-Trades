import { lazy, Suspense, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

const ChatPanel = lazy(() => import('@/components/ui/ChatPanel'));

/**
 * Floating "Ask AGS" launcher. The chat panel itself loads only when someone opens it,
 * so the assistant adds almost nothing to the first page load.
 */
export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  // appear after the intro has played
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 2600);
    return () => window.clearTimeout(t);
  }, []);

  // other parts of the page can open the assistant (e.g. a "Chat with us" link)
  useEffect(() => {
    const onOpen = () => {
      setLoaded(true);
      setOpen(true);
    };
    window.addEventListener('ags:open-chat', onOpen);
    return () => window.removeEventListener('ags:open-chat', onOpen);
  }, []);

  const toggle = () => {
    setLoaded(true);
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="ags-chat"
        aria-label={open ? 'Close chat' : 'Chat with AGS'}
        className={`chat-launcher fixed bottom-5 right-5 z-[35] flex items-center gap-3 rounded-full bg-navy py-2 pl-2 pr-2 text-white shadow-[0_18px_40px_-14px_rgba(10,22,64,0.65)] ring-1 ring-white/10 transition-[transform,opacity] duration-500 ease-expo hover:-translate-y-0.5 sm:bottom-7 sm:right-7 sm:pr-5 ${
          ready && !open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <span className="relative grid h-11 w-11 place-items-center rounded-full bg-accent">
          <MessageCircle size={20} aria-hidden="true" />
          <span aria-hidden="true" className="chat-ping absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[#5BE38F] ring-2 ring-accent" />
        </span>
        <span className="hidden text-[15px] font-medium sm:inline">Ask AGS</span>
      </button>

      {loaded && (
        <Suspense fallback={null}>
          <ChatPanel open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
