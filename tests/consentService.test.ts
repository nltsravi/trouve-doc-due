import {
  hasAcceptedTermsAndPrivacy,
  acceptTermsAndPrivacy,
  getConsentDetails,
  revokeConsent,
  CURRENT_LEGAL_VERSION,
} from '../src/services/privacy/consentService';
import * as settingsRepo from '../src/services/storage/settingsRepo';

jest.mock('../src/services/storage/settingsRepo', () => {
  const store = new Map<string, string>();
  return {
    getSetting: jest.fn(async (key: string, defaultValue = '') => {
      return store.has(key) ? store.get(key)! : defaultValue;
    }),
    setSetting: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteSetting: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __store: store,
  };
});

describe('Privacy Policy & Terms and Conditions Consent Gating', () => {
  beforeEach(async () => {
    await revokeConsent();
  });

  it('reports false when neither Terms nor Privacy Policy have been accepted', async () => {
    const accepted = await hasAcceptedTermsAndPrivacy();
    expect(accepted).toBe(false);

    const details = await getConsentDetails();
    expect(details.accepted).toBe(false);
    expect(details.termsAcceptedAt).toBeNull();
    expect(details.privacyAcceptedAt).toBeNull();
  });

  it('records explicit acceptance of both Terms and Privacy Policy with timestamp and version', async () => {
    await acceptTermsAndPrivacy('1.0.0');

    const accepted = await hasAcceptedTermsAndPrivacy();
    expect(accepted).toBe(true);

    const details = await getConsentDetails();
    expect(details.accepted).toBe(true);
    expect(details.version).toBe(CURRENT_LEGAL_VERSION);
    expect(details.termsAcceptedAt).toBeTruthy();
    expect(details.privacyAcceptedAt).toBeTruthy();
    expect(new Date(details.termsAcceptedAt!).getTime()).not.toBeNaN();
  });

  it('allows revoking consent upon data wipe or user reset', async () => {
    await acceptTermsAndPrivacy();
    expect(await hasAcceptedTermsAndPrivacy()).toBe(true);

    await revokeConsent();
    expect(await hasAcceptedTermsAndPrivacy()).toBe(false);
  });
});
