// Lets any section pre-select a product in the contact form and scroll to it.
export const ENQUIRY_EVENT = 'ags:enquire';

export function requestEnquiry(product: string) {
  window.dispatchEvent(new CustomEvent<string>(ENQUIRY_EVENT, { detail: product }));
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
