import { supabase } from '@/lib/supabase';

export interface InquiryValues {
  name: string;
  email: string;
  company: string;
  productInterest: string;
  message: string;
}

export type InquiryField = keyof InquiryValues;
export type InquiryErrors = Partial<Record<InquiryField, string>>;

export const emptyInquiry: InquiryValues = {
  name: '',
  email: '',
  company: '',
  productInterest: '',
  message: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiry(values: InquiryValues): InquiryErrors {
  const errors: InquiryErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = 'Please enter your name.';
  } else if (name.length > 100) {
    errors.name = 'Name must be 100 characters or fewer.';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address, such as name@company.com.';
  }

  if (values.company.trim().length > 120) {
    errors.company = 'Company must be 120 characters or fewer.';
  }

  if (!values.productInterest) {
    errors.productInterest = 'Please choose a product category.';
  }

  const message = values.message.trim();
  if (!message) {
    errors.message = 'Please enter a message.';
  } else if (message.length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  } else if (message.length > 2000) {
    errors.message = 'Message must be 2,000 characters or fewer.';
  }

  return errors;
}

const FORMSPREE_URL = 'https://formspree.io/f/mwllzano';

export async function submitInquiry(values: InquiryValues): Promise<void> {
  const payload = {
    name: values.name.trim(),
    email: values.email.trim(),
    company: values.company.trim() || 'Not provided',
    productInterest: values.productInterest,
    message: values.message.trim(),
  };

  const [emailResult, dbResult] = await Promise.allSettled([
    fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    }).then((response) => {
      if (!response.ok) throw new Error('Email delivery failed');
    }),
    (async () => {
      if (!supabase) throw new Error('Database not configured');
      const { error } = await supabase.from('inquiries').insert({
        name: payload.name,
        email: payload.email,
        company: values.company.trim() || null,
        product_interest: payload.productInterest,
        message: payload.message,
      });
      if (error) throw error;
    })(),
  ]);

  // Only show an error if BOTH the email and the database save failed
  if (emailResult.status === 'rejected' && dbResult.status === 'rejected') {
    throw new Error('Could not send enquiry');
  }
}

