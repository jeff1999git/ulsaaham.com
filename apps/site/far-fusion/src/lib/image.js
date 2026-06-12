/**
 * Inserts Cloudinary transformation params into an upload URL.
 * Safe to call on non-Cloudinary URLs — returns them unchanged.
 * width: target max pixel width (Cloudinary will also serve 2× for retina via DPR=auto if needed)
 */
export function optimizeCloudinary(url, width = 600) {
  if (!url || !url.includes("res.cloudinary.com/")) return url;
  if (url.includes("/upload/f_")) return url; // already has transform
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}
