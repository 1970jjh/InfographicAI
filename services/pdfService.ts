import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Slide, SlideContent } from '../types';

// Configure worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Render text content to a canvas image for Word documents
const renderTextToCanvas = (text: string, pageIndex: number, totalPages: number): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context not found");

  // A4-like dimensions at 2x scale
  canvas.width = 1600;
  canvas.height = 2260;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header bar
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(0, 0, canvas.width, 80);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px "Noto Sans KR", sans-serif';
  ctx.fillText(`WORD 문서  —  페이지 ${pageIndex} / ${totalPages}`, 40, 52);

  // Content area
  ctx.fillStyle = '#1e293b';
  ctx.font = '28px "Noto Sans KR", sans-serif';

  const lineHeight = 42;
  const maxWidth = canvas.width - 120;
  const startY = 140;
  let y = startY;

  const lines = text.split('\n');
  for (const line of lines) {
    if (y > canvas.height - 80) break;

    if (line.trim() === '') {
      y += lineHeight * 0.5;
      continue;
    }

    // Word wrap
    const words = line.split('');
    let currentLine = '';
    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        ctx.fillText(currentLine, 60, y);
        currentLine = char;
        y += lineHeight;
        if (y > canvas.height - 80) break;
      } else {
        currentLine = testLine;
      }
    }
    if (y <= canvas.height - 80 && currentLine) {
      ctx.fillText(currentLine, 60, y);
      y += lineHeight;
    }
  }

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px "Noto Sans KR", sans-serif';
  ctx.fillText(`Page ${pageIndex}`, canvas.width / 2 - 30, canvas.height - 30);

  return canvas.toDataURL('image/jpeg', 0.95);
};

// Check if a file is a Word document
const isWordFile = (file: File): boolean => {
  return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
         file.type === 'application/msword' ||
         file.name.endsWith('.docx') ||
         file.name.endsWith('.doc');
};

export const processFileToSlides = async (file: File): Promise<Slide[]> => {
  // Handle Images (JPG/PNG/WEBP)
  if (file.type.startsWith('image/')) {
    const base64 = await blobToBase64(file);
    return [{
      id: crypto.randomUUID(),
      pageIndex: 1,
      originalImage: base64,
      currentImage: base64,
      selected: true,
      generatedCandidates: []
    }];
  }

  // Handle PDF
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const slidePromises: Promise<Slide>[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      slidePromises.push(
        (async () => {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) throw new Error("Canvas context not found");

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

          return {
            id: crypto.randomUUID(),
            pageIndex: i,
            originalImage: dataUrl,
            currentImage: dataUrl,
            selected: true, // Default to selected
            generatedCandidates: []
          };
        })()
      );
    }

    return Promise.all(slidePromises);
  }

  // Handle Word documents (.doc, .docx)
  if (isWordFile(file)) {
    const mammoth = (window as any).mammoth;
    if (!mammoth) {
      throw new Error("Word 문서 처리 라이브러리가 로드되지 않았습니다.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const fullText: string = result.value || '';

    if (!fullText.trim()) {
      throw new Error("Word 문서에서 텍스트를 추출할 수 없습니다.");
    }

    // Split text into pages (~2000 chars per page)
    const charsPerPage = 2000;
    const pages: string[] = [];
    const paragraphs = fullText.split('\n');
    let currentPage = '';

    for (const para of paragraphs) {
      if (currentPage.length + para.length > charsPerPage && currentPage.length > 0) {
        pages.push(currentPage.trim());
        currentPage = para + '\n';
      } else {
        currentPage += para + '\n';
      }
    }
    if (currentPage.trim()) {
      pages.push(currentPage.trim());
    }

    // Ensure at least one page
    if (pages.length === 0) {
      pages.push(fullText.substring(0, charsPerPage));
    }

    return pages.map((pageText, idx) => {
      const dataUrl = renderTextToCanvas(pageText, idx + 1, pages.length);
      return {
        id: crypto.randomUUID(),
        pageIndex: idx + 1,
        originalImage: dataUrl,
        currentImage: dataUrl,
        selected: true,
        generatedCandidates: []
      };
    });
  }

  throw new Error("Unsupported file type. Please use PDF, Word, or Image.");
};

export const saveImageToPdf = (imageUrl: string, filename: string = 'infographic.pdf') => {
  const img = new Image();
  img.src = imageUrl;
  img.onload = () => {
    const doc = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width, img.height]
    });

    doc.addImage(imageUrl, 'PNG', 0, 0, img.width, img.height);
    doc.save(filename);
  };
};

export const saveImageAsJpg = (imageUrl: string, filename: string = 'infographic.jpg') => {
  const img = new Image();
  img.src = imageUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background for JPG (since JPG doesn't support transparency)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = jpgDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
};

export const saveImageAsPng = (imageUrl: string, filename: string = 'infographic.png') => {
  const img = new Image();
  img.src = imageUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    const pngDataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
};

export const saveImageToPptx = (imageUrl: string, filename: string = 'infographic.pptx') => {
  const PptxGenJS = (window as any).PptxGenJS;
  if (!PptxGenJS) {
    alert("PPTX 생성 라이브러리가 로드되지 않았습니다.");
    return;
  }

  const pptx = new PptxGenJS();
  const img = new Image();
  img.src = imageUrl;
  
  img.onload = () => {
    const ratio = img.width / img.height;
    const slideWidth = 10;
    const slideHeight = slideWidth / ratio;

    pptx.defineLayout({ name: 'CUSTOM', width: slideWidth, height: slideHeight });
    pptx.layout = 'CUSTOM';

    const slide = pptx.addSlide();
    slide.addImage({
      data: imageUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });

    pptx.writeFile({ fileName: filename });
  };
};

export const createEditablePresentation = (content: SlideContent, filename: string = 'presentation.pptx') => {
  const PptxGenJS = (window as any).PptxGenJS;
  if (!PptxGenJS) return;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; // Default to standard wide

  const slide = pptx.addSlide();
  const fontFace = 'Noto Sans KR';

  // 1. Title
  slide.addText(content.title, {
    x: 0.5, y: 0.5, w: '90%', h: 1,
    fontSize: 32,
    bold: true,
    color: '1e293b', // Slate-800
    fontFace: fontFace
  });

  // 2. Subtitle
  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: 0.5, y: 1.3, w: '90%', h: 0.5,
      fontSize: 18,
      color: '64748b', // Slate-500
      fontFace: fontFace
    });
  }

  // 3. Body Points
  const bulletText = content.bodyPoints.map(point => ({ 
      text: point, 
      options: { fontSize: 16, breakLine: true, bullet: true, fontFace: fontFace } 
  }));
  
  slide.addText(bulletText, {
      x: 0.5, y: 2.0, w: '90%', h: 3.5,
      color: '334155',
      fontFace: fontFace,
      lineSpacing: 30
  });

  // 4. Summary Box
  slide.addShape(pptx.ShapeType.rect, { 
      x: 0.5, y: 5.8, w: '90%', h: 1.2, 
      fill: { color: 'f1f5f9' }, 
      line: { color: 'cbd5e1' } 
  });
  
  slide.addText(`요약: ${content.summary}`, {
      x: 0.7, y: 5.9, w: '86%', h: 1,
      fontSize: 14,
      italic: true,
      color: '475569',
      fontFace: fontFace
  });

  // 5. Footer
  if (content.footer) {
      slide.addText(content.footer, {
          x: 0.5, y: 7.2, w: '90%', h: 0.3,
          fontSize: 10,
          color: '94a3b8',
          align: 'center',
          fontFace: fontFace
      });
  }

  pptx.writeFile({ fileName: filename });
};

// ========== Multi-Image Download Functions ==========

// Helper function to convert data URL to blob
const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Helper function to convert image to specific format
const convertImageFormat = (imageUrl: string, format: 'jpeg' | 'png', quality: number = 0.95): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL(`image/${format}`, quality));
    };
  });
};

// Download multiple images as ZIP (JPG format)
export const saveMultipleImagesAsJpgZip = async (imageUrls: string[], filename: string = 'Infographics_JPG.zip') => {
  const zip = new JSZip();

  for (let i = 0; i < imageUrls.length; i++) {
    const jpgDataUrl = await convertImageFormat(imageUrls[i], 'jpeg', 0.95);
    const blob = dataUrlToBlob(jpgDataUrl);
    zip.file(`Infographic_${i + 1}.jpg`, blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Download multiple images as ZIP (PNG format)
export const saveMultipleImagesAsPngZip = async (imageUrls: string[], filename: string = 'Infographics_PNG.zip') => {
  const zip = new JSZip();

  for (let i = 0; i < imageUrls.length; i++) {
    const pngDataUrl = await convertImageFormat(imageUrls[i], 'png');
    const blob = dataUrlToBlob(pngDataUrl);
    zip.file(`Infographic_${i + 1}.png`, blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Download multiple images as single PDF
export const saveMultipleImagesToPdf = async (imageUrls: string[], filename: string = 'Infographics.pdf') => {
  if (imageUrls.length === 0) return;

  // Load all images first
  const loadedImages: HTMLImageElement[] = await Promise.all(
    imageUrls.map(url => new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
    }))
  );

  // Create PDF with first image's dimensions
  const firstImg = loadedImages[0];
  const doc = new jsPDF({
    orientation: firstImg.width > firstImg.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [firstImg.width, firstImg.height]
  });

  // Add first image
  doc.addImage(imageUrls[0], 'PNG', 0, 0, firstImg.width, firstImg.height);

  // Add remaining images on new pages
  for (let i = 1; i < imageUrls.length; i++) {
    const img = loadedImages[i];
    doc.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait');
    doc.addImage(imageUrls[i], 'PNG', 0, 0, img.width, img.height);
  }

  doc.save(filename);
};

// Download multiple images as single PPTX
export const saveMultipleImagesToPptx = async (imageUrls: string[], filename: string = 'Infographics.pptx') => {
  const PptxGenJS = (window as any).PptxGenJS;
  if (!PptxGenJS) {
    alert("PPTX 생성 라이브러리가 로드되지 않았습니다.");
    return;
  }

  if (imageUrls.length === 0) return;

  const pptx = new PptxGenJS();

  // Load all images to get dimensions
  const loadedImages: HTMLImageElement[] = await Promise.all(
    imageUrls.map(url => new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
    }))
  );

  // Use first image to set layout
  const firstImg = loadedImages[0];
  const ratio = firstImg.width / firstImg.height;
  const slideWidth = 10;
  const slideHeight = slideWidth / ratio;

  pptx.defineLayout({ name: 'CUSTOM', width: slideWidth, height: slideHeight });
  pptx.layout = 'CUSTOM';

  // Add each image as a slide
  for (let i = 0; i < imageUrls.length; i++) {
    const slide = pptx.addSlide();
    slide.addImage({
      data: imageUrls[i],
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });
  }

  pptx.writeFile({ fileName: filename });
};