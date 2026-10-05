/**
 * GOLD's Non-Disclosure & Brokerage Cooperation Agreement, word for word as GOLD
 * provided it.
 *
 * One copy, used everywhere: the signing page shows it and is where it's signed,
 * and the admin shows it next to each signature. NDA_VERSION is stored with
 * every signature, so a later edit to the wording never changes what an earlier
 * signer agreed to -- change the version whenever the text changes.
 */
export const NDA_VERSION = '2026-10';

export const NDA_TITLE = 'Non-Disclosure & Brokerage Cooperation Agreement';

export type NdaSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Text after the bullets, when a section continues once the list ends. */
  after?: string[];
};

/** "This Agreement is entered into between: …" -- the parties, before section 1. */
export const NDA_PARTIES_INTRO = 'This Agreement is entered into between:';
export const NDA_GOLD_PARTY = 'Gold Investment Opportunities';
export const NDA_GOLD_ALIAS = 'Hereinafter referred to as “Gold”';
export const NDA_PARTIES_OUTRO = 'Collectively referred to as the “Parties.”';

/** The other party's details, in the order the agreement lists them. */
export const NDA_SIGNER_FIELDS = [
  { key: 'name', label: 'Broker / Sales Partner / Client' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Contact Number' },
  { key: 'email', label: 'E-mail' }
] as const;

export const NDA_SECTIONS: NdaSection[] = [
  {
    heading: '1. Purpose',
    paragraphs: [
      'The purpose of this Agreement is to protect the confidentiality of client information, property/unit details, business opportunities, and commission arrangements shared between Gold and the Broker in connection with real estate sales, rentals, resales, and brokerage activities.'
    ]
  },
  {
    heading: '2. Client & Property Data Confidentiality',
    paragraphs: [
      'All information shared by Gold or the Broker shall be considered confidential, including but not limited to:'
    ],
    bullets: [
      'Client names and contact details',
      'Property owners’ information',
      'Buyer, tenant, or investor information',
      'Unit specifications, prices, payment plans, and availability',
      'Property photos, documents, contracts, and ownership information',
      'Leads and client requirements',
      'Any information exchanged through Gold’s systems, databases, or platforms'
    ],
    after: [
      'The receiving party shall not disclose, copy, transfer, sell, or use such information for any purpose other than the agreed real estate transaction.'
    ]
  },
  {
    heading: '3. Clients Listing Their Units with Gold',
    paragraphs: [
      'When a property owner or client lists a unit directly with Gold, the client and property information shall remain confidential and shall be considered part of Gold’s client database.',
      'No Broker or Sales Partner receiving access to such information may directly approach, solicit, register, or transact with the client outside Gold without Gold’s prior written approval.',
      'Any transaction resulting from such client or property information shall remain subject to Gold’s agreed brokerage and commission arrangements.'
    ]
  },
  {
    heading: '4. Mix & Match Opportunities',
    paragraphs: [
      'Gold may introduce or match:',
      'Property Owner / Seller / Broker / Buyer / Tenant / Investor',
      'through its Mix & Match service.',
      'Where Gold provides client or property information to facilitate such an opportunity:'
    ],
    bullets: [
      'The information shall remain confidential.',
      'Neither party may bypass Gold or directly conclude a transaction with the introduced party without Gold’s written approval.',
      'The introduced client/property shall remain protected for the agreed transaction and protection period.',
      'Any commission due to Gold and/or the Broker shall be respected according to the agreed commission structure.'
    ]
  },
  {
    heading: '5. Broker & Sales Commission Protection',
    paragraphs: [
      'All commissions shall be agreed upon in writing before or at the time of introducing the client, property, or transaction.',
      'No party shall intentionally circumvent another party in order to avoid, reduce, or transfer an agreed commission.',
      'Where a transaction is completed as a result of a lead, client, property, introduction, or opportunity provided by Gold, the applicable Gold commission shall remain payable according to the agreed terms, even if the transaction is subsequently completed directly between the parties.',
      'Where a Broker introduces a client or buyer to Gold, the Broker’s agreed commission shall likewise be protected according to the agreed terms, provided that the Broker can establish the original introduction.'
    ]
  },
  {
    heading: '6. Non-Circumvention',
    paragraphs: [
      'Neither party shall intentionally bypass, circumvent, or exclude the other party from a transaction involving a client, property, buyer, seller, tenant, landlord, or investor introduced by the other party.',
      'This protection shall apply to direct transactions, indirect transactions, transactions through another broker, company, representative, affiliate, or related party.'
    ]
  },
  {
    heading: '7. Use of Client Information',
    paragraphs: [
      'Client information may only be used for the specific real estate purpose for which it was provided.',
      'It may not be:'
    ],
    bullets: [
      'Added to another database without authorization',
      'Shared with unauthorized third parties',
      'Used for unrelated marketing',
      'Sold or transferred',
      'Used to approach the client outside the agreed transaction'
    ]
  },
  {
    heading: '8. Confidentiality Period',
    paragraphs: [
      'The confidentiality and non-circumvention obligations under this Agreement shall remain effective during the relationship between the Parties and for 12 months following the last disclosure, introduction, or transaction, unless otherwise agreed in writing.'
    ]
  },
  {
    heading: '9. Breach',
    paragraphs: [
      'Any unauthorized disclosure, misuse of client data, circumvention, or attempt to avoid an agreed commission shall constitute a breach of this Agreement.',
      'The affected party shall retain the right to seek any remedies available under applicable law, including recovery of any agreed or lost commission and damages where legally applicable.'
    ]
  },
  {
    heading: '10. Governing Law',
    paragraphs: [
      'This Agreement shall be governed by the applicable laws of the Arab Republic of Egypt, unless otherwise agreed in writing by the Parties.'
    ]
  },
  {
    heading: '11. Acknowledgment',
    paragraphs: [
      'By signing below, the Parties acknowledge that they have read, understood, and agreed to the confidentiality, client-data protection, commission-protection, and non-circumvention provisions of this Agreement.'
    ]
  }
];

/** The signature block's lines, under "Broker / Sales Partner / Client". */
export const NDA_SIGNATURE_FIELDS = ['Name', 'Company (Optional)', 'Signature', 'Date'] as const;
