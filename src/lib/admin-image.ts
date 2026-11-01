const WIDTH = 900;
const HEIGHT = 1200;

export type PreparedImage = { base64: string; extension: "webp" | "jpg"; preview: string };

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.82));
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Crops to the product card's 3:4 shape. Focus moves the crop along whichever side is cut,
// from 0 (top or left) to 100 (bottom or right).
export async function prepareImage(file: File, focus: number): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.max(WIDTH / bitmap.width, HEIGHT / bitmap.height);
  const cropWidth = WIDTH / scale;
  const cropHeight = HEIGHT / scale;
  const left = ((bitmap.width - cropWidth) * focus) / 100;
  const top = ((bitmap.height - cropHeight) * focus) / 100;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.getContext("2d")?.drawImage(bitmap, left, top, cropWidth, cropHeight, 0, 0, WIDTH, HEIGHT);
  bitmap.close();

  // Safari can't produce WebP, so it falls back to JPEG.
  let blob = await toBlob(canvas, "image/webp");
  let extension: PreparedImage["extension"] = "webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob(canvas, "image/jpeg");
    extension = "jpg";
  }
  if (!blob) throw new Error("This photo couldn't be read.");

  const base64 = await toBase64(blob);
  return { base64, extension, preview: canvas.toDataURL("image/jpeg", 0.6) };
}
