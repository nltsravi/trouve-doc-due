export type DocumentCategory =
  | 'identity_travel'
  | 'insurance_finance'
  | 'vehicles'
  | 'personal_professional'
  | 'purchases_warranties'
  | 'other';

export type DocumentType =
  // Identity & travel
  | 'passport'
  | 'driving_licence'
  | 'national_id'
  | 'visa_permit'
  | 'travel_document'
  // Insurance & finance
  | 'motor_insurance'
  | 'health_insurance'
  | 'life_insurance'
  | 'home_insurance'
  | 'financial_certificate'
  | 'membership_financial'
  // Vehicles
  | 'vehicle_registration' // RC
  | 'pollution_certificate' // PUC
  | 'vehicle_fitness'
  | 'vehicle_permit'
  // Personal & professional
  | 'professional_licence'
  | 'training_certificate'
  | 'education_certificate'
  | 'membership_card'
  // Purchases & warranties
  | 'product_warranty'
  | 'purchase_invoice'
  | 'service_record'
  // General fallback
  | 'other_document';

export interface CategoryMetadata {
  id: DocumentCategory;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const CATEGORIES: Record<DocumentCategory, CategoryMetadata> = {
  identity_travel: {
    id: 'identity_travel',
    label: 'Identity & Travel',
    icon: 'card-account-details-outline',
    color: '#3B82F6',
    description: 'Passports, driving licences, national IDs, and visas',
  },
  insurance_finance: {
    id: 'insurance_finance',
    label: 'Insurance & Finance',
    icon: 'shield-check-outline',
    color: '#10B981',
    description: 'Motor, health, life, and home insurance policies',
  },
  vehicles: {
    id: 'vehicles',
    label: 'Vehicles',
    icon: 'car-outline',
    color: '#F59E0B',
    description: 'Vehicle RC, PUC certificates, and permits',
  },
  personal_professional: {
    id: 'personal_professional',
    label: 'Personal & Professional',
    icon: 'certificate-outline',
    color: '#8B5CF6',
    description: 'Professional licences, training, and education certificates',
  },
  purchases_warranties: {
    id: 'purchases_warranties',
    label: 'Purchases & Warranties',
    icon: 'receipt-outline',
    color: '#EC4899',
    description: 'Warranty cards, purchase invoices, and service records',
  },
  other: {
    id: 'other',
    label: 'Other Documents',
    icon: 'file-document-outline',
    color: '#64748B',
    description: 'General documents with renewal or expiry dates',
  },
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, { label: string; category: DocumentCategory }> = {
  passport: { label: 'Passport', category: 'identity_travel' },
  driving_licence: { label: 'Driving Licence', category: 'identity_travel' },
  national_id: { label: 'National Identity Card', category: 'identity_travel' },
  visa_permit: { label: 'Visa / Residence Permit', category: 'identity_travel' },
  travel_document: { label: 'Travel Document', category: 'identity_travel' },

  motor_insurance: { label: 'Motor Vehicle Insurance', category: 'insurance_finance' },
  health_insurance: { label: 'Health Insurance', category: 'insurance_finance' },
  life_insurance: { label: 'Life Insurance', category: 'insurance_finance' },
  home_insurance: { label: 'Home & Property Insurance', category: 'insurance_finance' },
  financial_certificate: { label: 'Financial Certificate', category: 'insurance_finance' },
  membership_financial: { label: 'Financial Membership', category: 'insurance_finance' },

  vehicle_registration: { label: 'Vehicle Registration (RC)', category: 'vehicles' },
  pollution_certificate: { label: 'Pollution Certificate (PUC)', category: 'vehicles' },
  vehicle_fitness: { label: 'Vehicle Fitness Certificate', category: 'vehicles' },
  vehicle_permit: { label: 'Vehicle Transport Permit', category: 'vehicles' },

  professional_licence: { label: 'Professional Licence', category: 'personal_professional' },
  training_certificate: { label: 'Training Certificate', category: 'personal_professional' },
  education_certificate: { label: 'Educational Certificate', category: 'personal_professional' },
  membership_card: { label: 'Membership Card', category: 'personal_professional' },

  product_warranty: { label: 'Product Warranty', category: 'purchases_warranties' },
  purchase_invoice: { label: 'Purchase Receipt / Invoice', category: 'purchases_warranties' },
  service_record: { label: 'Service Contract / Record', category: 'purchases_warranties' },

  other_document: { label: 'Other Document', category: 'other' },
};

export type DateType = 'expiry' | 'renewal' | 'issue' | 'purchase' | 'warranty_end' | 'start' | 'dob' | 'unknown';

export interface CandidateDate {
  date: string; // ISO YYYY-MM-DD
  type: DateType;
  label: string;
  originalText: string;
  confidence: number; // 0.0 - 1.0
  isAmbiguous?: boolean;
  alternativeDates?: string[];
  contextSnippet?: string;
}

export interface ExtractedFields {
  title: string;
  category: DocumentCategory;
  documentType: DocumentType;
  provider?: string;
  referenceNumber?: string;
  holderName?: string;
  issueDate?: string;
  startDate?: string;
  expiryDate?: string;
  renewalDate?: string;
  purchaseDate?: string;
  warrantyEndDate?: string;
  vehicleRegNumber?: string;
  notes?: string;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceScores {
  documentClassification: number;
  fieldExtraction: number;
  dateInterpretation: number;
  overall: number;
}
