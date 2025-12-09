import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
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
            selected: false,
            generatedCandidates: []
          };
        })()
      );
    }

    return Promise.all(slidePromises);
  }

  throw new Error("Unsupported file type. Please use PDF or Image.");
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