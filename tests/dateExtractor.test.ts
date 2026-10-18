import { extractRawDates, extractCandidateDates } from '../src/services/extraction/dateExtractor';
import { createOCRResultFromText } from '../src/services/ocr/ocrService';

describe('Date Extractor', () => {
  describe('extractRawDates', () => {
    it('correctly parses DD/MM/YYYY format', () => {
      const text = 'Card is valid until 24/11/2028 and issued on 10/05/2018';
      const dates = extractRawDates(text);
      expect(dates.length).toBeGreaterThanOrEqual(2);
      expect(dates.some((d) => d.dateStr === '2028-11-24')).toBe(true);
    });

    it('correctly parses text month formats like 15-AUG-2029', () => {
      const text = 'PASSPORT EXPIRY DATE: 15-AUG-2029';
      const dates = extractRawDates(text);
      expect(dates.length).toBe(1);
      expect(dates[0].dateStr).toBe('2029-08-15');
      expect(dates[0].originalText).toBe('15-AUG-2029');
    });

    it('correctly parses Month DD, YYYY format', () => {
      const text = 'Policy Schedule effective from October 18, 2026';
      const dates = extractRawDates(text);
      expect(dates.length).toBe(1);
      expect(dates[0].dateStr).toBe('2026-10-18');
    });

    it('correctly flags ambiguity when day and month are both <= 12', () => {
      const text = 'Renewal Due: 05/06/2027';
      const dates = extractRawDates(text);
      expect(dates.length).toBe(1);
      expect(dates[0].isAmbiguous).toBe(true);
      expect(dates[0].dateStr).toBe('2027-06-05'); // DD/MM default
      expect(dates[0].alternativeIso).toBe('2027-05-06'); // MM/DD alternative
    });

    it('does not flag ambiguity when first number > 12', () => {
      const text = 'Expiry: 25/08/2028';
      const dates = extractRawDates(text);
      expect(dates.length).toBe(1);
      expect(dates[0].isAmbiguous).toBeFalsy();
      expect(dates[0].dateStr).toBe('2028-08-25');
    });
  });

  describe('extractCandidateDates and context classification', () => {
    it('distinguishes expiry date from issue date', () => {
      const text = `
        GOVERNMENT TRANSPORT DEPARTMENT
        DRIVING LICENCE
        DATE OF ISSUE: 12/04/2018
        VALID TILL: 28/09/2032
      `;
      const ocr = createOCRResultFromText(text);
      const candidates = extractCandidateDates(ocr);

      expect(candidates.length).toBe(2);
      const expiry = candidates.find((c) => c.type === 'expiry');
      const issue = candidates.find((c) => c.type === 'issue');

      expect(expiry).toBeDefined();
      expect(expiry?.date).toBe('2032-09-28');
      expect(issue).toBeDefined();
      expect(issue?.date).toBe('2018-04-12');
    });

    it('filters out Date of Birth from candidate expiry dates', () => {
      const text = `
        PASSPORT
        DATE OF BIRTH: 15/07/1988
        EXPIRY DATE: 10/10/2030
      `;
      const ocr = createOCRResultFromText(text);
      const candidates = extractCandidateDates(ocr);

      // DOB must NOT be in the expiry/renewal candidates
      expect(candidates.some((c) => c.date === '1988-07-15')).toBe(false);
      expect(candidates.some((c) => c.date === '2030-10-10')).toBe(true);
    });

    it('identifies renewal date anchor', () => {
      const text = `
        MOTOR VEHICLE INSURANCE POLICY
        NEXT RENEWAL DUE: 25-MAR-2028
      `;
      const ocr = createOCRResultFromText(text);
      const candidates = extractCandidateDates(ocr);

      const renewal = candidates.find((c) => c.type === 'renewal');
      expect(renewal).toBeDefined();
      expect(renewal?.date).toBe('2028-03-25');
    });
  });
});
