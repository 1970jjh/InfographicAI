export interface WebPageContent {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  content: string;
  contentLength: number;
  truncated: boolean;
}

export interface WebFetchResult {
  success: boolean;
  data?: WebPageContent;
  error?: string;
}

/**
 * Fetch webpage content through our API route (to avoid CORS issues)
 */
export const fetchWebpageContent = async (url: string): Promise<WebFetchResult> => {
  try {
    // Normalize URL - add https:// if not present
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const response = await fetch('/api/fetch-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: normalizedUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '웹페이지를 불러오는데 실패했습니다.'
      };
    }

    return {
      success: true,
      data: {
        url: data.url,
        title: data.title,
        description: data.description,
        ogImage: data.ogImage,
        content: data.content,
        contentLength: data.contentLength,
        truncated: data.truncated
      }
    };

  } catch (error: any) {
    console.error('Web fetch error:', error);
    return {
      success: false,
      error: error.message || '웹페이지를 불러오는데 실패했습니다.'
    };
  }
};

/**
 * Validate if a string looks like a URL
 */
export const isValidUrl = (str: string): boolean => {
  const trimmed = str.trim();

  // Check if it looks like a URL (has a domain-like structure)
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i;
  return urlPattern.test(trimmed);
};
