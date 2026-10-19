import { DocumentCategory, DocumentType } from '../../types/document';
import { OCRResult } from '../ocr/types';

export interface ClassificationResult {
  isDocument: boolean;
  category: DocumentCategory;
  documentType: DocumentType;
  suggestedTitle: string;
  confidence: number; // 0.0 - 1.0
  reasons: string[];
}

interface TypeRule {
  type: DocumentType;
  category: DocumentCategory;
  defaultTitle: string;
  strongKeywords: RegExp[];
  weakKeywords: RegExp[];
  weight: number;
}

const DOCUMENT_RULES: TypeRule[] = [
  // 1. Identity & Travel
  {
    type: 'passport',
    category: 'identity_travel',
    defaultTitle: 'Passport',
    strongKeywords: [
      /\bpassport\b/i,
      /\bpasseport\b/i,
      /\bpassport\s*(no\.?|number)\b/i,
      /\brepublic of [a-z\s]+ passport\b/i,
      /\btype\s*[\/:]\s*p\b/i,
      /\bp<[a-z0-9]/i, // Machine readable zone
    ],
    weakKeywords: [
      /\bnationality\b/i,
      /\bdate of birth\b/i,
      /\bplace of birth\b/i,
      /\bdate of expiry\b/i,
      /\bauthority\b/i,
      /\bsurname\b/i,
      /\bgiven names?\b/i,
      /\bcountry code\b/i,
    ],
    weight: 1.2,
  },
  {
    type: 'driving_licence',
    category: 'identity_travel',
    defaultTitle: 'Driving Licence',
    strongKeywords: [
      /\bdriving licen[sc]e\b/i,
      /\bdriver['s]?\s*licen[sc]e\b/i,
      /\bdl\s*(no\.?|number)\b/i,
      /\blicen[sc]e to drive\b/i,
      /\bmotor vehicle driving\b/i,
    ],
    weakKeywords: [
      /\bclass of vehicle\b/i,
      /\bvalid (till|until|upto|to)\b/i,
      /\bauthorization to drive\b/i,
      /\btransport vehicle\b/i,
      /\bnon-transport\b/i,
      /\bdate of issue\b/i,
    ],
    weight: 1.1,
  },
  {
    type: 'national_id',
    category: 'identity_travel',
    defaultTitle: 'National Identity Card',
    strongKeywords: [
      /\bnational identity card\b/i,
      /\bcitizen identity\b/i,
      /\baadhaar\b/i,
      /\belection commission of\b/i,
      /\bvoter identity\b/i,
      /\bgovernment of [a-z]+ identity\b/i,
    ],
    weakKeywords: [
      /\byear of birth\b/i,
      /\bgender\b/i,
      /\benrolment no\b/i,
      /\bepic no\b/i,
      /\belector\b/i,
    ],
    weight: 1.0,
  },
  {
    type: 'visa_permit',
    category: 'identity_travel',
    defaultTitle: 'Visa / Residence Permit',
    strongKeywords: [
      /\bvisa\b/i,
      /\bresidence permit\b/i,
      /\bentry permit\b/i,
      /\bimmigrat/i,
      /\bstay permit\b/i,
    ],
    weakKeywords: [
      /\bnumber of entries\b/i,
      /\bvalid for stay\b/i,
      /\bvisa type\b/i,
      /\bport of issue\b/i,
    ],
    weight: 1.0,
  },

  // 2. Insurance & Finance
  {
    type: 'motor_insurance',
    category: 'insurance_finance',
    defaultTitle: 'Motor Vehicle Insurance',
    strongKeywords: [
      /\bmotor (package|insurance|policy)\b/i,
      /\bvehicle (insurance|policy)\b/i,
      /\btwo wheeler (package|insurance)\b/i,
      /\bprivate car (package|insurance)\b/i,
      /\bcommercial vehicle (package|insurance)\b/i,
      /\bcar insurance\b/i,
      /\bauto insurance\b/i,
    ],
    weakKeywords: [
      /\bpolicy schedule\b/i,
      /\bidv\b/i,
      /\binsured declared value\b/i,
      /\bno claim bonus\b/i,
      /\bncb\b/i,
      /\bchassis no\b/i,
      /\bengine no\b/i,
      /\bperiod of insurance\b/i,
      /\bthird party\b/i,
      /\bprivate car\b/i,
      /\bpackage policy\b/i,
    ],
    weight: 1.25,
  },
  {
    type: 'health_insurance',
    category: 'insurance_finance',
    defaultTitle: 'Health Insurance',
    strongKeywords: [
      /\bhealth (care|insurance|plan|package|protect|policy)\b/i,
      /\bhealth\s*care\b/i,
      /\bmediclaim\b/i,
      /\bmedical insurance\b/i,
      /\bhealth protect/i,
      /\bhealth plan\b/i,
    ],
    weakKeywords: [
      /\bsum insured\b/i,
      /\btpa\b/i,
      /\bhospitalization\b/i,
      /\bcashless\b/i,
      /\bpolicy period\b/i,
      /\bdependents?\b/i,
    ],
    weight: 1.15,
  },
  {
    type: 'life_insurance',
    category: 'insurance_finance',
    defaultTitle: 'Life Insurance Policy',
    strongKeywords: [
      /\blife insurance\b/i,
      /\bterm life\b/i,
      /\blife assurance\b/i,
    ],
    weakKeywords: [
      /\bnominee\b/i,
      /\bsum assured\b/i,
      /\bpremium paying term\b/i,
      /\bmaturity date\b/i,
      /\bdate of commencement\b/i,
    ],
    weight: 1.0,
  },
  {
    type: 'home_insurance',
    category: 'insurance_finance',
    defaultTitle: 'Home & Property Insurance',
    strongKeywords: [
      /\bhome insurance\b/i,
      /\bproperty insurance\b/i,
      /\bhomeowner\b/i,
      /\bhouseholders? package\b/i,
    ],
    weakKeywords: [
      /\bbuilding sum insured\b/i,
      /\bcontents sum insured\b/i,
      /\bpremises address\b/i,
    ],
    weight: 1.0,
  },
  {
    type: 'financial_certificate',
    category: 'insurance_finance',
    defaultTitle: 'Insurance Policy',
    strongKeywords: [
      /\binsurance policy\b/i,
      /\bcertificate of insurance\b/i,
      /\binsurance certificate\b/i,
      /\bcomprehensive policy\b/i,
      /\binsurance coverage\b/i,
    ],
    weakKeywords: [
      /\bgeneral insurance\b/i,
      /\bpolicy schedule\b/i,
      /\bperiod of insurance\b/i,
      /\bpolicy (no\.?|number)\b/i,
      /\bsum insured\b/i,
      /\bpremium\b/i,
      /\bnext renewal\b/i,
      /\brenewal due\b/i,
      /\binsured\b/i,
      /\bexpiry date\b/i,
    ],
    weight: 0.95,
  },

  // 3. Vehicles
  {
    type: 'vehicle_registration',
    category: 'vehicles',
    defaultTitle: 'Vehicle Registration (RC)',
    strongKeywords: [
      /\bregistration certificate\b/i,
      /\bcertificate of registration\b/i,
      /\bform 23\b/i,
      /\btransport department\b/i,
    ],
    weakKeywords: [
      /\bregn\.?\s*no\b/i,
      /\bchassis no\b/i,
      /\bengine no\b/i,
      /\bvehicle class\b/i,
      /\bmaker['s]?\s*name\b/i,
      /\bfuel used\b/i,
      /\bregistration date\b/i,
      /\bfitness valid upto\b/i,
    ],
    weight: 1.2,
  },
  {
    type: 'pollution_certificate',
    category: 'vehicles',
    defaultTitle: 'Pollution Under Control (PUC)',
    strongKeywords: [
      /\bpollution under control\b/i,
      /\bpuc certificate\b/i,
      /\bemi[s]+ion test certificate\b/i,
      /\bpucc\b/i,
    ],
    weakKeywords: [
      /\bcarbon monoxide\b/i,
      /\bhydrocarbon\b/i,
      /\bvalid upto\b/i,
      /\btested on\b/i,
      /\bemission norms\b/i,
    ],
    weight: 1.3,
  },
  {
    type: 'vehicle_fitness',
    category: 'vehicles',
    defaultTitle: 'Vehicle Fitness Certificate',
    strongKeywords: [
      /\bfitness certificate\b/i,
      /\bcertificate of fitness\b/i,
      /\bform 38\b/i,
    ],
    weakKeywords: [
      /\bvalid from\b/i,
      /\binspected on\b/i,
      /\bseating capacity\b/i,
    ],
    weight: 1.1,
  },
  {
    type: 'vehicle_permit',
    category: 'vehicles',
    defaultTitle: 'Vehicle Transport Permit',
    strongKeywords: [
      /\ball india tourist permit\b/i,
      /\bgoods carriage permit\b/i,
      /\bnational permit\b/i,
      /\bcontract carriage permit\b/i,
    ],
    weakKeywords: [
      /\bpermit no\b/i,
      /\bvalid upto\b/i,
      /\bauthorized routes\b/i,
    ],
    weight: 1.0,
  },

  // 4. Personal & Professional
  {
    type: 'professional_licence',
    category: 'personal_professional',
    defaultTitle: 'Professional Licence',
    strongKeywords: [
      /\bbar council\b/i,
      /\bmedical council\b/i,
      /\bchartered accountants?\b/i,
      /\bboard of nursing\b/i,
      /\bpracticing certificate\b/i,
      /\blicensed professional\b/i,
    ],
    weakKeywords: [
      /\bregistration no\b/i,
      /\bvalid through\b/i,
      /\benrollment\b/i,
      /\bmembership no\b/i,
    ],
    weight: 1.0,
  },
  {
    type: 'training_certificate',
    category: 'personal_professional',
    defaultTitle: 'Training Certificate',
    strongKeywords: [
      /\bcertificate of training\b/i,
      /\bcertificate of completion\b/i,
      /\bcpr certification\b/i,
      /\bfirst aid certified\b/i,
      /\bosha certified\b/i,
    ],
    weakKeywords: [
      /\bcompleted on\b/i,
      /\bvalid for\b/i,
      /\bexpir(es|y)\b/i,
      /\bhours of training\b/i,
    ],
    weight: 1.0,
  },

  // 5. Purchases & Warranties
  {
    type: 'product_warranty',
    category: 'purchases_warranties',
    defaultTitle: 'Product Warranty',
    strongKeywords: [
      /\bwarranty card\b/i,
      /\bwarranty certificate\b/i,
      /\blimited warranty\b/i,
      /\bextended warranty\b/i,
      /\bguarantee card\b/i,
    ],
    weakKeywords: [
      /\bwarranty period\b/i,
      /\bterms and conditions\b/i,
      /\bmodel no\b/i,
      /\bserial no\b/i,
      /\bpurchased from\b/i,
    ],
    weight: 1.2,
  },
  {
    type: 'purchase_invoice',
    category: 'purchases_warranties',
    defaultTitle: 'Purchase Receipt / Invoice',
    strongKeywords: [
      /\btax invoice\b/i,
      /\bretail invoice\b/i,
      /\bsales invoice\b/i,
      /\bcash receipt\b/i,
    ],
    weakKeywords: [
      /\binvoice no\b/i,
      /\bgst(in)?\b/i,
      /\btotal amount\b/i,
      /\bdate of purchase\b/i,
      /\bbill to\b/i,
    ],
    weight: 1.0,
  },
];

// Generic document signals (e.g. policy, valid till, expiry, certificate)
const GENERIC_DOC_SIGNALS = [
  /\bvalid (till|until|upto|to)\b/i,
  /\bdate of expir/i,
  /\bexpiry date\b/i,
  /\brenew(al)? (date|before|due)\b/i,
  /\bpolicy (no|number)\b/i,
  /\bcertificate\b/i,
  /\blicen[sc]e\b/i,
  /\bissue date\b/i,
  /\bperiod of\b/i,
  /\bregistration\b/i,
];

export function classifyDocument(ocr: OCRResult): ClassificationResult {
  const fullText = ocr.rawText;
  const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;

  // Very short text or empty text is not a personal document
  if (wordCount < 4) {
    return {
      isDocument: false,
      category: 'other',
      documentType: 'other_document',
      suggestedTitle: 'Non-document',
      confidence: 0,
      reasons: ['Text too short to be a valid document'],
    };
  }

  let bestRule: TypeRule | null = null;
  let highestScore = 0;
  let matchedReasons: string[] = [];

  for (const rule of DOCUMENT_RULES) {
    let score = 0;
    const reasons: string[] = [];

    // Check strong keywords (+35 points each)
    for (const kw of rule.strongKeywords) {
      if (kw.test(fullText)) {
        score += 35;
        reasons.push(`Strong match: ${kw.source}`);
      }
    }

    // Check weak keywords (+12 points each)
    for (const kw of rule.weakKeywords) {
      if (kw.test(fullText)) {
        score += 12;
        reasons.push(`Supporting match: ${kw.source}`);
      }
    }

    score = score * rule.weight;

    if (score > highestScore) {
      highestScore = score;
      bestRule = rule;
      matchedReasons = reasons;
    }
  }

  // Check generic signals (+10 points to baseline)
  let genericMatches = 0;
  for (const sig of GENERIC_DOC_SIGNALS) {
    if (sig.test(fullText)) {
      genericMatches++;
    }
  }

  const normalizedConfidence = Math.min(
    1.0,
    Math.round(((highestScore + genericMatches * 8) / 100) * 100) / 100
  );

  // If score is high enough, we have a concrete type
  if (bestRule && normalizedConfidence >= 0.4) {
    return {
      isDocument: true,
      category: bestRule.category,
      documentType: bestRule.type,
      suggestedTitle: bestRule.defaultTitle,
      confidence: normalizedConfidence,
      reasons: matchedReasons,
    };
  }

  // If we had strong generic document signals but couldn't pinpoint specific type:
  if (genericMatches >= 2 && wordCount >= 10) {
    return {
      isDocument: true,
      category: 'other',
      documentType: 'other_document',
      suggestedTitle: 'Document with Expiry Date',
      confidence: Math.min(0.65, Math.max(0.4, genericMatches * 0.15)),
      reasons: ['Contains date validity indicators'],
    };
  }

  // Otherwise, non-document image (photo, landscape, meme, chat screenshot, etc.)
  return {
    isDocument: false,
    category: 'other',
    documentType: 'other_document',
    suggestedTitle: 'Unclassified Media',
    confidence: normalizedConfidence,
    reasons: ['No recognized document structure or keywords'],
  };
}
