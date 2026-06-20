// Client-side image normalization before upload.
//
// Mobile camera photos are often 3-12MB (and iPhone shoots HEIC), which can be
// rejected/dropped at the network edge (e.g. AWS API Gateway's 10MB limit, or
// nginx `client_max_body_size`) BEFORE the request reaches the API — surfacing
// in the browser as a generic axios "Network Error" (request sent, no readable
// response). Laptops upload small PDFs/screenshots, so they don't hit this;
// phones do. Downscaling + re-encoding to JPEG keeps the payload small (and
// converts HEIC -> JPEG, which the backend also accepts), so it always fits.
//
// PDFs and already-small images pass through untouched. ANY failure falls back
// to the original file so uploads never break because of this step.

const MAX_DIMENSION = 2200; // long edge; high enough to keep lab-report text legible
const JPEG_QUALITY = 0.82;
const COMPRESS_ABOVE_BYTES = 1.2 * 1024 * 1024; // skip tiny images that already fit

function isImage(file) {
  if (file.type && file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|bmp|tiff?)$/i.test(file.name || "");
}

function isPdf(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
}

async function loadBitmap(file) {
  // createImageBitmap decodes HEIC on iOS Safari and respects EXIF orientation.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (_) {
      // fall through to the <img> path below
    }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => resolve(b), type, quality);
    } else {
      const dataUrl = canvas.toDataURL(type, quality);
      const bytes = atob(dataUrl.split(",")[1]);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      resolve(new Blob([arr], { type }));
    }
  });
}

/**
 * Returns { file, meta }. `file` is a compressed JPEG when the input is a large
 * image (or HEIC); otherwise the original file. `meta` describes what happened
 * (sizes, dimensions, errors) and is safe to log.
 */
export async function prepareUpload(file) {
  const meta = {
    name: file?.name,
    originalType: file?.type,
    originalSize: file?.size,
    outputSize: file?.size,
    resized: false,
  };
  try {
    if (!file || isPdf(file) || !isImage(file)) return { file, meta };

    const needsConvert =
      /heic|heif/i.test(file.type || "") || /\.(heic|heif)$/i.test(file.name || "");
    if (file.size <= COMPRESS_ABOVE_BYTES && !needsConvert) return { file, meta };

    const bitmap = await loadBitmap(file);
    const w = bitmap.width || bitmap.naturalWidth;
    const h = bitmap.height || bitmap.naturalHeight;
    if (!w || !h) return { file, meta };

    const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
    const outW = Math.round(w * scale);
    const outH = Math.round(h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, outW, outH);
    if (bitmap.close) bitmap.close();

    const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    if (!blob) return { file, meta };

    // Only swap in the compressed version if it actually helped (always swap
    // for HEIC, since the backend can't read that format).
    if (blob.size >= file.size && !needsConvert) {
      meta.outputSize = file.size;
      return { file, meta };
    }

    const baseName = (file.name || "upload").replace(/\.[^.]+$/, "");
    const out = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    meta.outputType = "image/jpeg";
    meta.outputSize = out.size;
    meta.width = outW;
    meta.height = outH;
    meta.resized = true;
    return { file: out, meta };
  } catch (err) {
    meta.error = err?.message || String(err);
    return { file, meta };
  }
}
