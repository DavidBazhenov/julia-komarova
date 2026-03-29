const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export function shouldBypassImageOptimization(src: string): boolean {
  return src.startsWith("/media/") || ABSOLUTE_URL_PATTERN.test(src);
}
