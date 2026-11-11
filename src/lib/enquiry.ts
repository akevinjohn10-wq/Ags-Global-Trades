// Lets any section pre-select a product (and optionally a message) in the contact form and scroll to it.
export const ENQUIRY_EVENT = 'ags:enquire';

export interface EnquiryDetail {
  product: string;
  message?: string;
}

export function requestEnquiry(product: string, message?: string) {
  window.dispatchEvent(new CustomEvent<EnquiryDetail>(ENQUIRY_EVENT, { detail: { product, message } }));
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
