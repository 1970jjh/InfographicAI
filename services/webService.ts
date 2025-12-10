export interface WebPageContent {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  content: string;
  contentLength: number;
  truncated: boolean;
  type: 'webpage' | 'youtube';
  // YouTube specific fields
  videoId?: string;
  author?: string;
  thumbnail?: string;
  hasTranscript?: boolean;
}

export interface WebFetchResult {
  success: boolean;
  data?: WebPageContent;
  error?: string;
}

/**
 * Check if URL is a YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /youtube\.com\/watch/i,
    /youtu\.be\//i,
    /youtube\.com\/embed/i,
    /youtube\.com\/v\//i,
    /youtube\.com\/shorts\//i,
  ];
  return patterns.some(pattern => pattern.test(url));
};

/**
 * Fetch YouTube video content through our API route
 */
export const fetchYouTubeContent = async (url: string): Promise<WebFetchResult> => {
  try {
    const response = await fetch('/api/fetch-youtube', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '유튜브 영상 정보를 불러오는데 실패했습니다.'
      };
    }

    return {
      success: true,
      data: {
        url: data.url,
        title: data.title,
        description: '',
        ogImage: data.thumbnail,
        content: data.content,
        contentLength: data.contentLength,
        truncated: data.truncated,
        type: 'youtube',
        videoId: data.videoId,
        author: data.author,
        thumbnail: data.thumbnail,
        hasTranscript: data.hasTranscript
      }
    };

  } catch (error: any) {
    console.error('YouTube fetch error:', error);
    return {
      success: false,
      error: error.message || '유튜브 영상 정보를 불러오는데 실패했습니다.'
    };
  }
};

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
        truncated: data.truncated,
        type: 'webpage'
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
 * Unified function to fetch content from URL (auto-detects YouTube vs webpage)
 */
export const fetchUrlContent = async (url: string): Promise<WebFetchResult> => {
  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Check if it's a YouTube URL
  if (isYouTubeUrl(normalizedUrl)) {
    return fetchYouTubeContent(normalizedUrl);
  }

  // Otherwise fetch as webpage
  return fetchWebpageContent(normalizedUrl);
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
