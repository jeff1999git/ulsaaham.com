/**
 * Inserts Cloudinary transformation params into an upload URL.
 * Safe to call on non-Cloudinary URLs — returns them unchanged.
 * width: target pixel width. c_limit never scales an image up past its original
 * size. There is no dpr_auto: pick a width that already covers high-density
 * screens, or give the browser a choice with cloudinarySrcSet().
 */
export function optimizeCloudinary(url, width = 600) {
  if (!url || !url.includes("res.cloudinary.com/")) return url;
  if (url.includes("/upload/f_") || url.includes("/upload/c_limit,")) return url; // already has transform
  return url.replace("/upload/", `/upload/c_limit,f_auto,q_auto,w_${width}/`);
}

/**
 * A srcset of the same image at each width, e.g. "…w_360/… 360w, …w_480/… 480w".
 * undefined for anything optimizeCloudinary() would leave unchanged, so the
 * <img> falls back to its plain src.
 */
export function cloudinarySrcSet(url, widths) {
  if (!url || optimizeCloudinary(url, widths[0]) === url) return undefined;
  return widths.map((w) => `${optimizeCloudinary(url, w)} ${w}w`).join(", ");
}
