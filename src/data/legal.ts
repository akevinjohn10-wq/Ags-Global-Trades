import { contactDetails } from '@/data/siteContent';

export type LegalKey = 'disclaimer' | 'cookies' | 'privacy' | 'terms';

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const email = contactDetails.email;
const updated = 'November 2026';

export const legalDocuments: Record<LegalKey, LegalDocument> = {
  disclaimer: {
    title: 'Disclaimer',
    updated,
    intro:
      'The information on this website is provided by AGS Global Trade ("AGS", "we", "us") for general information about our services.',
    sections: [
      {
        heading: 'No professional advice',
        body: [
          'Nothing on this website is legal, tax, customs or financial advice. Import and export rules differ by country and product, so please confirm requirements with the relevant authorities or your own advisers.',
        ],
      },
      {
        heading: 'Products, prices and availability',
        body: [
          'Product descriptions, specifications, images, prices and availability shown on this website or in our catalogues are indicative only. They are confirmed in a written quotation or contract and may change without notice.',
        ],
      },
      {
        heading: 'Accuracy',
        body: [
          'We try to keep the website accurate and up to date, but we give no guarantee that it is complete, error-free or always available.',
        ],
      },
      {
        heading: 'External links and translation',
        body: [
          'We are not responsible for the content of external websites. Automatic translation of this website is provided by a third party, may contain errors, and the English version is the reference version.',
        ],
      },
      {
        heading: 'Limitation of liability',
        body: [
          'To the extent permitted by law, AGS is not liable for any loss or damage arising from the use of, or reliance on, information on this website.',
        ],
      },
    ],
  },

  cookies: {
    title: 'Cookie Policy',
    updated,
    intro: 'This policy explains how cookies and similar technologies are used on this website.',
    sections: [
      {
        heading: 'What are cookies?',
        body: [
          'Cookies are small text files that a website can store on your device. They are used, for example, to remember settings or to measure how a website is used.',
        ],
      },
      {
        heading: 'Our use of cookies',
        body: [
          'At the time of writing, this website does not set its own cookies and does not use analytics or advertising cookies.',
          'If we add analytics or marketing tools in the future, we will update this policy and ask for your consent where the law requires it.',
        ],
      },
      {
        heading: 'Third-party services',
        body: [
          'Fonts are loaded from Google Fonts, so your browser connects to Google servers and your IP address is visible to Google.',
          'If you choose a language in the translation menu, the page is shown through Google Translate, which may set its own cookies under Google\'s policies.',
        ],
      },
      {
        heading: 'Managing cookies',
        body: [
          'You can block or delete cookies in your browser settings. Blocking some cookies may affect how third-party services such as translation work.',
        ],
      },
      {
        heading: 'Contact',
        body: [`Questions about this policy can be sent to ${email}.`],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    updated,
    intro:
      'This policy explains how AGS Global Trade ("AGS", "we", "us") handles personal data when you visit this website or contact us.',
    sections: [
      {
        heading: 'Who we are',
        body: [
          `AGS Global Trade is an import-export and sourcing business based in New Delhi, India. For privacy questions, contact us at ${email}.`,
        ],
      },
      {
        heading: 'Data we collect',
        body: [
          'Enquiry form: your name, email address, company (optional), product interest and message.',
          'Technical data: your IP address, browser, device and the pages requested, which our hosting provider records for security and operation of the website.',
          'Correspondence: anything you send us by email, phone or messaging.',
        ],
      },
      {
        heading: 'How we use your data',
        body: [
          'To reply to your enquiry and prepare quotations; to manage business relationships; to keep business records and meet legal obligations; and to keep the website secure.',
          'We do not sell personal data and we do not make decisions about you by automated means.',
        ],
      },
      {
        heading: 'Legal basis (visitors from the EEA and UK)',
        body: [
          'We process data to take steps at your request before a contract, for our legitimate interests in responding to business enquiries and running and securing our business, to comply with legal obligations, and with your consent where required.',
        ],
      },
      {
        heading: 'Who we share data with',
        body: [
          'Service providers that help us run the website: Formspree (delivers enquiry form messages to our email), Supabase (stores enquiry form submissions), Vercel (website hosting) and Google (fonts, and translation if you choose it).',
          'Freight, customs and supplier partners, only where needed to carry out an order or quotation you have asked for.',
        ],
      },
      {
        heading: 'International transfers',
        body: [
          'Our providers may process data outside your country, including outside India, the EEA and the UK. Where the law requires it, we rely on appropriate safeguards.',
        ],
      },
      {
        heading: 'How long we keep data',
        body: [
          'We keep enquiry data only as long as needed to respond and for legitimate business records, then delete or anonymise it.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          `Depending on where you live, you may have the right to access, correct, delete or restrict your data, to object to processing, to data portability, and to withdraw consent. Email ${email} to use these rights. You may also complain to your local data protection authority.`,
        ],
      },
      {
        heading: 'Security and children',
        body: [
          'We use reasonable measures to protect your data, but no online service is completely secure. This website is not aimed at anyone under 18.',
        ],
      },
      {
        heading: 'Changes',
        body: ['We may update this policy. The date at the top shows when it was last changed.'],
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    updated,
    intro: 'By using this website you agree to these terms. If you do not agree, please do not use it.',
    sections: [
      {
        heading: 'Use of the website',
        body: [
          'You may use this website for lawful business purposes. You must not misuse it, attempt to disrupt it, or submit false or misleading enquiries.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'The content, logo, design and images on this website belong to AGS or its licensors. You may not copy or reuse them without our written permission.',
        ],
      },
      {
        heading: 'Enquiries and quotations',
        body: [
          'Sending an enquiry does not create a contract. Quotations are valid only for the period stated in them, and an order is binding only when confirmed in writing by both parties.',
          'Prices, specifications, delivery terms (for example Incoterms), payment terms and inspection arrangements are agreed in each quotation or contract.',
        ],
      },
      {
        heading: 'Trade compliance',
        body: [
          'All transactions are subject to applicable export, import, customs and sanctions laws. We may decline or cancel any order that would breach them.',
        ],
      },
      {
        heading: 'Limitation of liability',
        body: [
          'To the extent permitted by law, AGS is not liable for indirect or consequential loss arising from use of this website. Nothing in these terms limits liability that cannot be limited by law.',
        ],
      },
      {
        heading: 'Governing law',
        body: ['These terms are governed by the laws of India, and the courts of New Delhi have jurisdiction, unless a signed contract says otherwise.'],
      },
      {
        heading: 'Contact',
        body: [`Questions about these terms can be sent to ${email}.`],
      },
    ],
  },
};
