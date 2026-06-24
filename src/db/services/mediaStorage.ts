import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

let isCloudinaryConfigured = false;

// Lazy initialization of Cloudinary to prevent crashes if variables are missing
function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    isCloudinaryConfigured = true;
    return cloudinary;
  }
  return null;
}

/**
 * Uploads a base64 encoded media file.
 * Returns the final storage URL.
 */
export async function uploadMediaFile(
  name: string,
  fileBase64: string,
  mimeType: string
): Promise<string> {
  const client = getCloudinary();
  
  if (client && isCloudinaryConfigured) {
    try {
      console.log(`[STORAGE] Uploading file '${name}' to Cloudinary...`);
      // Cloudinary expects base64 prefixed with the data URI scheme
      const dataUri = fileBase64.startsWith('data:') 
        ? fileBase64 
        : `data:${mimeType};base64,${fileBase64}`;
        
      const res = await client.uploader.upload(dataUri, {
        resource_type: 'auto',
        public_id: name.split('.')[0] + '-' + Date.now(),
      });
      console.log(`[STORAGE] Cloudinary upload success. URL: ${res.secure_url}`);
      return res.secure_url;
    } catch (error) {
      console.error('[STORAGE] Cloudinary upload failed, falling back to local file storage:', error);
    }
  }

  // Fallback: Store locally inside public static uploads folder
  try {
    console.log(`[STORAGE] Using local filesystem storage fallback for '${name}'...`);
    const uploadsDir = path.join(process.cwd(), 'dist', 'uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeFileName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);
    
    fs.writeFileSync(filePath, buffer);
    console.log(`[STORAGE] File written locally to ${filePath}`);

    // Return the relative URL from the server root
    return `/uploads/${safeFileName}`;
  } catch (error) {
    console.error('[STORAGE] Local file storage failed, falling back to data URL:', error);
    // Ultimate fallback is the base64 string itself as data URL
    return fileBase64.startsWith('data:') ? fileBase64 : `data:${mimeType};base64,${fileBase64}`;
  }
}
