module.exports = {
  pageTitle: 'What Credit Card Should You Get? | Caleb Hammer',

  // Branding
  creatorName:    'Caleb Hammer',
  creatorTagline: 'Financial Audit',
  creatorPhoto:   'photo.jpg',
  accentColor:    '#e1fd0c',
  accentText:     '#3a4f00',
  accentRgb:      '225, 253, 12',
  accentOnWhite:  '#3a4f00',  // readable accent text on white backgrounds

  // Hero copy
  heroH1:      ['Find Your ', 'Perfect', ' Credit Card'],
  heroSubtext: 'Five questions. No fluff. Get a card recommendation based on your actual financial situation.',
  trustPills:  ['No email required', 'No sign-up', 'Results in 60 seconds'],

  // Voice
  voiceLabel:      "Caleb's Take",
  redirectMessage: "Pay it off. Every month. Full balance. I don't care how good the rewards look. Carrying a balance means you are paying interest that wipes out every single point you earned and then some. The card is a tool, not a loan. Treat it like one.",

  // Tracking
  ga4Id:      '',   // e.g. 'G-XXXXXXXXXX'
  subIdParam: 's1',

  // Affiliate redirect URLs
  redirectUrls: {
    balance_transfer: 'https://oc.brcclx.com/t?lid=26770731',
    business:         'https://oc.brcclx.com/t?lid=26770735',
    everyday:         'https://oc.brcclx.com/t?lid=26770732',
    travel:           'https://oc.brcclx.com/t?lid=26770733',
    premium_travel:   'https://oc.brcclx.com/t?lid=26770734',
  },

  // Result display
  resultDisplay: {
    balance_transfer: { name: 'Balance Transfer Card', type: 'Pay Off Your Debt Faster' },
    business:         { name: 'Business Rewards Card', type: 'Built for Business Owners' },
    everyday:         { name: 'Everyday Rewards Card', type: 'Simple, No-Nonsense Cashback' },
    travel:           { name: 'Travel Rewards Card',   type: 'Entry-Level Travel Card' },
    premium_travel:   { name: 'Premium Travel Card',   type: 'For Serious Travelers' },
  },
};
