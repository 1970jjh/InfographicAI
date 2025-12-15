
export interface GeneratedImage {
  id: string;
  dataUrl: string;
  prompt: string;
  timestamp: number;
}

export interface Slide {
  id: string;
  pageIndex: number;
  originalImage: string; // Base64 data URL
  selected?: boolean; // For multi-selection
  
  // Editable fields
  currentImage: string;
  lastPrompt?: string;
  generatedCandidates: GeneratedImage[];
}

export type AspectRatio = "16:9" | "4:3" | "1:1" | "3:4" | "9:16";

export interface InfographicStyle {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  previewImage?: string;
}

export interface SizeOption {
  id: string;
  label: string;
  subLabel: string;
  ratio: AspectRatio;
}

export interface ColorOption {
  id: string;
  name: string;
  class: string;
  hex: string;
}

export type GenerationMode = 'infographic' | 'presentation';

export interface SlideContent {
  title: string;
  subtitle?: string;
  bodyPoints: string[];
  footer?: string;
  summary: string;
}

export interface GenerationConfig {
  mode: GenerationMode;
  language: string;
  selectedStyleId: string;
  customStyleImage?: string; // Base64
  sizeOption: string; // id of the SizeOption
  selectedColor?: string; // Hex or Name
  customInstructions?: string; // 사용자 지정 인포그래픽 생성 지침
}
