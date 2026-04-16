import { apiClient } from './client';
import { API_CONFIG } from './config';
import { getToken } from '../auth/session';
import { ApiError } from '../errors/api-error';

export interface LabResult {
  id: string;
  user_id: string;
  title: string;
  tested_at: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

const endpoints = {
  list: (userId: string) => `/api/v1/users/${userId}/lab-results`,
  detail: (userId: string, labId: string) =>
    `/api/v1/users/${userId}/lab-results/${labId}`,
  file: (userId: string, labId: string) =>
    `/api/v1/users/${userId}/lab-results/${labId}/file`,
};

export async function listLabResults(userId: string): Promise<LabResult[]> {
  return apiClient.get<LabResult[]>(endpoints.list(userId));
}

export async function uploadLabResult(
  userId: string,
  formData: FormData
): Promise<LabResult> {
  return apiClient.postMultipart<LabResult>(endpoints.list(userId), formData);
}

export async function deleteLabResult(
  userId: string,
  labId: string
): Promise<void> {
  await apiClient.delete(endpoints.detail(userId, labId));
}

export async function fetchLabResultBlob(
  userId: string,
  labId: string
): Promise<Blob> {
  const token = getToken();
  const url = `${API_CONFIG.baseUrl}${endpoints.file(userId, labId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw ApiError.fromResponse(response);
  }
  return response.blob();
}
