const rawBaseUrl =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
  process.env.NEXT_PUBLIC_NEST_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

export const MEDIA_BASE_URL = rawBaseUrl.replace(/\/$/, "");

export const resolveMediaUrl = (url?: string | null) => {
  if (!url) return undefined;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  if (!MEDIA_BASE_URL) {
    return url;
  }

  return `${MEDIA_BASE_URL}${url}`;
};
