import { getSetting, setSetting, deleteSetting } from '../storage/settingsRepo';

export const CURRENT_LEGAL_VERSION = '1.0.0';

export interface ConsentDetails {
  accepted: boolean;
  version: string;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
}

/**
 * Checks if the user has accepted both the Privacy Policy and Terms & Conditions
 */
export async function hasAcceptedTermsAndPrivacy(): Promise<boolean> {
  try {
    const termsAt = await getSetting('terms_accepted_at', '');
    const privacyAt = await getSetting('privacy_policy_accepted_at', '');
    return Boolean(termsAt && privacyAt);
  } catch {
    return false;
  }
}

/**
 * Records that the user has reviewed and accepted the Privacy Policy and Terms & Conditions
 */
export async function acceptTermsAndPrivacy(version = CURRENT_LEGAL_VERSION): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    setSetting('terms_accepted_at', now),
    setSetting('privacy_policy_accepted_at', now),
    setSetting('legal_consent_version', version),
  ]);
}

/**
 * Retrieves full details on the user's recorded legal consent
 */
export async function getConsentDetails(): Promise<ConsentDetails> {
  const [termsAt, privacyAt, version] = await Promise.all([
    getSetting('terms_accepted_at', ''),
    getSetting('privacy_policy_accepted_at', ''),
    getSetting('legal_consent_version', CURRENT_LEGAL_VERSION),
  ]);

  return {
    accepted: Boolean(termsAt && privacyAt),
    version: version || CURRENT_LEGAL_VERSION,
    termsAcceptedAt: termsAt || null,
    privacyAcceptedAt: privacyAt || null,
  };
}

/**
 * Resets recorded legal consent (e.g. for testing or after data wipe)
 */
export async function revokeConsent(): Promise<void> {
  await Promise.all([
    deleteSetting('terms_accepted_at'),
    deleteSetting('privacy_policy_accepted_at'),
    deleteSetting('legal_consent_version'),
  ]);
}
