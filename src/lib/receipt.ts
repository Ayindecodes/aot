const SHRINK_ABOVE_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1800;

// Phone screenshots and photos can be large, so images are reduced before upload.
// If the browser can't decode the file, the original is sent for the Worker to check.
export async function shrinkReceipt(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < SHRINK_ABOVE_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ? new File([blob], "receipt.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}
