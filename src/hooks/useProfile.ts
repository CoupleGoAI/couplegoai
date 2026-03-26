import { useState, useCallback } from 'react';
import { useAuthStore } from '@store/authStore';
import {
  updateProfile,
  uploadAvatar as uploadAvatarApi,
  type ProfileUpdatePayload,
} from '@data/profileApi';
import { fetchProfile } from '@data/auth';

export type { ProfileUpdatePayload } from '@data/profileApi';

export interface UseProfileReturn {
  isSaving: boolean;
  isUploading: boolean;
  error: string | null;
  saveProfile: (payload: ProfileUpdatePayload) => Promise<boolean>;
  uploadAvatar: (imageUri: string) => Promise<boolean>;
}

export function useProfile(): UseProfileReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const saveProfile = useCallback(
    async (payload: ProfileUpdatePayload): Promise<boolean> => {
      if (!user) {
        setError('You must be signed in to update your profile.');
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await updateProfile(payload);

        if (!result.ok) {
          setError(result.error);
          return false;
        }

        const freshResult = await fetchProfile(user.id);

        if (freshResult.ok) {
          setUser(freshResult.data);
        }

        return true;
      } catch {
        setError('Failed to save changes. Please try again.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, setUser],
  );

  const uploadAvatar = useCallback(
    async (imageUri: string): Promise<boolean> => {
      if (!user) {
        setError('You must be signed in to upload a photo.');
        return false;
      }

      setIsUploading(true);
      setError(null);

      try {
        const result = await uploadAvatarApi(imageUri);

        if (!result.ok) {
          setError(result.error);
          return false;
        }

        const freshResult = await fetchProfile(user.id);

        if (freshResult.ok) {
          setUser(freshResult.data);
        }

        return true;
      } catch {
        setError('Failed to upload photo. Please try again.');
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [user, setUser],
  );

  return { isSaving, isUploading, error, saveProfile, uploadAvatar };
}
