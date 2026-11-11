import { useEffect, useState, type ChangeEvent, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import { CircleCheck, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { productCategories } from '@/data/siteContent';
import { ENQUIRY_EVENT, type EnquiryDetail } from '@/lib/enquiry';
import {
  emptyInquiry,
  submitInquiry,
  validateInquiry,
  type InquiryErrors,
  type InquiryField,
  type InquiryValues,
} from '@/lib/inquiries';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface FieldProps {
  id: InquiryField;
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}

function Field({ id, label, error, optional, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mono-caps mb-2 block text-ink">
        {label}
        {optional && <span className="text-soft"> (optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-signal">
          {error}
        </p>
      )}
    </div>
  );
}

export default function InquiryForm() {
  const [values, setValues] = useState<InquiryValues>(emptyInquiry);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  // Quantity and destination are sent as part of the message, so the stored record format is unchanged
  const [quantity, setQuantity] = useState('');
  const [destination, setDestination] = useState('');

  const isSubmitting = status === 'submitting';

  // "Enquire about this" buttons elsewhere on the page pre-select the product
  useEffect(() => {
    const onEnquire = (event: Event) => {
      const detail = (event as CustomEvent<EnquiryDetail | string>).detail;
      const product = typeof detail === 'string' ? detail : detail?.product;
      const message = typeof detail === 'string' ? undefined : detail?.message;
      if (!product) return;
      setStatus('idle');
      setValues((current) => ({ ...current, productInterest: product, message: message ?? current.message }));
      setErrors((current) => ({ ...current, productInterest: undefined }));
    };
    window.addEventListener(ENQUIRY_EVENT, onEnquire);
    return () => window.removeEventListener(ENQUIRY_EVENT, onEnquire);
  }, []);

  function refreshFieldError(field: InquiryField, nextValues: InquiryValues) {
    const fieldError = validateInquiry(nextValues)[field];
    setErrors((current) => ({ ...current, [field]: fieldError }));
  }

  function handleChange(event: ChangeEvent<FieldElement>) {
    const field = event.target.name as InquiryField;
    const nextValues = { ...values, [field]: event.target.value };
    setValues(nextValues);
    if (errors[field]) {
      refreshFieldError(field, nextValues);
    }
  }

  function handleBlur(event: FocusEvent<FieldElement>) {
    refreshFieldError(event.target.name as InquiryField, values);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateInquiry(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    try {
      const extra = [quantity.trim() && `Quantity: ${quantity.trim()}`, destination.trim() && `Deliver to: ${destination.trim()}`]
        .filter(Boolean)
        .join('\n');
      await submitInquiry({ ...values, message: extra ? `${extra}\n\n${values.message}` : values.message });
      setValues(emptyInquiry);
      setQuantity('');
      setDestination('');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex h-full flex-col items-start justify-center gap-6 py-8" role="status">
        <CircleCheck size={40} strokeWidth={1.5} className="text-accent" aria-hidden="true" />
        <div>
          <h3 className="font-display text-2xl text-ink">Thank you for your enquiry.</h3>
          <p className="mt-3 text-[16px] lg:text-[18px] leading-[1.7] text-muted">
            Your message has reached our team. A member of staff will respond within one business day.
          </p>
        </div>
        <Button variant="outline" onClick={() => setStatus('idle')}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Full Name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="field-input"
          />
        </Field>

        <Field id="email" label="Email Address" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="field-input"
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="company" label="Company" error={errors.company} optional>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            value={values.company}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={errors.company ? 'company-error' : undefined}
            className="field-input"
          />
        </Field>

        <Field id="productInterest" label="Product category" error={errors.productInterest}>
          <select
            id="productInterest"
            name="productInterest"
            value={values.productInterest}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(errors.productInterest)}
            aria-describedby={errors.productInterest ? 'productInterest-error' : undefined}
            className="field-input"
          >
            <option value="" disabled>
              Select a category
            </option>
            {productCategories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
            <option value="Other / Not sure">Other / Not sure</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="quantity" className="mono-caps mb-2 block text-ink">
            Quantity <span className="text-soft">(optional)</span>
          </label>
          <input
            id="quantity"
            name="quantity"
            type="text"
            inputMode="text"
            placeholder="e.g. 500 units, 2 tonnes"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="destination" className="mono-caps mb-2 block text-ink">
            Deliver to <span className="text-soft">(optional)</span>
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            autoComplete="country-name"
            placeholder="City, country"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className="field-input"
          />
        </div>
      </div>

      <Field id="message" label="What do you need?" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={values.message}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
          placeholder="Describe the product: specification, size, colour, target price and timeline."
          className="field-input resize-y"
        />
      </Field>

      <div aria-live="polite">
        {status === 'error' && (
          <p role="alert" className="rounded-md border border-signal bg-signal/5 px-4 py-3 text-sm font-medium text-ink">
            We could not send your enquiry. Please try again, or email us directly.
          </p>
        )}
      </div>

      <Button type="submit" variant="accent" disabled={isSubmitting} arrow={!isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            Sending
          </span>
        ) : (
          'Send enquiry'
        )}
      </Button>
    </form>
  );
}
