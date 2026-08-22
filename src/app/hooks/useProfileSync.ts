import { useRef, useCallback } from 'react';
import api from '../utils/api';

/**
 * Custom hook for profile synchronization polling
 * Detects when profile updates and triggers data reload
 */
export function useProfileSync(
  profile: any,
  onProfileUpdated: () => Promise<void>
) {
  const lastProfileCheckRef = useRef<string | null>(null);

  const checkForProfileUpdates = useCallback(async () => {
    try {
      const { profile: updatedProfile } = await api.profile.get();
      
      // Check if profile.updatedAt has changed (indicating a profile update)
      if (updatedProfile?.updatedAt) {
        if (lastProfileCheckRef.current && lastProfileCheckRef.current !== updatedProfile.updatedAt) {
          console.log('[ProfileSync] Profile updated detected, reloading data...');
          
          // Check if relationshipStart specifically changed
          const oldRelationshipStart = profile?.relationshipStart;
          const newRelationshipStart = updatedProfile.relationshipStart;
          
          if (oldRelationshipStart !== newRelationshipStart && newRelationshipStart) {
            console.log('[ProfileSync] 💕 Relationship start date changed!', {
              old: oldRelationshipStart,
              new: newRelationshipStart
            });
          }
          
          // Trigger reload callback
          await onProfileUpdated();
        }
        lastProfileCheckRef.current = updatedProfile.updatedAt;
      }
    } catch (err: any) {
      // Silently fail - this is background polling
      if (err.message !== 'Failed to fetch' && err.message !== 'Unauthorized') {
        console.error('[ProfileSync] Failed to check updates:', err);
      }
    }
  }, [profile, onProfileUpdated]);

  return { checkForProfileUpdates };
}
