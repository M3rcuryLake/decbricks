import * as THREE from 'three';
import squareSolidUrl from '../../assets/shared/square-solid.png?url';

const textureCache = new Map<string, Promise<THREE.Texture | null>>();
const decodedImageUrls = new Set<string>();
const sharedTextureLoader = new THREE.TextureLoader();
sharedTextureLoader.crossOrigin = 'anonymous';

export const SQUARE_STAMP_URL = squareSolidUrl;

function configureTexture(tex: THREE.Texture): THREE.Texture {
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.userData.shared = true;
  return tex;
}

/**
 * Loads and decodes a reusable THREE.Texture into a module-level cache so
 * SPA navigations reuse GPU uploads instead of re-fetching/re-decoding.
 */
export function loadCachedTexture(url: string): Promise<THREE.Texture | null> {
  if (!url) return Promise.resolve(null);
  const existing = textureCache.get(url);
  if (existing) return existing;

  const p = sharedTextureLoader
    .loadAsync(url)
    .then(async (tex) => {
      const img = tex.image as HTMLImageElement | undefined;
      if (img && typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          // Some formats/already-decoded bitmaps reject decode() harmlessly; naturalWidth validates load.
        }
      }
      if (img && img.naturalWidth === 0) {
        textureCache.delete(url);
        tex.dispose();
        return null;
      }
      decodedImageUrls.add(url);
      return configureTexture(tex);
    })
    .catch((err) => {
      if (import.meta.env.DEV) {
        console.warn(`[WebGL Cache] Failed to load texture: ${url}`, err);
      }
      textureCache.delete(url);
      return null;
    });

  textureCache.set(url, p);
  return p;
}

/** Pre-warms and caches the mouse trail stamp texture used by TouchTexture. */
export function preloadSquareStampTexture(): Promise<THREE.Texture | null> {
  return loadCachedTexture(SQUARE_STAMP_URL);
}

/** Re-marks all cached shared textures for GPU re-upload after `webglcontextrestored`. */
export async function markCachedTexturesDirtyForRestore(): Promise<void> {
  const entries = [...textureCache.values()];
  const settled = await Promise.allSettled(entries);
  for (const res of settled) {
    if (res.status === 'fulfilled' && res.value) {
      res.value.needsUpdate = true;
    }
  }
}

export function isTextureCached(url: string): boolean {
  return decodedImageUrls.has(url);
}
