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
