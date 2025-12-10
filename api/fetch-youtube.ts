import type { VercelRequest, VercelResponse } from '@vercel/node';

// Extract YouTube video ID from various URL formats
const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/v\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Fetch video info using YouTube oEmbed (no API key required)
const fetchVideoInfo = async (videoId: string): Promise<{ title: string; author: string; thumbnail: string } | null> => {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      title: data.title || '',
      author: data.author_name || '',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  } catch {
    return null;
  }
};

// Fetch captions/transcript using a free transcript service
const fetchTranscript = async (videoId: string): Promise<string | null> => {
  try {
    // Try to get transcript from youtube-transcript API (innertube)
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract caption tracks from the page
    const captionMatch = html.match(/"captions":\s*(\{[^}]+\})/);
    if (!captionMatch) {
      // Try to extract description as fallback
      const descMatch = html.match(/"description":\s*\{"simpleText":\s*"([^"]+)"/);
      if (descMatch) {
        return descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
      return null;
    }

    // Try to extract from ytInitialPlayerResponse
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
    if (playerResponseMatch) {
      try {
        const playerData = JSON.parse(playerResponseMatch[1]);

        // Get video description
        const description = playerData?.videoDetails?.shortDescription || '';

        // Try to get caption URL
        const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (captionTracks && captionTracks.length > 0) {
          // Prefer Korean, then English, then first available
          const koreanTrack = captionTracks.find((t: any) => t.languageCode === 'ko');
          const englishTrack = captionTracks.find((t: any) => t.languageCode === 'en');
          const track = koreanTrack || englishTrack || captionTracks[0];

          if (track?.baseUrl) {
            const captionResponse = await fetch(track.baseUrl);
            if (captionResponse.ok) {
              const captionXml = await captionResponse.text();
              // Parse XML and extract text
              const textMatches = captionXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
              const texts: string[] = [];
              for (const match of textMatches) {
                const text = match[1]
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/\n/g, ' ')
                  .trim();
                if (text) texts.push(text);
              }
              if (texts.length > 0) {
                return texts.join(' ');
              }
            }
          }
        }

        // Return description if no captions
        if (description) {
          return description;
        }
      } catch (e) {
        console.error('Failed to parse player response:', e);
      }
    }

    return null;
  } catch (error) {
    console.error('Transcript fetch error:', error);
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    // Fetch video info
    const videoInfo = await fetchVideoInfo(videoId);
    if (!videoInfo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Fetch transcript/captions
    const transcript = await fetchTranscript(videoId);

    // Build content
    let content = `YouTube Video: ${videoInfo.title}\n`;
    content += `Channel: ${videoInfo.author}\n\n`;

    if (transcript) {
      content += `Content/Transcript:\n${transcript}`;
    } else {
      content += `(No transcript available - infographic will be based on video title and channel information)`;
    }

    // Limit content length
    const maxLength = 15000;
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;

    return res.status(200).json({
      success: true,
      type: 'youtube',
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: videoInfo.title,
      author: videoInfo.author,
      thumbnail: videoInfo.thumbnail,
      content: truncatedContent,
      hasTranscript: !!transcript,
      contentLength: content.length,
      truncated: content.length > maxLength
    });

  } catch (error: any) {
    console.error('YouTube fetch error:', error);
    return res.status(500).json({
      error: `Failed to fetch YouTube video: ${error.message}`
    });
  }
}
