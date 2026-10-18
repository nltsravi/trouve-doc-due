import { ExtractedFields, ConfidenceScores, CandidateDate } from '../../types/document';
import { OCRResult } from '../ocr/types';
import { ClassificationResult } from '../classification/classifier';
import { extractCandidateDates } from './dateExtractor';

// Known major insurance and vehicle providers for accurate extraction
const KNOWN_PROVIDERS = [
  'HDFC ERGO', 'ICICI Lombard', 'Bajaj Allianz', 'Tata AIG', 'New India Assurance',
  'Oriental Insurance', 'National Insurance', 'United India Insurance', 'Star Health',
  'SBI General', 'Digit Insurance', 'Acko', 'Reliance General', 'Max Life', 'LIC',
  'State Farm', 'Geico', 'Progressive', 'Allstate', 'Liberty Mutual', 'USAA', 'Bupa',
  'AXA', 'Allianz', 'Prudential', 'Aviva', 'Zurich', 'Transport Department', 'RTO',
];

export interface ExtractionResult {
  fields: ExtractedFields;
  candidateDates: CandidateDate[];
  confidenceScores: ConfidenceScores;
  unresolvedAmbiguities: string[];
}

export function extractFieldsFromOCR(
  ocr: OCRResult,
  classification: ClassificationResult
): ExtractionResult {
  const text = ocr.rawText;
  const candidateDates = extractCandidateDates(ocr);
  const ambiguities: string[] = [];

  // Extract Dates into semantic slots
  let primaryExpiry: CandidateDate | undefined;
  let primaryRenewal: CandidateDate | undefined;
  let primaryIssue: CandidateDate | undefined;
  let primaryPurchase: CandidateDate | undefined;
  let primaryWarranty: CandidateDate | undefined;

  for (const cd of candidateDates) {
    if (cd.type === 'expiry' && !primaryExpiry) {
      primaryExpiry = cd;
    } else if (cd.type === 'renewal' && !primaryRenewal) {
      primaryRenewal = cd;
    } else if (cd.type === 'issue' && !primaryIssue) {
      primaryIssue = cd;
    } else if (cd.type === 'purchase' && !primaryPurchase) {
      primaryPurchase = cd;
    } else if (cd.type === 'warranty_end' && !primaryWarranty) {
      primaryWarranty = cd;
    }

    if (cd.isAmbiguous) {
      ambiguities.push(`Date format for ${cd.originalText} could be Day/Month or Month/Day`);
    }
  }

  // 1. Extract Provider / Organization
  let provider: string | undefined;
  for (const p of KNOWN_PROVIDERS) {
    const pRegex = new RegExp(`\\b${p}\\b`, 'i');
    if (pRegex.test(text)) {
      provider = p;
      break;
    }
  }

  // Fallback regex for "Issued by: ..." or "Company: ..."
  if (!provider) {
    const issuerMatch = text.match(/(?:issued by|insurer|company|provider|authority)\s*[:\-]\s*([A-Za-z0-9 &.,'-]{3,35})/i);
    if (issuerMatch) {
      provider = issuerMatch[1].trim();
    }
  }

  // 2. Extract Reference / Policy Number
  let referenceNumber: string | undefined;

  // Patterns for policy, passport, DL, invoice numbers with required delimiter or explicit number keyword
  const refPatterns = [
    /\b(?:policy|certificate|contract|pol)\s*(?:(?:no\.?|number|#)\s*[:\-]?|[:\-])\s*([A-Z0-9\-\/]{5,30})/i,
    /\b(?:dl|driving licen[sc]e)\s*(?:(?:no\.?|number)\s*[:\-]?|[:\-])\s*([A-Z0-9\-\/]{8,22})/i,
    /\bpassport\s*(?:(?:no\.?|number)\s*[:\-]?|[:\-])\s*([A-Z][0-9]{7,9})\b/i,
    /\b(?:invoice|bill|receipt)\s*(?:(?:no\.?|number|#)\s*[:\-]?|[:\-])\s*([A-Z0-9\-\/]{4,25})/i,
    /\b(?:rc|regn\.?|registration)\s*(?:(?:no\.?|number)\s*[:\-]?|[:\-])\s*([A-Z]{2}[0-9A-Z\-\s]{6,14})/i,
  ];

  for (const pat of refPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const cleanRef = match[1].replace(/[\s]/g, '').trim();
      if (cleanRef.length >= 5 && /\d/.test(cleanRef)) {
        referenceNumber = cleanRef;
        break;
      }
    }
  }

  // 3. Extract Vehicle Registration Number (RC/PUC/Motor)
  let vehicleRegNumber: string | undefined;
  // Standard format e.g. DL 01 AB 1234 or MH12DE1432 or UK-07-AL-9999
  const vehRegMatch = text.match(/\b([A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,3}[ -]?[0-9]{4})\b/);
  if (vehRegMatch) {
    vehicleRegNumber = vehRegMatch[1].replace(/[\s\-]/g, '').toUpperCase();
  }

  // 4. Extract Holder Name
  let holderName: string | undefined;
  const nameMatch = text.match(/(?:name of (?:the )?(?:insured|holder|owner|licensee|customer)|insured name|holder name)\s*[:\-]?\s*([A-Z][A-Za-z\s.]{3,30})/i);
  if (nameMatch) {
    holderName = nameMatch[1].trim();
  }

  // 5. Build Display Title
  let displayTitle = classification.suggestedTitle;
  if (provider && (classification.category === 'insurance_finance' || classification.documentType === 'product_warranty')) {
    displayTitle = `${classification.suggestedTitle} - ${provider}`;
  } else if (vehicleRegNumber && classification.category === 'vehicles') {
    displayTitle = `${classification.suggestedTitle} (${vehicleRegNumber})`;
  } else if (referenceNumber && classification.documentType === 'passport') {
    displayTitle = `Passport (${referenceNumber})`;
  }

  // Confidence calculations
  const classificationScore = classification.confidence;

  let fieldScore = 0.3;
  if (referenceNumber) fieldScore += 0.3;
  if (provider) fieldScore += 0.2;
  if (vehicleRegNumber || holderName) fieldScore += 0.2;
  fieldScore = Math.min(1.0, fieldScore);

  let dateScore = 0.2;
  if (primaryExpiry || primaryRenewal || primaryWarranty) {
    dateScore = primaryExpiry?.confidence || primaryRenewal?.confidence || 0.8;
  }
  if (ambiguities.length > 0) {
    dateScore = Math.max(0.4, dateScore - 0.2);
  }

  const overallScore = Math.round(
    ((classificationScore * 0.4) + (dateScore * 0.4) + (fieldScore * 0.2)) * 100
  ) / 100;

  const fields: ExtractedFields = {
    title: displayTitle,
    category: classification.category,
    documentType: classification.documentType,
    provider,
    referenceNumber,
    holderName,
    issueDate: primaryIssue?.date,
    expiryDate: primaryExpiry?.date,
    renewalDate: primaryRenewal?.date,
    purchaseDate: primaryPurchase?.date,
    warrantyEndDate: primaryWarranty?.date,
    vehicleRegNumber,
    notes: ambiguities.length > 0 ? ambiguities.join('; ') : undefined,
  };

  return {
    fields,
    candidateDates,
    confidenceScores: {
      documentClassification: classificationScore,
      fieldExtraction: Math.round(fieldScore * 100) / 100,
      dateInterpretation: Math.round(dateScore * 100) / 100,
      overall: overallScore,
    },
    unresolvedAmbiguities: ambiguities,
  };
}
