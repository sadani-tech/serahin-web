import {
  renderOgImage,
  ogImageSize,
  ogImageAlt,
  ogImageContentType,
} from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = ogImageAlt;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function TwitterImage() {
  return renderOgImage();
}
