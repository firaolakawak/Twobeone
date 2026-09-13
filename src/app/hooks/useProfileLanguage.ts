import { useEffect, useRef } from 'react';
import { getCurrentLanguage, isLanguage, setCurrentLanguage } from '../utils/languageStore';

interface ProfileLanguageSource {
  id: string;
  language?: unknown;
}

/** Hydrate a signed-in profile once; later refreshes must preserve local choices. */
export function useProfileLanguage(profile: ProfileLanguageSource | null | undefined): void {
  const hydratedProfileId = useRef<string | null>(null);
  const profileId = profile?.id;
  const profileLanguage = profile?.language;

  useEffect(() => {
    if (!profileId) {
      hydratedProfileId.current = null;
      return;
    }
    if (hydratedProfileId.current === profileId) return;

    // An absent preference still counts as hydration. A delayed response must
    // not replace a language the user selects after this first profile arrives.
    hydratedProfileId.current = profileId;
    if (isLanguage(profileLanguage) && profileLanguage !== getCurrentLanguage()) {
      setCurrentLanguage(profileLanguage);
    }
  }, [profileId, profileLanguage]);
}
