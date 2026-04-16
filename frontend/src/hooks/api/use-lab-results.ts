import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteLabResult,
  fetchLabResultBlob,
  listLabResults,
  uploadLabResult,
  type LabResult,
} from '@/lib/api/lab-results';
import { queryClient } from '@/lib/query/client';

const labResultsKey = (userId: string) => ['labResults', userId] as const;

export function useLabResults(userId: string) {
  return useQuery({
    queryKey: labResultsKey(userId),
    queryFn: () => listLabResults(userId),
    enabled: !!userId,
  });
}

export function useUploadLabResult(userId: string) {
  return useMutation({
    mutationFn: (formData: FormData) => uploadLabResult(userId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labResultsKey(userId) });
      toast.success('Lab result uploaded');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to upload lab result';
      toast.error(message);
    },
  });
}

export function useDeleteLabResult(userId: string) {
  return useMutation({
    mutationFn: (labId: string) => deleteLabResult(userId, labId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labResultsKey(userId) });
      toast.success('Lab result deleted');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to delete lab result';
      toast.error(message);
    },
  });
}

export function useLabResultBlobUrl(
  userId: string,
  lab: LabResult | null
): { blobUrl: string | null; isLoading: boolean } {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lab) {
      setBlobUrl(null);
      return;
    }
    let revoked = false;
    let createdUrl: string | null = null;

    setIsLoading(true);
    fetchLabResultBlob(userId, lab.id)
      .then((blob) => {
        if (revoked) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch((err: unknown) => {
        if (revoked) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load file';
        toast.error(message);
      })
      .finally(() => {
        if (!revoked) setIsLoading(false);
      });

    return () => {
      revoked = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      setBlobUrl(null);
    };
  }, [userId, lab?.id]);

  return { blobUrl, isLoading };
}
