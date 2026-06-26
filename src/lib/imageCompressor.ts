/**
 * Utility to downscale and compress images on the client-side before uploading them.
 * This fixes the massive file size issue when taking photos with modern mobile phones,
 * which often crash the network, lag the server, or hit HTTP body limits.
 * Additionally, drawing to canvas resolves EXIF orientation automatically.
 */
export interface ImageAnalysisResult {
  base64Data: string;
  mimeType: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  originalSizeMb: number;
  compressedSizeKb: number;
  brightness: number; // 0 - 255
  contrast: number; // 0 - 128 (standard deviation estimate)
  qualityScore: number; // 0 - 100
  qualityLabel: 'Excel·lent' | 'Bona' | 'Millorable (Fosca o Baix contrast)' | 'Crítica (Apropa\'t)';
  suggestions: string[];
}

export function compressAndResizeImage(
  file: File,
  maxDim: number = 1200
): Promise<ImageAnalysisResult> {
  return new Promise((resolve, reject) => {
    const originalSizeMb = file.size / (1024 * 1024);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        let width = originalWidth;
        let height = originalHeight;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawBase64 = (event.target?.result as string).split(',')[1];
          resolve({
            base64Data: rawBase64,
            mimeType: file.type || 'image/jpeg',
            originalWidth,
            originalHeight,
            width,
            height,
            originalSizeMb,
            compressedSizeKb: Math.round(file.size / 1024),
            brightness: 128,
            contrast: 50,
            qualityScore: 80,
            qualityLabel: 'Bona',
            suggestions: ["No s'ha pogut analitzar els píxels per a l'enfocament."]
          });
          return;
        }

        // Draw image (modern browsers auto-orient based on EXIF since iOS 13.4+)
        ctx.drawImage(img, 0, 0, width, height);

        // REAL PIXEL ANALYSIS FOR FOCUS & QUALITY
        let brightness = 128;
        let contrast = 50;
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          
          // Sample pixels (every 16th pixel for speed)
          let totalLuminance = 0;
          let sampleCount = 0;
          const luminances: number[] = [];

          for (let i = 0; i < data.length; i += 64) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r !== undefined && g !== undefined && b !== undefined) {
              // Standard luminance formula
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              totalLuminance += lum;
              luminances.push(lum);
              sampleCount++;
            }
          }

          if (sampleCount > 0) {
            brightness = totalLuminance / sampleCount;
            
            // Calculate standard deviation (contrast indicator)
            let sumSqDiff = 0;
            for (const lum of luminances) {
              const diff = lum - brightness;
              sumSqDiff += diff * diff;
            }
            contrast = Math.sqrt(sumSqDiff / sampleCount);
          }
        } catch (e) {
          console.error("No s'ha pogut obtenir ImageData del canvas (seguretat CORS o fallada)", e);
        }

        // Determine score & suggestions
        let score = 95;
        const suggestions: string[] = [];

        // 1. Resolution checks
        if (originalWidth < 600 || originalHeight < 400) {
          score -= 30;
          suggestions.push("⚠️ Resolució baixa: Apropa més la càmera a la pissarra per capturar més detalls.");
        } else if (originalWidth >= 1200) {
          suggestions.push("✅ Resolució excel·lent: La imatge té prou definició per detectar línies fines.");
        }

        // 2. Brightness checks
        if (brightness < 45) {
          score -= 25;
          suggestions.push("🌒 Imatge massa fosca: Intenta utilitzar el flaix o millorar la il·luminació del pavelló.");
        } else if (brightness > 225) {
          score -= 20;
          suggestions.push("☀️ Massa reflex / brillantor: Evita focus de llum directe que puguin deslluair la pissarra.");
        } else {
          suggestions.push("✅ Lluminositat correcta: La imatge està ben exposada per a l'anàlisi de Gemini.");
        }

        // 3. Contrast / Focus check
        if (contrast < 18) {
          score -= 30;
          suggestions.push("🌫️ Poc contrast / Desenfocat: Les línies són massa borroses. Neteja la lent o enfoca millor.");
        } else if (contrast > 40) {
          suggestions.push("✅ Contrast òptim: Els traços i jugadors es distingeixen perfectament de la pissarra.");
        } else {
          suggestions.push("ℹ️ Contrast mitjà: Recomanem fer servir retoladors gruixuts de colors foscos.");
        }

        score = Math.max(10, Math.min(100, score));

        let label: ImageAnalysisResult['qualityLabel'] = 'Excel·lent';
        if (score < 50) {
          label = 'Crítica (Apropa\'t)';
        } else if (score < 75) {
          label = 'Millorable (Fosca o Baix contrast)';
        } else if (score < 90) {
          label = 'Bona';
        }

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64Data = compressedDataUrl.split(',')[1];
        const compressedSizeKb = Math.round((base64Data.length * 3) / 4 / 1024);

        resolve({
          base64Data,
          mimeType: 'image/jpeg',
          originalWidth,
          originalHeight,
          width,
          height,
          originalSizeMb,
          compressedSizeKb,
          brightness,
          contrast,
          qualityScore: Math.round(score),
          qualityLabel: label,
          suggestions
        });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
