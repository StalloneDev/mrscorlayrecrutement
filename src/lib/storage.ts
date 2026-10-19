import { put } from "@vercel/blob";

export interface UploadResult {
  url: string;
  fileName: string;
  contentType: string;
  size: number;
}

/**
 * Uploads a file buffer either to Vercel Blob (if BLOB_READ_WRITE_TOKEN is configured)
 * or as a base64 Data URL fallback.
 */
export async function uploadFile({
  fileBuffer,
  fileName,
  contentType,
}: {
  fileBuffer: Buffer;
  fileName: string;
  contentType: string;
}): Promise<UploadResult> {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `candidates/${Date.now()}-${sanitizedFileName}`;

  // Si Vercel Blob est configuré dans les variables d'environnement
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(uniqueName, fileBuffer, {
        access: "public",
        contentType,
      });
      return {
        url: blob.url,
        fileName: sanitizedFileName,
        contentType,
        size: fileBuffer.length,
      };
    } catch (blobErr) {
      console.warn("[Storage] Échec upload Vercel Blob, bascule vers stockage base64 :", blobErr);
    }
  }

  // Fallback sécurisé : Data URI base64
  const base64Data = fileBuffer.toString("base64");
  const dataUrl = `data:${contentType};base64,${base64Data}`;

  return {
    url: dataUrl,
    fileName: sanitizedFileName,
    contentType,
    size: fileBuffer.length,
  };
}
