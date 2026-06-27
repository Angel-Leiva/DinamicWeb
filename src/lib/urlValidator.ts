import { URL } from 'url';

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  contentType?: string;
}

/**
 * Validates whether an external URL is structure-valid, resolves to an active HTTP 200,
 * and matches the requested content type filters.
 */
export async function validateExternalUrl(
  urlStr: string,
  expectedType: 'image' | 'video' | 'any'
): Promise<UrlValidationResult> {
  try {
    if (!urlStr || typeof urlStr !== 'string') {
      return { valid: false, error: 'La URL no puede estar vacía.' };
    }

    // 1. Structure Check
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      return { valid: false, error: 'El formato de la URL es inválido.' };
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'El protocolo de la URL debe ser HTTP o HTTPS.' };
    }

    // Special bypass rule for youtube and vimeo as they don't serve direct video content-types
    const isVideoSharingService = 
      parsedUrl.hostname.includes('youtube.com') || 
      parsedUrl.hostname.includes('youtu.be') || 
      parsedUrl.hostname.includes('vimeo.com');

    if (expectedType === 'video' && isVideoSharingService) {
      return { valid: true, contentType: 'text/html' };
    }

    // 2. Connection Check (HEAD request first, fallback to GET)
    let response: Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s connection timeout

    try {
      response = await fetch(urlStr, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (response.status !== 200) {
        // Fallback to GET (some servers or buckets reject HEAD requests with 403/405)
        response = await fetch(urlStr, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      return { valid: false, error: `Fallo de conexión o timeout al intentar acceder al servidor: ${e.message}` };
    } finally {
      clearTimeout(timeoutId);
    }

    // 3. Response Status Check
    if (response.status !== 200) {
      return { valid: false, error: `El recurso no está disponible o no existe (Servidor respondió HTTP ${response.status}).` };
    }

    // 4. Content Type Match Check
    const contentType = response.headers.get('content-type') || '';
    const lowerContentType = contentType.toLowerCase();

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'application/x-mpegurl', 'application/vnd.apple.mpegurl'];

    const isImage = allowedImageTypes.some(type => lowerContentType.startsWith(type));
    const isVideo = allowedVideoTypes.some(type => lowerContentType.startsWith(type));

    if (expectedType === 'image') {
      if (!isImage) {
        return { 
          valid: false, 
          contentType, 
          error: `El recurso existe pero no es una imagen válida. Tipo recibido: ${contentType || 'desconocido'}` 
        };
      }
    } else if (expectedType === 'video') {
      if (!isVideo) {
        return { 
          valid: false, 
          contentType, 
          error: `El recurso existe pero no es un video válido. Tipo recibido: ${contentType || 'desconocido'}` 
        };
      }
    } else {
      // 'any' check
      if (!isImage && !isVideo) {
        return { 
          valid: false, 
          contentType, 
          error: `El tipo de contenido no es un elemento multimedia soportado. Tipo: ${contentType || 'desconocido'}` 
        };
      }
    }

    return { valid: true, contentType };
  } catch (err: any) {
    return { valid: false, error: `Error de red o resolución DNS: ${err.message}` };
  }
}
