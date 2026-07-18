function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? stripTrailingSlash(trimmed) : fallback;
}

function deriveUploadsBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.replace(/\/api$/i, '') + '/uploads';
}

export const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, '/api');
export const uploadsBaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_UPLOADS_BASE_URL,
  apiBaseUrl === '/api' ? '/uploads' : deriveUploadsBaseUrl(apiBaseUrl)
);

export function getUploadUrl(filePath: string) {
  return `${uploadsBaseUrl}/${filePath.replace(/^\/+/, '')}`;
}