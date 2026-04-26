// 跨檔共用的小工具

export function imageReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
