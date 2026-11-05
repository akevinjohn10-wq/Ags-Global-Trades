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

export async function submitInquiry(values: InquiryValues): Promise<void> {
  const { error } = await supabase.from('inquiries').insert({
    name: values.name.trim(),
    email: values.email.trim(),
    company: values.company.trim() || null,
    product_interest: values.productInterest,
    message: values.message.trim(),
  });

  if (error) {
    throw error;
  }
}
