/**
 * Runtime image preloading & route-asset warming helpers.
 *
 * Coordinates:
 * 1. Eagerly loading & decoding current-page images (including `loading="lazy"`
 *    below-the-fold `<picture>`/`<img>` blocks) during the initial loader window.
 * 2. Warming cross-route `<head>` preloads and `<body>` `<picture>`/`<img>`
 *    elements with AVIF/WebP + `sizes` parity so zero duplicate width/format
 *    variants are fetched.
 */

interface WarmImageDescriptor {
  key: string;
  srcset: string;
  sizes: string;
  src: string;
}

const CSS_BRAND_MARKS = ['/brand/logo.webp', '/brand/logo-red.webp'] as const;

const warmedAssetKeys = new Set<string>();
let avifSupportPromise: Promise<boolean> | null = null;
let cssBrandMarksPromise: Promise<void> | null = null;

export const isSaveDataEnabled = (): boolean =>
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

export function supportsAvif(): Promise<boolean> {
  if (!avifSupportPromise) {
    avifSupportPromise = new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve(probe.width > 0);
      probe.onerror = () => resolve(false);
      probe.src =
        'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }
  return avifSupportPromise;
}

function awaitImageSettled(img: HTMLImageElement, decodeImage = true): Promise<void> {
  const finishDecode = async (): Promise<void> => {
    if (!decodeImage || img.naturalWidth === 0 || typeof img.decode !== 'function') {
      return;
    }
    await img.decode().catch(() => undefined);
  };

  if (img.complete) return finishDecode();

  return new Promise<void>((resolve) => {
    const done = () => {
      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
      void finishDecode().then(resolve);
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
}

async function raceWithTimeout(task: Promise<unknown>, timeoutMs?: number): Promise<void> {
  if (!timeoutMs || timeoutMs <= 0) {
    await task;
    return;
  }
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    void task.then(finish, finish);
  });
}

function makeDescriptor(srcset: string, sizes: string, src: string): WarmImageDescriptor | null {
  const cleanSrcset = srcset.trim();
  const cleanSizes = sizes.trim();
  const cleanSrc = src.trim();
  if (!cleanSrcset && !cleanSrc) return null;
  if (cleanSrc.startsWith('data:')) return null;
  return {
    key: `${cleanSizes}|${cleanSrcset || cleanSrc}`,
    srcset: cleanSrcset,
    sizes: cleanSizes,
    src: cleanSrc,
  };
}

function extractDocumentDescriptors(doc: Document, canAvif: boolean): WarmImageDescriptor[] {
  const descriptors: WarmImageDescriptor[] = [];

  doc.head.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]').forEach((link) => {
    if (link.type === 'image/avif' && !canAvif) return;
    const d = makeDescriptor(
      link.getAttribute('imagesrcset') || '',
      link.getAttribute('imagesizes') || '',
      link.getAttribute('href') || ''
    );
    if (d) descriptors.push(d);
  });

  if (!doc.body) return descriptors;

  doc.body.querySelectorAll<HTMLPictureElement>('picture').forEach((picture) => {
    const childImg = picture.querySelector<HTMLImageElement>('img');
    const sources = Array.from(picture.querySelectorAll<HTMLSourceElement>('source'));
    const avifSource = canAvif
      ? sources.find((s) => s.type === 'image/avif' && s.getAttribute('srcset'))
      : undefined;
    const webpSource = sources.find((s) => s.type === 'image/webp' && s.getAttribute('srcset'));
    const fallbackSource = sources.find(
      (s) => s.type !== 'image/avif' && Boolean(s.getAttribute('srcset'))
    );
    const chosenSource = avifSource || webpSource || fallbackSource;

    const sizes =
      chosenSource?.getAttribute('sizes') || childImg?.getAttribute('sizes') || '';
    const srcset =
      chosenSource?.getAttribute('srcset') || childImg?.getAttribute('srcset') || '';
    const src = srcset ? '' : childImg?.getAttribute('src') || '';

    const d = makeDescriptor(srcset, sizes, src);
    if (d) descriptors.push(d);
  });

  doc.body.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    if (img.closest('picture')) return;
    const d = makeDescriptor(
      img.getAttribute('srcset') || '',
      img.getAttribute('sizes') || '',
      img.getAttribute('src') || ''
    );
    if (d) descriptors.push(d);
  });

  return descriptors;
}

function queueWarmDescriptor(
  descriptor: WarmImageDescriptor,
  retainedStore: HTMLImageElement[]
): Promise<void> | null {
  if (warmedAssetKeys.has(descriptor.key)) return null;
  warmedAssetKeys.add(descriptor.key);

  const img = new Image();
  img.decoding = 'async';
  // Assign `sizes` before `srcset` so the browser resolves width descriptors once.
  if (descriptor.sizes) img.sizes = descriptor.sizes;
  if (descriptor.srcset) img.srcset = descriptor.srcset;
  else if (descriptor.src) img.src = descriptor.src;
  retainedStore.push(img);

  return awaitImageSettled(img, true);
}

/**
 * Forces all images inside `root` (including `loading="lazy"` `<picture>`/`<img>`
 * blocks) to load eagerly and resolves once unique URLs settle & decode (or hit `timeoutMs`).
 */
export async function preloadCurrentPageImages(
  root: ParentNode = document,
  options: { timeoutMs?: number } = {}
): Promise<void> {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  if (images.length === 0) {
    if (root === document) void markCurrentDocumentWarmed(document);
    return;
  }

  for (const img of images) {
    if (img.loading === 'lazy') img.loading = 'eager';
  }

  const uniquePromises: Promise<void>[] = [];
  const seenKeys = new Set<string>();

  for (const img of images) {
    const key =
      img.currentSrc ||
      img.getAttribute('srcset') ||
      img.getAttribute('src') ||
      '';
    if (key && seenKeys.has(key)) continue;
    if (key) seenKeys.add(key);
    uniquePromises.push(awaitImageSettled(img, true));
  }

  if (root === document) {
    void markCurrentDocumentWarmed(document);
  }

  await raceWithTimeout(Promise.allSettled(uniquePromises), options.timeoutMs);
}

/**
 * Marks the current page's image descriptors as already warmed so cross-route
 * preloading skips shared assets (footer marks, shared contact form artwork).
 */
export async function markCurrentDocumentWarmed(doc: Document = document): Promise<void> {
  const canAvif = await supportsAvif();
  for (const d of extractDocumentDescriptors(doc, canAvif)) {
    warmedAssetKeys.add(d.key);
  }
}

/**
 * Warms responsive images declared in a fetched route Document's `<head>` preloads
 * and `<body>` `<picture>`/`<img>` tags, deduplicated across routes.
 */
export async function warmImagesFromDocument(
  doc: Document,
  retainedStore: HTMLImageElement[]
): Promise<void> {
  if (isSaveDataEnabled()) return;
  const canAvif = await supportsAvif();
  const tasks: Promise<void>[] = [];

  for (const descriptor of extractDocumentDescriptors(doc, canAvif)) {
    const pending = queueWarmDescriptor(descriptor, retainedStore);
    if (pending) tasks.push(pending);
  }

  await Promise.allSettled(tasks);
}

/**
 * Warms static CSS background logo marks (`/brand/logo*.webp`) once per session.
 */
export function preloadCssBrandMarks(retainedStore: HTMLImageElement[]): Promise<void> {
  if (isSaveDataEnabled()) return Promise.resolve();
  if (cssBrandMarksPromise) return cssBrandMarksPromise;

  const tasks: Promise<void>[] = [];
  for (const href of CSS_BRAND_MARKS) {
    const descriptor = makeDescriptor('', '', href);
    if (!descriptor) continue;
    const pending = queueWarmDescriptor(descriptor, retainedStore);
    if (pending) tasks.push(pending);
  }

  cssBrandMarksPromise = Promise.allSettled(tasks).then(() => undefined);
  return cssBrandMarksPromise;
}
