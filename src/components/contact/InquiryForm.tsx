import { useState, type ChangeEvent, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import { CircleCheck, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { productCategories } from '@/data/siteContent';
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
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-ink">
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

  const isSubmitting = status === 'submitting';

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
      await submitInquiry(values);
      setValues(emptyInquiry);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex h-full flex-col items-start justify-center gap-6 py-8" role="status">
        <CircleCheck size={40} strokeWidth={1.5} className="text-ink" aria-hidden="true" />
        <div>
          <h3 className="text-2xl">Thank you for your enquiry.</h3>
          <p className="mt-3 text-[16px] leading-[1.7] text-muted">
            Your message has reached our team. A member of staff will respond within one business day.
          </p>
        </div>
        <Button variant="outline" onClick={() => setStatus('idle')}>
          Send Another Enquiry
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

        <Field id="productInterest" label="Product Interest" error={errors.productInterest}>
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

      <Field id="message" label="Message" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={values.message}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
          placeholder="Tell us about volumes, origin or destination, and your timeline."
          className="field-input resize-y"
        />
      </Field>

      <div aria-live="polite">
        {status === 'error' && (
          <p role="alert" className="rounded-[4px] border border-ink px-4 py-3 text-sm font-medium text-ink">
            We could not send your enquiry. Please try again, or email us directly.
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            Sending
          </>
        ) : (
          'Send Enquiry'
        )}
      </Button>
    </form>
  );
}
