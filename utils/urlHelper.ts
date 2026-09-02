import { Linking } from 'react-native';

// Regular expression to match URLs (http, https, or www.domain.tld)
export const URL_REGEX = /(https?:\/\/[^\s]+|www\.[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+(?:\/[^\s]*)?)/gi;

/**
 * Extracts unique URLs from text
 */
export const extractUrls = (text?: string | null): string[] => {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  // Clean trailing punctuation like .,;:!?)]
  const cleaned = matches.map((url) => url.replace(/[.,;:!?)]+$/, ''));
  return Array.from(new Set(cleaned));
};

/**
 * Formats a raw URL to ensure it has http/https protocol
 */
export const normalizeUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

/**
 * Safely opens a URL in system browser
 */
export const handleOpenURL = async (rawUrl: string) => {
  if (!rawUrl) return;
  const target = normalizeUrl(rawUrl);
  try {
    const canOpen = await Linking.canOpenURL(target);
    if (canOpen) {
      await Linking.openURL(target);
    } else {
      await Linking.openURL(target);
    }
  } catch (err) {
    console.warn('Failed to open URL:', target, err);
  }
};
