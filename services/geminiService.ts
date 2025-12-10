import { GoogleGenAI, Type } from "@google/genai";
import { Slide, GenerationConfig, GeneratedImage, AspectRatio } from "../types";
import { INFOGRAPHIC_STYLES } from "../data/styles";

// Helper to strip the data:image/jpeg;base64, prefix
const getBase64FromDataUrl = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

const getMimeTypeFromDataUrl = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:(.+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const IMAGE_MODEL_NAME = 'gemini-3-pro-image-preview';
// Updated to Gemini 3.0 Pro for higher quality text reasoning as requested
const TEXT_MODEL_NAME = 'gemini-3-pro-preview';
// Veo 2.0 for video generation (Image-to-Video)
const VIDEO_MODEL_NAME = 'veo-2.0-generate-001';

export const ensureApiKey = async (): Promise<void> => {
  const win = window as any;
  if (!win.aistudio) {
    console.warn("AI Studio definitions missing. Ensure API_KEY is set in your environment variables (e.g., Vercel Dashboard).");
    return;
  }
  const hasKey = await win.aistudio.hasSelectedApiKey();
  if (!hasKey) {
    await win.aistudio.openSelectKey();
  }
};

const mapSizeIdToAspectRatio = (sizeId: string): AspectRatio => {
  switch (sizeId) {
    case 'mobile-story': return '9:16';
    case 'webtoon-4': return '9:16';
    case 'webtoon-8': return '9:16';
    case 'long-scroll': return '9:16'; // Using vertical aspect
    case 'instagram-sq': return '1:1';
    case 'card-news': return '1:1'; // Square card news
    case 'presentation-wide': return '16:9';
    case 'presentation-std': return '4:3';
    case 'a4-landscape': return '4:3'; // Approximate
    case 'a4-portrait': return '3:4';
    default: return '3:4';
  }
};

const getSizeInstruction = (sizeId: string): string => {
   switch (sizeId) {
    case 'a4-portrait': return "Format: A4 Paper (Portrait). Layout for standard document print.";
    case 'a4-landscape': return "Format: A4 Paper (Landscape). Layout for wide document print.";
    case 'long-scroll': return "Format: Long Scrolling Vertical. Organize content vertically like a webtoon.";
    case 'webtoon-4': return "Format: 4-Cut Webtoon (Vertical Strip). Create a vertical comic strip with exactly 4 distinct panels/frames. Focus on sequential storytelling.";
    case 'webtoon-8': return "Format: 8-Cut Webtoon (Long Vertical Strip). Create a long vertical comic strip with approximately 8 distinct panels/frames. Focus on detailed sequential storytelling.";
    case 'mobile-story': return "Format: Mobile Fullscreen (9:16). Large text, mobile optimized.";
    case 'card-news': return "Format: Social Media Card. Bold text, square layout, carousel style.";
    default: return "";
  }
}

export const generateInfographic = async (
  selectedSlides: Slide[],
  config: GenerationConfig
): Promise<string | null> => {
  
  await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts: any[] = [];

  const selectedStyle = INFOGRAPHIC_STYLES.find(s => s.id === config.selectedStyleId);
  const styleName = selectedStyle ? selectedStyle.name : 'Custom';
  const styleDesc = selectedStyle ? selectedStyle.description : 'Match the reference image style.';
  const sizeInstruction = getSizeInstruction(config.sizeOption);
  
  // Color Instruction
  const colorInstruction = config.selectedColor 
    ? `Color Palette: Dominant color should be ${config.selectedColor}. Ensure the design strictly adheres to this color scheme while maintaining harmony and contrast.`
    : "Color Palette: Auto-detect the best color scheme based on the content and style.";

  let prompt = `Create a single, high-quality, professional infographic that summarizes the key information from the provided slide images.
  
  Language: ${config.language}
  Style: ${styleName}
  Style Description: ${styleDesc}
  ${sizeInstruction}
  ${colorInstruction}
  
  Instructions:
  - Combine the content from the input slides into one cohesive narrative within a single image.
  - Use the specified language for all text.
  - Adhere strictly to the requested visual style.
  - Make it visually engaging, legible, and suitable for the selected format.
  `;

  parts.push({ text: prompt });

  selectedSlides.forEach((slide) => {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: getBase64FromDataUrl(slide.originalImage),
      },
    });
  });

  if (config.selectedStyleId === 'custom' && config.customStyleImage) {
    parts.push({ text: "Reference Style Image:" });
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: getBase64FromDataUrl(config.customStyleImage),
      },
    });
  }

  const targetAspectRatio = mapSizeIdToAspectRatio(config.sizeOption);

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: targetAspectRatio,
          imageSize: "2K"
        }
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) return null;

    const resultParts = candidates[0].content.parts;
    const imagePart = resultParts.find(p => p.inlineData);

    if (imagePart && imagePart.inlineData) {
      return `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
    }
    return null;

  } catch (error: any) {
    console.error("Infographic Gen Error:", error);
    handleAuthError(error);
    throw error;
  }
};


// Helper for auth error
const handleAuthError = async (error: any) => {
   const errorMessage = error.message || error.toString();
   const win = window as any;
   
   if (
      errorMessage.includes('403') || 
      errorMessage.includes('PERMISSION_DENIED') || 
      errorMessage.includes('Requested entity was not found')
    ) {
       if (win.aistudio) {
           await win.aistudio.openSelectKey();
       } else {
           console.error("API Key missing or invalid. Please check your Vercel Environment Variables (API_KEY).");
       }
    }
}

export const generateSlideVariations = async (
  originalImage: string,
  prompt: string,
  count: number
): Promise<GeneratedImage[]> => {
  await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mimeType = getMimeTypeFromDataUrl(originalImage);
  const base64 = getBase64FromDataUrl(originalImage);

  const generateOne = async (): Promise<GeneratedImage | null> => {
      try {
         const response = await ai.models.generateContent({
             model: IMAGE_MODEL_NAME,
             contents: {
                 parts: [
                     { text: prompt },
                     { 
                         inlineData: {
                             mimeType: mimeType,
                             data: base64
                         }
                     }
                 ]
             },
             config: {
                 imageConfig: {
                     aspectRatio: "16:9",
                     imageSize: "1K"
                 }
             }
         });
         
         const parts = response.candidates?.[0]?.content?.parts;
         const imagePart = parts?.find(p => p.inlineData);
         
         if (imagePart && imagePart.inlineData) {
             return {
                 id: crypto.randomUUID(),
                 dataUrl: `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`,
                 prompt,
                 timestamp: Date.now()
             };
         }
         return null;
      } catch (e) {
          handleAuthError(e);
          return null;
      }
  };

  const promises = Array.from({ length: count }).map(() => generateOne());
  const results = await Promise.all(promises);
  return results.filter((r): r is GeneratedImage => r !== null);
};

// Video Generation Result Interface
export interface VideoGenerationResult {
  videoUrl: string;  // Blob URL for playback
  state: 'ACTIVE' | 'PENDING' | 'FAILED';
}

// Helper to download video and convert to blob URL
const downloadVideoAsBlob = async (
  ai: GoogleGenAI,
  videoUri: string
): Promise<string | null> => {
  try {
    // Extract file name from URI (format: files/xxx or similar)
    const fileNameMatch = videoUri.match(/files\/([^/]+)/);
    if (!fileNameMatch) {
      console.error("Could not extract file name from URI:", videoUri);
      // Try direct fetch with API key as fallback
      return await fetchVideoWithAuth(videoUri);
    }

    const fileName = `files/${fileNameMatch[1]}`;

    // Download the video file using the Files API
    const response = await ai.files.download({ file: fileName });

    // Handle different response types
    if (response) {
      let blob: Blob;

      // If response is already a Blob
      if (response instanceof Blob) {
        blob = response;
      }
      // If response is ArrayBuffer
      else if (response instanceof ArrayBuffer) {
        blob = new Blob([response], { type: 'video/mp4' });
      }
      // If response has arrayBuffer method (Response object)
      else if (typeof (response as any).arrayBuffer === 'function') {
        const arrayBuffer = await (response as any).arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'video/mp4' });
      }
      // If response has data property (some SDK versions)
      else if ((response as any).data) {
        const data = (response as any).data;
        if (typeof data === 'string') {
          // Base64 encoded data
          const binaryString = atob(data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'video/mp4' });
        } else {
          blob = new Blob([data], { type: 'video/mp4' });
        }
      }
      else {
        // Try to convert whatever we got
        blob = new Blob([response as any], { type: 'video/mp4' });
      }

      return URL.createObjectURL(blob);
    }

    return null;
  } catch (error) {
    console.error("Error downloading video:", error);
    // Try direct fetch as fallback
    return await fetchVideoWithAuth(videoUri);
  }
};

// Fallback: fetch video with authenticated URL
const fetchVideoWithAuth = async (videoUri: string): Promise<string | null> => {
  try {
    // Add API key to the URL if needed
    const apiKey = process.env.API_KEY;
    const separator = videoUri.includes('?') ? '&' : '?';
    const authUrl = `${videoUri}${separator}key=${apiKey}`;

    const response = await fetch(authUrl);
    if (!response.ok) {
      console.error("Failed to fetch video:", response.status, response.statusText);
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching video with auth:", error);
    return null;
  }
};

// Map size option to video aspect ratio
const mapSizeToVideoAspectRatio = (sizeId: string): '16:9' | '9:16' => {
  switch (sizeId) {
    case 'mobile-story':
    case 'webtoon-4':
    case 'webtoon-8':
    case 'long-scroll':
    case 'a4-portrait':
      return '9:16'; // Vertical
    default:
      return '16:9'; // Horizontal (default)
  }
};

// Generate video directly from selected slides using Veo 2.0
export const generateVideoFromSlides = async (
  selectedSlides: Slide[],
  config: GenerationConfig
): Promise<VideoGenerationResult | null> => {
  await ensureApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const selectedStyle = INFOGRAPHIC_STYLES.find(s => s.id === config.selectedStyleId);
  const styleName = selectedStyle ? selectedStyle.name : 'Modern';
  const styleDesc = selectedStyle ? selectedStyle.description : 'Professional and engaging visual style';

  // Color instruction for video
  const colorInstruction = config.selectedColor
    ? `Color Theme: Use ${config.selectedColor} as the dominant color throughout the video.`
    : 'Color Theme: Use vibrant and engaging colors appropriate for the content.';

  // Create a detailed prompt for 8-second video with narrative structure
  const videoPrompt = `Create an 8-second engaging animated video that presents the key information from the provided slide images.

Language: ${config.language}
Visual Style: ${styleName} - ${styleDesc}
${colorInstruction}

Video Requirements:
- Duration: Exactly 8 seconds
- Create a compelling visual narrative that summarizes the slide content
- Follow a clear narrative structure (기승전결):
  * Opening (0-2s): Introduce the main topic with dynamic entrance animation
  * Development (2-4s): Present core information with smooth transitions
  * Climax (4-6s): Highlight the most important key points with emphasis
  * Conclusion (6-8s): End with a memorable visual summary
- Use smooth animations and transitions between concepts
- Incorporate text overlays for key points in ${config.language}
- Maintain consistent visual style throughout
- Add subtle motion graphics to enhance engagement
- Background should complement the overall theme`;

  try {
    // Use the first slide as the reference image for the video
    const referenceSlide = selectedSlides[0];
    const mimeType = getMimeTypeFromDataUrl(referenceSlide.originalImage);
    const base64 = getBase64FromDataUrl(referenceSlide.originalImage);

    // Get appropriate aspect ratio based on size setting
    const aspectRatio = mapSizeToVideoAspectRatio(config.sizeOption);

    // Use the video generation API with Veo 2.0
    const operation = await ai.models.generateVideos({
      model: VIDEO_MODEL_NAME,
      prompt: videoPrompt,
      image: {
        imageBytes: base64,
        mimeType: mimeType
      },
      config: {
        aspectRatio: aspectRatio,
        numberOfVideos: 1,
        durationSeconds: 8,
        personGeneration: 'allow_adult'
      }
    });

    // Poll for completion
    let result = operation;
    while (!result.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      result = await ai.operations.get({ operation: result });
    }

    // Check for video in response
    if (result.response?.generatedVideos && result.response.generatedVideos.length > 0) {
      const video = result.response.generatedVideos[0];
      if (video.video?.uri) {
        // Download the video and convert to blob URL for browser playback
        const blobUrl = await downloadVideoAsBlob(ai, video.video.uri);
        if (blobUrl) {
          return {
            videoUrl: blobUrl,
            state: 'ACTIVE'
          };
        }

        // Fallback: try direct URL if download fails
        console.warn("Failed to download video, trying direct URL...");
        return {
          videoUrl: video.video.uri,
          state: 'ACTIVE'
        };
      }
    }

    return null;

  } catch (error: any) {
    console.error("Video Generation Error:", error);
    handleAuthError(error);
    throw error;
  }
};