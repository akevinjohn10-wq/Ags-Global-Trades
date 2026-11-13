import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Mail, MessageCircle, Phone, RotateCcw, X } from 'lucide-react';
import { catalogues, contactDetails, productCategories } from '@/data/siteContent';
import { FAQS } from '@/components/sections/Faq';
import { submitInquiry } from '@/lib/inquiries';

/* ------------------------------------------------------------------ *
 * A guided assistant: answers common questions, points to catalogues
 * and collects a quote request, which is sent the same way as the
 * contact form (email to the team + saved enquiry).
 * ------------------------------------------------------------------ */

type Who = 'bot' | 'me';
interface Msg {
  id: number;
  who: Who;
  text: string;
}
interface Chip {
  label: string;
  run: () => void;
}
type Step = 'menu' | 'product' | 'category' | 'quantity' | 'destination' | 'name' | 'email' | 'review' | 'sending' | 'done';

interface Quote {
  product: string;
  category: string;
  quantity: string;
  destination: string;
  name: string;
  email: string;
}
const emptyQuote: Quote = { product: '', category: '', quantity: '', destination: '', name: '', email: '' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const waDigits = contactDetails.whatsapp.replace(/\D/g, '');
const telHref = `tel:${contactDetails.phone.replace(/\s/g, '')}`;
const waLink = (text: string) => `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`;

/** Which prompt and placeholder the text box shows at each step */
const PROMPTS: Partial<Record<Step, { ask: string; placeholder: string }>> = {
  product: { ask: 'What product do you need? A name, model or short description is fine.', placeholder: 'e.g. compressed sofa beds' },
  quantity: { ask: 'How many units (or what volume) do you need?', placeholder: 'e.g. 200 pieces, 1 × 40ft container' },
  destination: { ask: 'Which country and city should it be delivered to?', placeholder: 'e.g. Dubai, UAE' },
  name: { ask: 'Great. What’s your name?', placeholder: 'Your name' },
  email: { ask: 'And your email, so our team can send the quote?', placeholder: 'name@company.com' },
};

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [step, setStep] = useState<Step>('menu');
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const quote = useRef<Quote>({ ...emptyQuote });
  const idRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const push = (who: Who, text: string) => setMsgs((m) => [...m, { id: ++idRef.current, who, text }]);

  /** Bot replies arrive after a short "typing" beat; chips appear with the last line */
  const say = useCallback(
    (lines: string[], next: Chip[] = [], nextStep?: Step) => {
      setChips([]);
      setTyping(true);
      let delay = 0;
      lines.forEach((line, i) => {
        delay += reduce ? 0 : Math.min(900, 350 + line.length * 6);
        timers.current.push(
          window.setTimeout(() => {
            push('bot', line);
            if (i === lines.length - 1) {
              setTyping(false);
              setChips(next);
              if (nextStep) setStep(nextStep);
            }
          }, delay),
        );
      });
    },
    [reduce],
  );

  /* ---------------- flows ---------------- */

  const menuChips = (): Chip[] => [
    { label: 'Get a quote', run: () => pick('Get a quote', startQuote) },
    { label: 'Browse catalogues', run: () => pick('Browse catalogues', showCatalogues) },
    { label: 'Common questions', run: () => pick('Common questions', showFaqs) },
    { label: 'Talk to a person', run: () => pick('Talk to a person', showContact) },
  ];

  const menu = (lead = 'Anything else I can help with?') => say([lead], menuChips(), 'menu');

  function pick(label: string, fn: () => void) {
    push('me', label);
    fn();
  }

  function startQuote(prefill?: Partial<Quote>) {
    quote.current = { ...emptyQuote, ...prefill };
    if (quote.current.product) {
      say([`Sure, let’s get you a quote for ${quote.current.product}.`, PROMPTS.quantity!.ask], [], 'quantity');
    } else {
      say(['Happy to help. I’ll ask a few quick questions and pass them to our sourcing team.', PROMPTS.product!.ask], [], 'product');
    }
  }

  function askCategory() {
    say(
      ['Which category fits best?'],
      productCategories.map((c) => ({
        label: c.name,
        run: () => {
          push('me', c.name);
          quote.current.category = c.name;
          say([PROMPTS.quantity!.ask], [], 'quantity');
        },
      })),
      'category',
    );
  }

  function review() {
    const q = quote.current;
    say(
      [
        `Here’s your request:\n• Product: ${q.product}\n• Category: ${q.category}\n• Quantity: ${q.quantity}\n• Deliver to: ${q.destination}\n• Name: ${q.name}\n• Email: ${q.email}`,
        'Shall I send this to our team?',
      ],
      [
        { label: 'Send request', run: () => pick('Send request', send) },
        { label: 'Start over', run: () => pick('Start over', () => startQuote()) },
      ],
      'review',
    );
  }

  async function send() {
    const q = quote.current;
    setStep('sending');
    setChips([]);
    setTyping(true);
    try {
      await submitInquiry({
        name: q.name,
        email: q.email,
        company: '',
        productInterest: q.category || 'General Trading',
        message: `Product: ${q.product}\nQuantity: ${q.quantity}\nDeliver to: ${q.destination}\n\n(Sent from the website chat assistant)`,
      });
      setTyping(false);
      say(
        [
          `Thanks, ${q.name.split(' ')[0]}! Your request is with our sourcing team. We reply within one business day at ${q.email}.`,
          'Need it faster? Message us on WhatsApp and mention your request.',
        ],
        [
          { label: 'Open WhatsApp', run: () => window.open(waLink(`Hi AGS, I just sent a quote request for ${q.product} (${q.quantity}) to ${q.destination}.`), '_blank', 'noopener') },
          { label: 'Back to menu', run: () => pick('Back to menu', () => menu()) },
        ],
        'done',
      );
    } catch {
      setTyping(false);
      say(
        ['Sorry, that didn’t go through. You can send the same details on WhatsApp or by email instead.'],
        [
          { label: 'Send on WhatsApp', run: () => window.open(waLink(`Hi AGS, I need a quote.\nProduct: ${q.product}\nQuantity: ${q.quantity}\nDeliver to: ${q.destination}\nName: ${q.name}`), '_blank', 'noopener') },
          { label: 'Try again', run: () => pick('Try again', send) },
        ],
        'review',
      );
    }
  }

  function showCatalogues() {
    say(
      ['We have product catalogues for these ranges. Which one interests you?'],
      catalogues.map((c) => ({
        label: c.title,
        run: () => {
          push('me', c.title);
          say(
            [`${c.title}: ${c.summary} (${c.pages} pages)`, 'You can preview sample pages now, or ask us for the full catalogue with prices.'],
            [
              {
                label: 'Preview pages',
                run: () => {
                  window.dispatchEvent(new CustomEvent('ags:open-catalogue', { detail: c.slug }));
                  onClose();
                },
              },
              { label: 'Get the full catalogue', run: () => pick('Get the full catalogue', () => startQuote({ product: `${c.title} (full catalogue)`, category: c.category })) },
              { label: 'Back to menu', run: () => pick('Back to menu', () => menu()) },
            ],
            'menu',
          );
        },
      })),
      'menu',
    );
  }

  function showFaqs() {
    say(
      ['Here are the questions we get most:'],
      FAQS.map((f) => ({ label: f.q, run: () => pick(f.q, () => answer(f.a)) })),
      'menu',
    );
  }

  function answer(text: string) {
    say(
      [text],
      [
        { label: 'Get a quote', run: () => pick('Get a quote', () => startQuote()) },
        { label: 'More questions', run: () => pick('More questions', showFaqs) },
        { label: 'Back to menu', run: () => pick('Back to menu', () => menu()) },
      ],
      'menu',
    );
  }

  function showContact() {
    say(
      [`You can reach our team ${contactDetails.hours.replace('- ', '–')}:\n• WhatsApp: ${contactDetails.whatsapp}\n• Phone: ${contactDetails.phone}\n• Email: ${contactDetails.email}`],
      [
        { label: 'WhatsApp us', run: () => window.open(waLink('Hi AGS, I have a question.'), '_blank', 'noopener') },
        { label: 'Call', run: () => (window.location.href = telHref) },
        { label: 'Email', run: () => (window.location.href = `mailto:${contactDetails.email}`) },
        { label: 'Back to menu', run: () => pick('Back to menu', () => menu()) },
      ],
      'menu',
    );
  }

  /** Free text typed at the menu: match it to the closest topic */
  function route(text: string) {
    const t = text.toLowerCase();
    const has = (...w: string[]) => w.some((x) => t.includes(x));
    if (has('quote', 'price', 'cost', 'rate', 'buy', 'order', 'need', 'looking for', 'source', 'supply')) return startQuote();
    if (has('catalog', 'brochure', 'range', 'pdf')) return showCatalogues();
    if (has('ship', 'deliver', 'freight', 'courier', 'track')) return answer(FAQS[3].a);
    if (has('quality', 'inspect', 'check', 'verify', 'sample')) return answer(FAQS[4].a);
    if (has('minimum', 'moq', 'quantity', 'small order', 'trial')) return answer(FAQS[2].a);
    if (has('product', 'categor', 'what do you', 'what can')) return answer(FAQS[1].a);
    if (has('whatsapp', 'call', 'phone', 'email', 'contact', 'talk', 'human', 'person', 'team')) return showContact();
    if (has('hi', 'hello', 'hey', 'namaste')) return menu('Hello! What can I help you with?');
    say(['I’m not sure I understood that. I can help with these, or you can talk to our team directly:'], menuChips(), 'menu');
  }

  /* ---------------- input ---------------- */

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || typing) return;
    const q = quote.current;
    if (step === 'email' && !EMAIL.test(text)) {
      push('me', text);
      setInput('');
      say(['That email doesn’t look right. Could you check it? (e.g. name@company.com)'], [], 'email');
      return;
    }
    push('me', text);
    setInput('');
    switch (step) {
      case 'product':
        q.product = text.slice(0, 200);
        return askCategory();
      case 'category': // typed instead of tapping a chip
        q.category = text.slice(0, 80);
        return say([PROMPTS.quantity!.ask], [], 'quantity');
      case 'quantity':
        q.quantity = text.slice(0, 120);
        return say([PROMPTS.destination!.ask], [], 'destination');
      case 'destination':
        q.destination = text.slice(0, 120);
        return say([PROMPTS.name!.ask], [], 'name');
      case 'name':
        q.name = text.slice(0, 100);
        return say([`Thanks, ${q.name.split(' ')[0]}. ${PROMPTS.email!.ask}`], [], 'email');
      case 'email':
        q.email = text.slice(0, 254);
        return review();
      default:
        return route(text);
    }
  };

  const restart = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setMsgs([]);
    setTyping(false);
    quote.current = { ...emptyQuote };
    start();
  };

  function start() {
    say(
      ['Hi, I’m the AGS assistant 👋', 'I can get you a quote, show our catalogues or answer common questions. What would you like to do?'],
      menuChips(),
      'menu',
    );
  }

  /* ---------------- lifecycle ---------------- */

  // greet once, the first time the panel opens
  useEffect(() => {
    if (open && msgs.length === 0 && !typing) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // keep the newest message in view
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [msgs, typing, chips, reduce]);

  // focus the text box when it's useful; Esc closes
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && PROMPTS[step]) inputRef.current?.focus({ preventScroll: true });
  }, [step, open]);

  const prompt = PROMPTS[step];
  const inputDisabled = typing || step === 'sending' || step === 'review';
  const placeholder = prompt?.placeholder ?? (step === 'category' ? 'Pick a category above, or type one' : 'Type a question…');

  return (
    <div
      id="ags-chat"
      role="dialog"
      aria-label="AGS assistant"
      aria-modal="false"
      className={`chat-panel fixed z-[70] flex flex-col overflow-hidden bg-paper text-ink shadow-[0_40px_100px_-30px_rgba(10,22,64,0.55)] ring-1 ring-ink/10 inset-x-2 bottom-2 h-[min(640px,calc(100svh-16px))] rounded-2xl sm:inset-x-auto sm:bottom-7 sm:right-7 sm:h-[min(620px,calc(100svh-56px))] sm:w-[400px] ${
        open ? 'is-open' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      {/* header */}
      <div className="relative flex items-center gap-3 bg-navy px-5 py-4 text-white">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent ring-1 ring-white/15">
          <svg viewBox="-40 0 260 200" width="26" height="20" aria-hidden="true">
            <polygon points="10,175 70,25 108,25 168,175 126,175 89,79 52,175" fill="#F3F5FA" />
            <path d="M-26 186 C40 136 120 104 214 84 C126 106 50 142 -26 186 Z" fill="#B8C4E6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-tight">AGS Assistant</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-sky">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BE38F]" aria-hidden="true" />
            Replies within 1 business day
          </p>
        </div>
        <button type="button" onClick={restart} aria-label="Start over" className="grid h-9 w-9 place-items-center rounded-full text-sky transition-colors hover:bg-white/10 hover:text-white">
          <RotateCcw size={17} aria-hidden="true" />
        </button>
        <button type="button" onClick={onClose} aria-label="Close chat" className="grid h-9 w-9 place-items-center rounded-full text-sky transition-colors hover:bg-white/10 hover:text-white">
          <X size={19} aria-hidden="true" />
        </button>
      </div>

      {/* conversation */}
      <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto bg-mist/60 px-4 py-5" aria-live="polite" aria-relevant="additions">
        {msgs.map((m) => (
          <div key={m.id} className={`chat-msg flex ${m.who === 'me' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[14.5px] leading-[1.5] ${
                m.who === 'me' ? 'rounded-br-md bg-accent text-white' : 'rounded-bl-md bg-paper text-ink ring-1 ring-line'
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start" aria-label="Assistant is typing">
            <span className="chat-typing inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-paper px-4 py-3.5 ring-1 ring-line">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
        {chips.length > 0 && (
          <div className="chat-msg flex flex-wrap gap-2 pt-1">
            {chips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={c.run}
                className="rounded-full border border-accent/30 bg-paper px-3.5 py-2 text-left text-[13.5px] font-medium text-accent transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-white"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* quick contact strip + input */}
      <div className="border-t border-line bg-paper">
        <div className="flex items-center gap-4 px-5 pt-2.5 text-[12.5px] text-muted">
          <a href={waLink('Hi AGS, I have a question.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-accent">
            <MessageCircle size={13} aria-hidden="true" /> WhatsApp
          </a>
          <a href={telHref} className="inline-flex items-center gap-1.5 hover:text-accent">
            <Phone size={13} aria-hidden="true" /> Call
          </a>
          <a href={`mailto:${contactDetails.email}`} className="inline-flex items-center gap-1.5 hover:text-accent">
            <Mail size={13} aria-hidden="true" /> Email
          </a>
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 p-3">
          <label htmlFor="chat-input" className="sr-only">
            {prompt?.ask ?? 'Message'}
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={inputDisabled}
            type={step === 'email' ? 'email' : 'text'}
            autoComplete={step === 'email' ? 'email' : step === 'name' ? 'name' : 'off'}
            maxLength={300}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-full border border-line bg-mist/50 px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-soft focus:border-accent focus:bg-paper disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={inputDisabled || !input.trim()}
            aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white transition-[background-color,opacity] hover:bg-accent2 disabled:opacity-40"
          >
            <ArrowUp size={19} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
