import * as THREE from 'three';
import { gsap, ScrollTrigger, bus, prefersReducedMotion } from '../core/gsap';
import { ensurePreviewVideoSource, waitForVideoFirstFrame } from '../media';
import { getLenis } from '../smooth-scroll';
import {
  loadCachedTexture,
  markCachedTexturesDirtyForRestore,
  preloadSquareStampTexture,
} from './cache';
import { canUseDistortion, setDistortionState } from './capability';

const TOUCH_VERTEX_SHADER = `uniform float uTime;
uniform float uBirthTime;
uniform float uBirthScroll;
uniform float uCurrentScroll;
uniform float uDuration;
uniform float uGrowth;

varying float vAge;
varying float vAlpha;
varying vec2 vUv;

void main() {
  float scrollOffset = uCurrentScroll - uBirthScroll;

  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  modelPosition.y += scrollOffset;
  
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  vUv = uv;
  vAge = uTime - uBirthTime;

  if (vAge < 0.0) {
    vAlpha = 0.0;
  } else if (vAge > uDuration) {
    vAlpha = 0.0;
  } else {
    vAlpha = 1.0;
  }
}`;

const TOUCH_FRAGMENT_SHADER = `uniform sampler2D uTexture;
uniform float uDuration;

varying float vAge;
varying float vAlpha;
varying vec2 vUv;
      
void main() {
  if (vAge < 0.0 || vAge > uDuration) {
    discard;
  }
  
  vec4 texColor = texture2D(uTexture, vUv);
  
  float finalAlpha = vAlpha * texColor.a;
  
  gl_FragColor = vec4(texColor.rgb, finalAlpha);
}`;

const BG_VERTEX_SHADER = `varying vec2 vUv;
varying vec2 vWorldPosition;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  vWorldPosition = modelPosition.xy;
  vUv = uv;
}`;

const BG_FRAGMENT_SHADER = `varying vec2 vUv;
varying vec2 vWorldPosition;

uniform sampler2D uMouseTexture;
uniform vec3 uColor;
uniform vec2 uPlaneAspect;
uniform vec2 uResolution;
uniform float uTrailThreshold;
uniform float uPixelSize;
uniform float uTrailBrightness;
uniform float uTrailStep;
uniform vec3 uTrailColor;
uniform vec4 uBorderRadius;
uniform float uScrollY;
uniform float uScale;

vec3 linearTosRGB(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
}

vec2 aspect(vec2 size) {
  return size / min(size.x, size.y);
}

vec2 objectCover(vec2 uv, vec2 imageBounds, vec2 resolution) {
  vec2 s = aspect(resolution);
  vec2 i = aspect(imageBounds);
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
  vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
  vec2 newUv = vUv * s / new + offset;
  return (newUv - vec2(0.5, 0.5)) / 1.0 + vec2(0.5, 0.5);
}
float borderRadius(vec2 uv, vec2 size, vec4 radius) {
  vec2 pos = (uv - 0.5) * size;
  vec2 cornerWeight = uv;
  
  float currentRadius = mix(
    mix(radius.w, radius.z, cornerWeight.x),
    mix(radius.x, radius.y, cornerWeight.x),
    cornerWeight.y
  );
  
  vec2 d = abs(pos) - size * 0.5 + currentRadius;
  float dist = min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - currentRadius;
  
  return step(dist, 0.0);
}
vec2 pixelateUV(vec2 uv, vec2 pixelCount) {
  vec2 pixelSize = vec2(1.0) / pixelCount;
  vec2 pixelated = (floor(uv / pixelSize) + 0.5) * pixelSize;
  return clamp(pixelated, pixelSize * 0.5, vec2(1.0) - pixelSize * 0.5);
}

void main () {
  float mask = borderRadius(vUv , uPlaneAspect, uBorderRadius);
  if (mask <= 0.1) discard;

  vec2 adjustedWorldPos = vWorldPosition;
  adjustedWorldPos.y += uScrollY;

  vec2 screenUv = (adjustedWorldPos + uResolution * 0.5) / uResolution;
  vec2 screenPixelCount = uResolution / uPixelSize;
  screenUv = pixelateUV(screenUv, screenPixelCount);

  vec4 mouseTexture = texture2D(uMouseTexture, screenUv);
  mouseTexture = step(0.2, mouseTexture);

  vec3 finalColor = mix(uColor, uTrailColor, mouseTexture.r);
  gl_FragColor = vec4(finalColor,1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const IMAGE_VERTEX_SHADER = `varying vec2 vUv;
varying vec2 vWorldPosition;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  vWorldPosition = modelPosition.xy;
  vUv = uv;
}`;

const IMAGE_FRAGMENT_SHADER = `varying vec2 vUv;
varying vec2 vWorldPosition;

uniform sampler2D uTexture;
uniform sampler2D uMouseTexture;
uniform vec3 uTrailColor;
uniform mediump float uTrailOpacity;
uniform mediump float uTrailThreshold;
uniform vec2 uTextureAspect;
uniform vec2 uPlaneAspect;
uniform vec2 uEffectiveAspect;
uniform vec2 uResolution;
uniform vec2 uScale;
uniform mediump float uPixelSize;
uniform mediump float uTrailBrightness;
uniform float uScrollY;
uniform float uOpacity;
uniform float uClipY;
uniform vec4 uBorderRadius;

vec2 aspect(vec2 size) {
  return size / min(size.x, size.y);
}

vec2 objectCover(vec2 uv, vec2 imageBounds, vec2 resolution) {
  vec2 s = aspect(resolution);
  vec2 i = aspect(imageBounds);
  float rs = s.x / s.y;
  float ri = i.x / i.y;
  vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
  vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
  vec2 newUv = vUv * s / new + offset;
  return (newUv - vec2(0.5, 0.5)) / 1.0 + vec2(0.5, 0.5);
}
float borderRadius(vec2 uv, vec2 size, vec4 radius) {
  vec2 pos = (uv - 0.5) * size;
  vec2 cornerWeight = uv;
  
  float currentRadius = mix(
    mix(radius.w, radius.z, cornerWeight.x),
    mix(radius.x, radius.y, cornerWeight.x),
    cornerWeight.y
  );
  
  vec2 d = abs(pos) - size * 0.5 + currentRadius;
  float dist = min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - currentRadius;
  
  return step(dist, 0.0);
}
vec2 pixelateUV(vec2 uv, vec2 pixelCount) {
  vec2 pixelSize = vec2(1.0) / pixelCount;
  vec2 pixelated = (floor(uv / pixelSize) + 0.5) * pixelSize;
  return clamp(pixelated, pixelSize * 0.5, vec2(1.0) - pixelSize * 0.5);
}

const vec3 LUMINANCE_WEIGHTS = vec3(0.299, 0.587, 0.114);

void main() {
  if (gl_FragCoord.y < uClipY) discard;

  
  float mask = borderRadius(vUv, uPlaneAspect, uBorderRadius);
  if (mask <= 0.1) discard;

  
  vec2 adjustedWorldPos = vWorldPosition + vec2(0.0, uScrollY);

  
  vec2 pixelUv = objectCover(vUv, uTextureAspect, uPlaneAspect);
  vec2 screenUv = (adjustedWorldPos + uResolution * 0.5) / uResolution;

  
  float textureRatio = uTextureAspect.x / uTextureAspect.y;
  float planeRatio = uPlaneAspect.x / uPlaneAspect.y;
  
  
  vec2 scaledEffectiveSize = uEffectiveAspect * uScale;
  float basePixelCount = max(scaledEffectiveSize.x, scaledEffectiveSize.y) / uPixelSize;
  vec2 pixelCount = vec2(basePixelCount) * scaledEffectiveSize / max(scaledEffectiveSize.x, scaledEffectiveSize.y);
  
  
  float baseScreenPixelCount = max(uResolution.x, uResolution.y) / uPixelSize;
  vec2 screenPixelCount = vec2(baseScreenPixelCount) * uResolution / max(uResolution.x, uResolution.y);
  
  pixelUv = pixelateUV(pixelUv, pixelCount);
  screenUv = pixelateUV(screenUv, screenPixelCount);

  
  vec4 mouseTexture = texture2D(uMouseTexture, screenUv);
  vec4 pixelatedTexture = texture2D(uTexture, pixelUv);
  vec4 originalTexture = texture2D(uTexture, objectCover(pixelUv, uTextureAspect, uPlaneAspect * uScale));

  
  float mouseBrightness = dot(mouseTexture.rgb, LUMINANCE_WEIGHTS);
  float luminance = dot(pixelatedTexture.rgb, LUMINANCE_WEIGHTS);
  
  
  float thresholdLow = uTrailThreshold - 0.2;
  float mouseEffect = smoothstep(thresholdLow, uTrailThreshold, mouseBrightness);
  float mixFactor = smoothstep(thresholdLow, uTrailThreshold, luminance) * mouseEffect;

  
  vec3 coloredPixelated = mix(pixelatedTexture.rgb, uTrailColor, uTrailOpacity) * uTrailBrightness;
  vec3 finalColor = mix(originalTexture.rgb, coloredPixelated, mixFactor);

  gl_FragColor = vec4(finalColor, uOpacity);
}`;

const TRAIL_VERTEX_SHADER = `
attribute float instanceOpacity;
varying float vOpacity;

void main() {
  vOpacity = instanceOpacity;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;

const TRAIL_FRAGMENT_SHADER = `
uniform vec3 color;
uniform float opacity;
varying float vOpacity;

void main() {
  gl_FragColor = vec4(color, vOpacity * opacity);
}
`;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Numeric THREE.Color args are treated as LINEAR working-space values, and the
 * renderer converts linear→sRGB on output. CSS colour strings are sRGB, so they
 * must be converted sRGB→linear before constructing a Color.
 */
function srgbColor(r: number, g: number, b: number): THREE.Color {
  return new THREE.Color().setRGB(
    clamp01(r),
    clamp01(g),
    clamp01(b),
    THREE.SRGBColorSpace
  );
}

function parseCssColor(str: string | null | undefined, fallback = new THREE.Color(1, 1, 1)): THREE.Color {
  if (!str) return fallback;
  const s = str.trim().toLowerCase();
  if (s.startsWith('oklch')) {
    const m = s.match(/oklch\(\s*([^)]+)\s*\)/i);
    if (!m) return fallback;
    const parts = m[1].split(/[\s,]+/).map((p) => p.trim());
    const L = parseFloat(parts[0]);
    const C = parseFloat(parts[1]);
    const H = parseFloat(parts[2]) || 0;
    const a = C * Math.cos((H * Math.PI) / 180);
    const b = C * Math.sin((H * Math.PI) / 180);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3;
    const mCube = m_ ** 3;
    const sCube = s_ ** 3;
    const r = 4.0767416621 * l - 3.3077115913 * mCube + 0.2309699292 * sCube;
    const g = -1.2684380046 * l + 2.6097574011 * mCube - 0.3413193965 * sCube;
    const bl = -0.0041960863 * l - 0.7034186147 * mCube + 1.707614701 * sCube;
    return new THREE.Color(clamp01(r), clamp01(g), clamp01(bl));
  }
  if (s.startsWith('rgb')) {
    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (!m) return fallback;
    return srgbColor(
      clamp01(parseFloat(m[1]) / 255),
      clamp01(parseFloat(m[2]) / 255),
      clamp01(parseFloat(m[3]) / 255)
    );
  }
  return fallback;
}

function getElementRotationRad(el: HTMLElement): number {
  const cs = window.getComputedStyle(el);
  const rot = cs.rotate;
  const tr = cs.transform;
  if (rot && rot !== 'none') {
    const m = rot.match(/(-?\d+(?:\.\d+)?)deg/);
    if (m) return parseFloat(m[1]) * (Math.PI / 180);
  }
  if (!tr || tr === 'none') return 0;
  try {
    const m = tr.match(/matrix.*\(([^)]+)\)/);
    if (m) {
      const vals = m[1].split(',').map((v) => parseFloat(v.trim()));
      if (vals.length >= 6 && !isNaN(vals[0]) && !isNaN(vals[1])) {
        return Math.atan2(vals[1], vals[0]);
      }
    }
  } catch {}
  return 0;
}

function resolveOriginComponent(comp: string | undefined, size: number): number {
  if (comp === undefined || comp === 'center') return size / 2;
  if (comp === 'left' || comp === 'top') return 0;
  if (comp === 'right' || comp === 'bottom') return size;
  const n = parseFloat(comp);
  if (!Number.isFinite(n)) return size / 2;
  return comp.endsWith('%') ? (n / 100) * size : n;
}

function parseTransformOrigin(cs: CSSStyleDeclaration, w: number, h: number) {
  const to = cs.transformOrigin;
  if (!to) return { x: 0, y: 0 };
  const parts = to.split(' ');
  const ox = resolveOriginComponent(parts[0], w);
  const oy = resolveOriginComponent(parts[1], h);
  return { x: ox - w / 2, y: h / 2 - oy };
}

function getElementSpace(el: HTMLElement, width: number, height: number, stripSliderAncestors = false) {
  const rotation = getElementRotationRad(el);
  const targetsToStrip: { node: HTMLElement; prevTransform: string; prevRotate: string }[] = [
    { node: el, prevTransform: el.style.transform, prevRotate: el.style.rotate },
  ];

  if (stripSliderAncestors) {
    const inner = el.closest<HTMLElement>('.parts-caseStudyCard__inner');
    const slide = el.closest<HTMLElement>('.parts-caseStudySlider__slide');
    const wrapper = el.closest<HTMLElement>('.parts-caseStudySlider__wrapper');
    for (const anc of [inner, slide, wrapper]) {
      if (anc && anc !== el) {
        targetsToStrip.push({
          node: anc,
          prevTransform: anc.style.transform,
          prevRotate: anc.style.rotate,
        });
      }
    }
  }

  for (const item of targetsToStrip) {
    item.node.style.setProperty('transform', 'none', 'important');
    item.node.style.setProperty('rotate', 'none', 'important');
  }
  void el.offsetHeight;

  const rect = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  const w = parseFloat(cs.width) || rect.width;
  const h = parseFloat(cs.height) || rect.height;
  const borderRadius = {
    topLeft: parseFloat(cs.borderTopLeftRadius) || 0,
    topRight: parseFloat(cs.borderTopRightRadius) || 0,
    bottomLeft: parseFloat(cs.borderBottomLeftRadius) || 0,
    bottomRight: parseFloat(cs.borderBottomRightRadius) || 0,
  };
  const transformOrigin = parseTransformOrigin(cs, rect.width, rect.height);
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (const item of targetsToStrip) {
    if (item.prevTransform) {
      item.node.style.transform = item.prevTransform;
    } else {
      item.node.style.removeProperty('transform');
    }
    if (item.prevRotate) {
      item.node.style.rotate = item.prevRotate;
    } else {
      item.node.style.removeProperty('rotate');
    }
  }

  const scrollY = getLenis()?.scroll ?? window.scrollY;
  return {
    width: w,
    height: h,
    rotation,
    x: cx - width / 2,
    y: -(cy - height / 2) - scrollY,
    xOriginal: cx - w / 2,
    yOriginal: cy - h / 2,
    borderRadius,
    transformOrigin,
    zIndex: parseFloat(cs.zIndex) / 100 || 0,
    computedStyle: cs,
  };
}

/**
 * Verifies a ShaderMaterial compiles and links cleanly against a renderer's
 * active WebGL context; throws if compilation/linking failed or context was lost.
 */
function compileAndVerifyObject(
  renderer: THREE.WebGLRenderer,
  object: THREE.Object3D,
  camera: THREE.Camera,
  material: THREE.Material
): void {
  const gl = renderer.getContext();
  if (gl.isContextLost()) {
    throw new Error('WebGL context is lost');
  }
  renderer.compile(object, camera);
  const props = renderer.properties.get(material) as
    | { currentProgram?: { program?: WebGLProgram; diagnostics?: { runnable?: boolean } } }
    | undefined;
  const currentProgram = props?.currentProgram;
  if (!currentProgram?.program) {
    throw new Error('Shader program missing after compile');
  }
  if (currentProgram.diagnostics?.runnable === false) {
    throw new Error('Shader program diagnostics reported non-runnable');
  }
  if (!gl.getProgramParameter(currentProgram.program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(currentProgram.program) || 'unknown link error';
    throw new Error(`Shader program link failed: ${log}`);
  }
}

export interface WebGLImageUpdateValues {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  opacity?: number;
  borderRadius?: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  };
}

export interface WebGLImageOptions {
  opacity?: number;
  type?: 'image' | 'video';
  group?: THREE.Group | null;
}

interface ImageRuntimeHooks {
  getRenderer: () => THREE.WebGLRenderer;
  getCamera: () => THREE.Camera;
  isContextLost: () => boolean;
  onDirty: () => void;
  onDisposed: (img: WebGLImage) => void;
}

function getDistortionHost(el: HTMLElement): HTMLElement {
  return el.closest<HTMLElement>('.parts-caseStudyCard') ?? el;
}

function revealDomFallback(el: HTMLElement, type: 'image' | 'video'): void {
  if (type === 'video') {
    el.classList.remove('lg:invisible');
    el.style.removeProperty('visibility');
  } else {
    el.classList.remove('lg:opacity-0');
    el.style.removeProperty('opacity');
  }
  setDistortionState(getDistortionHost(el), 'fallback');
}

function hideDomForWebGL(el: HTMLElement, type: 'image' | 'video'): void {
  if (type === 'video') {
    el.classList.add('lg:invisible');
  } else {
    el.classList.add('lg:opacity-0');
  }
  setDistortionState(getDistortionHost(el), 'ready');
}

function waitForNonZeroLayout(el: HTMLElement, signal: AbortSignal): Promise<boolean> {
  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return Promise.resolve(true);
  if (signal.aborted || typeof ResizeObserver === 'undefined') {
    return Promise.resolve(rect.width > 0 && rect.height > 0);
  }

  return new Promise((resolve) => {
    let settled = false;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && !settled) {
        settled = true;
        ro.disconnect();
        signal.removeEventListener('abort', onAbort);
        resolve(true);
      }
    });
    const onAbort = () => {
      if (settled) return;
      settled = true;
      ro.disconnect();
      resolve(false);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    ro.observe(el);
  });
}

export class WebGLImage {
  private static sharedGeometry: THREE.PlaneGeometry | null = null;
  private static getSharedGeometry() {
    if (!WebGLImage.sharedGeometry) {
      WebGLImage.sharedGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    }
    return WebGLImage.sharedGeometry;
  }

  public isReady = false;
  public isWebGLActive = false;
  public isDestroyed = false;
  public group: THREE.Group | null = null;
  public mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  public material: THREE.ShaderMaterial | null = null;
  public imageTexture: THREE.Texture | null = null;
  public imageSpace: ReturnType<WebGLImage['getImageSpace']> | null = null;
  public ready: Promise<this>;
  public options: Required<WebGLImageOptions>;

  private ac = new AbortController();
  private pivot = { x: 0, y: 0 };
  private currentTextureUrl = '';
  private pendingTransform: { values: WebGLImageUpdateValues; updateMeshPos: boolean } | null = null;
  private videoIo: IntersectionObserver | null = null;
  private videoOnscreen = true;
  private rvfcId = 0;

  constructor(
    public image: HTMLImageElement | HTMLVideoElement,
    private scene: THREE.Scene,
    private getSizes: () => { width: number; height: number },
    private sharedUniforms: Record<string, THREE.IUniform>,
    private hooks: ImageRuntimeHooks,
    options: WebGLImageOptions = {}
  ) {
    this.options = {
      opacity: 1,
      type: image.tagName === 'VIDEO' ? 'video' : 'image',
      group: null,
      ...options,
    };
    this.handleSourceChange = this.handleSourceChange.bind(this);
    setDistortionState(getDistortionHost(this.image), 'pending');
    if (this.options.type !== 'video') {
      this.image.addEventListener('load', this.handleSourceChange, { signal: this.ac.signal });
    }
    this.ready = this.init();
  }

  private async init(): Promise<this> {
    try {
      if (!canUseDistortion() || this.hooks.isContextLost()) {
        this.activateFallback();
        return this;
      }

      const sized = await waitForNonZeroLayout(this.image, this.ac.signal);
      if (this.isDestroyed || !sized) {
        if (!this.isDestroyed) this.activateFallback();
        return this;
      }

      const [stampOk, texOk] = await Promise.all([
        preloadSquareStampTexture(),
        this.setupTexture(),
      ]);
      if (this.isDestroyed || !stampOk || !texOk || !this.imageTexture) {
        if (!this.isDestroyed) this.activateFallback();
        return this;
      }

      if (!canUseDistortion() || this.hooks.isContextLost()) {
        this.activateFallback();
        return this;
      }

      this.imageSpace = this.getImageSpace();
      if (!this.imageSpace.width || !this.imageSpace.height) {
        this.activateFallback();
        return this;
      }

      this.setupMaterial();
      this.setupMesh();

      if (this.mesh && this.material) {
        compileAndVerifyObject(
          this.hooks.getRenderer(),
          this.mesh,
          this.hooks.getCamera(),
          this.material
        );
      }

      this.isWebGLActive = true;
      this.isReady = true;
      hideDomForWebGL(this.image, this.options.type);
      this.hooks.onDirty();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[WebGLImage] Falling back cleanly after init failure:', err);
      }
      if (!this.isDestroyed) {
        this.activateFallback();
      }
    }
    return this;
  }

  public activateFallback(): void {
    this.isWebGLActive = false;
    this.isReady = true;
    this.disposeGpuNodes();
    if (this.image) {
      revealDomFallback(this.image, this.options.type);
    }
  }

  public restoreAfterContextLost(): void {
    if (this.isDestroyed || !canUseDistortion()) return;
    if (this.mesh && this.material) {
      try {
        if (this.imageTexture) {
          this.imageTexture.needsUpdate = true;
        }
        this.material.needsUpdate = true;
        compileAndVerifyObject(
          this.hooks.getRenderer(),
          this.mesh,
          this.hooks.getCamera(),
          this.material
        );
        this.isWebGLActive = true;
        hideDomForWebGL(this.image, this.options.type);
        this.resize();
        this.hooks.onDirty();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[WebGLImage] Restore failed; staying on fallback:', err);
        }
        this.activateFallback();
      }
    } else {
      void this.init();
    }
  }

  private async setupTexture(): Promise<boolean> {
    if (this.options.type === 'video') {
      return this.setupVideoTexture();
    }
    const url = await this.resolveImageUrl();
    if (this.isDestroyed || !url) return false;
    this.currentTextureUrl = url;
    const tex = await loadCachedTexture(url);
    if (!tex || this.isDestroyed) return false;
    this.imageTexture = tex;
    return true;
  }

  private async resolveImageUrl(): Promise<string> {
    const img = this.image as HTMLImageElement;
    if (!img) return '';
    if (img.loading === 'lazy') img.loading = 'eager';

    if (!img.complete) {
      const loaded = await new Promise<boolean>((resolve) => {
        if (this.ac.signal.aborted) return resolve(false);
        let timer = 0;
        const done = (ok: boolean) => {
          window.clearTimeout(timer);
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onErr);
          this.ac.signal.removeEventListener('abort', onAbort);
          resolve(ok);
        };
        const onLoad = () => done(true);
        const onErr = () => done(false);
        const onAbort = () => done(false);
        timer = window.setTimeout(() => done(img.complete && img.naturalWidth > 0), 8000);
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onErr, { once: true });
        this.ac.signal.addEventListener('abort', onAbort, { once: true });
      });
      if (!loaded || this.isDestroyed) return '';
    }

    if (img.naturalWidth === 0 || img.naturalHeight === 0) return '';
    if (typeof img.decode === 'function') {
      try {
        await img.decode();
      } catch {
        if (img.naturalWidth === 0) return '';
      }
    }
    return img.currentSrc || img.src || '';
  }

  private async handleSourceChange() {
    if (this.isDestroyed || !canUseDistortion()) return;
    const img = this.image as HTMLImageElement;
    const url = img?.currentSrc;
    if (!url || url === this.currentTextureUrl || img.naturalWidth === 0) return;
    const tex = await loadCachedTexture(url);
    if (!this.isDestroyed && tex && this.material) {
      this.currentTextureUrl = url;
      this.imageTexture = tex;
      this.material.uniforms.uTexture.value = tex;
      this.hooks.onDirty();
    }
  }

  private async setupVideoTexture(): Promise<boolean> {
    const video = this.image as HTMLVideoElement;
    ensurePreviewVideoSource(video);
    const hasFrame = await waitForVideoFirstFrame(video, {
      signal: this.ac.signal,
      timeoutMs: 4000,
    });
    if (this.isDestroyed) return false;
    if (!hasFrame || video.videoWidth <= 0 || video.videoHeight <= 0) {
      // Wait passively for delayed first frame (Slow 4G / throttled stream) so DOM stays visible now and upgrades seamlessly when ready.
      video.addEventListener(
        'loadeddata',
        () => {
          if (
            !this.isDestroyed &&
            !this.isWebGLActive &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            canUseDistortion() &&
            !this.hooks.isContextLost()
          ) {
            this.ready = this.init().then(() => {
              this.resize();
              return this;
            });
          }
        },
        { once: true, signal: this.ac.signal }
      );
      return false;
    }

    // Use controlled THREE.Texture + isVideoTexture flag (texImage2D path) with a
    // no-op update() so frames only upload when a new decoded frame arrives while visible.
    const tex = new THREE.Texture(video) as THREE.Texture & {
      isVideoTexture: boolean;
      update: () => void;
    };
    tex.isVideoTexture = true;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    tex.update = () => {};
    this.imageTexture = tex;

    if (video.autoplay && video.paused && this.videoOnscreen && !document.hidden) {
      video.play()?.catch(() => {});
    }

    this.bindVideoFrameDriver(video);
    return true;
  }

  private bindVideoFrameDriver(video: HTMLVideoElement): void {
    const markFrame = () => {
      if (this.isDestroyed || !this.imageTexture) return;
      if (
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        this.videoOnscreen &&
        !document.hidden
      ) {
        this.imageTexture.needsUpdate = true;
        this.hooks.onDirty();
      }
    };

    if (typeof IntersectionObserver !== 'undefined') {
      this.videoIo = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.videoOnscreen = entry.isIntersecting;
            if (this.videoOnscreen && !document.hidden) {
              markFrame();
            }
          }
        },
        { rootMargin: '100px' }
      );
      this.videoIo.observe(video);
    }

    const rVfcVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    };

    if (typeof rVfcVideo.requestVideoFrameCallback === 'function') {
      const schedule = () => {
        if (this.isDestroyed || this.ac.signal.aborted) return;
        this.rvfcId = rVfcVideo.requestVideoFrameCallback!(() => {
          this.rvfcId = 0;
          if (!video.paused) {
            markFrame();
          }
          schedule();
        });
      };
      schedule();
      video.addEventListener('seeked', markFrame, { signal: this.ac.signal });
      video.addEventListener('loadeddata', markFrame, { signal: this.ac.signal });
    } else {
      video.addEventListener('timeupdate', markFrame, { signal: this.ac.signal });
      video.addEventListener('seeked', markFrame, { signal: this.ac.signal });
      video.addEventListener('loadeddata', markFrame, { signal: this.ac.signal });
    }
  }

  private getMediaDimensions() {
    if (this.options.type === 'video') {
      const v = this.image as HTMLVideoElement;
      return {
        imageWidth: v.videoWidth || v.width || 0,
        imageHeight: v.videoHeight || v.height || 0,
      };
    }
    const img = this.image as HTMLImageElement;
    return {
      imageWidth: parseFloat(img.getAttribute('width') || '') || img.naturalWidth || img.width || 0,
      imageHeight: parseFloat(img.getAttribute('height') || '') || img.naturalHeight || img.height || 0,
    };
  }

  public getImageSpace(_force = false) {
    const sizes = this.getSizes();
    const isSliderCard = Boolean(this.options.group);
    const b = getElementSpace(this.image, sizes.width, sizes.height, isSliderCard);
    let { imageWidth, imageHeight } = this.getMediaDimensions();
    if (!imageWidth || !imageHeight) {
      imageWidth = b.width;
      imageHeight = b.height;
    }
    return {
      width: b.width,
      height: b.height,
      imageWidth,
      imageHeight,
      rotation: b.rotation,
      x: b.x,
      y: b.y,
      xOriginal: b.xOriginal,
      yOriginal: b.yOriginal,
      borderRadius: b.borderRadius,
      transformOrigin: b.transformOrigin,
      zIndex: b.zIndex,
    };
  }

  private calculateEffectiveAspectRatio() {
    if (!this.imageSpace) return new THREE.Vector2(1, 1);
    const { width: w, height: h, imageWidth: iw, imageHeight: ih } = this.imageSpace;
    if (!w || !h || !iw || !ih) return new THREE.Vector2(w || 1, h || 1);
    const texRatio = iw / ih;
    const planeRatio = w / h;
    const vec =
      texRatio > planeRatio
        ? new THREE.Vector2(texRatio / planeRatio, 1)
        : new THREE.Vector2(1, planeRatio / texRatio);
    vec.x *= w;
    vec.y *= h;
    return vec;
  }

  private setupMaterial() {
    if (!this.imageSpace) return;
    const effAspect = this.calculateEffectiveAspectRatio();
    const uniforms: Record<string, THREE.IUniform> = {
      uPlaneAspect: { value: new THREE.Vector2(this.imageSpace.width, this.imageSpace.height) },
      uEffectiveAspect: { value: effAspect },
      uTexture: { value: this.imageTexture },
      uTextureAspect: { value: new THREE.Vector2(this.imageSpace.imageWidth, this.imageSpace.imageHeight) },
      uBorderRadius: {
        value: new THREE.Vector4(
          this.imageSpace.borderRadius.topLeft,
          this.imageSpace.borderRadius.topRight,
          this.imageSpace.borderRadius.bottomRight,
          this.imageSpace.borderRadius.bottomLeft
        ),
      },
      uScale: { value: new THREE.Vector2(1, 1) },
      uOpacity: { value: this.options.opacity },
      ...this.sharedUniforms,
    };

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: IMAGE_VERTEX_SHADER,
      fragmentShader: IMAGE_FRAGMENT_SHADER,
      transparent: true,
    });
  }

  private getParent(): THREE.Object3D {
    return this.options.group || this.scene;
  }

  private setupMesh() {
    if (!this.material || !this.imageSpace) return;
    this.group = new THREE.Group();
    this.mesh = new THREE.Mesh(WebGLImage.getSharedGeometry(), this.material);
    this.group.add(this.mesh);
    this.pivot = this.imageSpace.transformOrigin;
    this.group.position.set(
      this.imageSpace.x + this.pivot.x,
      this.imageSpace.y + this.pivot.y,
      this.imageSpace.zIndex
    );
    this.mesh.position.set(-this.pivot.x, -this.pivot.y, 0);
    this.mesh.scale.set(this.imageSpace.width, this.imageSpace.height, 1);
    this.group.rotation.set(0, 0, -this.imageSpace.rotation);
    this.getParent().add(this.group);
    if (this.pendingTransform) {
      this.updatePosition(this.pendingTransform.values, this.pendingTransform.updateMeshPos);
    }
  }

  public updatePosition(values: WebGLImageUpdateValues = {}, updateMeshPos = false) {
    this.pendingTransform = { values, updateMeshPos };
    if (!this.group || !this.mesh || !this.material || !this.imageSpace) return;
    const target = updateMeshPos ? this.mesh : this.group;
    const scaleX = values.scaleX || 1;
    const scaleY = values.scaleY || 1;
    const rotation = values.rotation ?? 0;
    const x = values.x || 0;
    const y = values.y || 0;
    const borderRadius = values.borderRadius;
    const opacity = values.opacity === undefined ? null : values.opacity;

    const px = updateMeshPos ? x - this.pivot.x : this.imageSpace.x + x + this.pivot.x;
    const py = updateMeshPos ? -y - this.pivot.y : this.imageSpace.y - y + this.pivot.y;

    target.position.set(px, py, this.imageSpace.zIndex);
    this.mesh.scale.set(scaleX * this.imageSpace.width, scaleY * this.imageSpace.height, 1);
    this.material.uniforms.uScale.value.set(scaleX, scaleY);
    if (opacity !== null) {
      this.material.uniforms.uOpacity.value = opacity;
    }
    if (borderRadius) {
      this.material.uniforms.uBorderRadius.value.set(
        borderRadius.topLeft,
        borderRadius.topRight,
        borderRadius.bottomRight,
        borderRadius.bottomLeft
      );
    }
    target.rotation.set(0, 0, -rotation * (Math.PI / 180));
    this.hooks.onDirty();
  }

  public resize() {
    if (!this.image || !this.group || !this.mesh) return;
    this.imageSpace = this.getImageSpace(true);
    this.pivot = this.imageSpace.transformOrigin;
    const g = (this.image as any)._gsap;
    const sx = g?.scaleX || 1;
    const sy = g?.scaleY || 1;
    this.group.position.set(
      this.imageSpace.x + this.pivot.x,
      this.imageSpace.y + this.pivot.y,
      this.imageSpace.zIndex
    );
    this.mesh.position.set(-this.pivot.x, -this.pivot.y, 0);
    this.mesh.scale.set(this.imageSpace.width * sx, this.imageSpace.height * sy, 1);
    this.group.rotation.set(0, 0, -this.imageSpace.rotation);
    if (this.material) {
      this.material.uniforms.uPlaneAspect.value.set(this.imageSpace.width, this.imageSpace.height);
      this.material.uniforms.uTextureAspect.value.set(this.imageSpace.imageWidth, this.imageSpace.imageHeight);
      const eff = this.calculateEffectiveAspectRatio();
      this.material.uniforms.uEffectiveAspect.value.copy(eff);
    }
    if (this.pendingTransform) {
      this.updatePosition(this.pendingTransform.values, this.pendingTransform.updateMeshPos);
    }
    this.hooks.onDirty();
  }

  private disposeGpuNodes() {
    if (this.group) {
      this.getParent()?.remove(this.group);
      this.group.clear();
    }
    this.material?.dispose();
    this.material = null;
    if (this.imageTexture && !this.imageTexture.userData?.shared) {
      this.imageTexture.dispose();
    }
    this.imageTexture = null;
    this.mesh = null;
    this.group = null;
  }

  public destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.isWebGLActive = false;
    this.ac.abort();
    this.videoIo?.disconnect();
    this.videoIo = null;
    if (this.rvfcId && this.options.type === 'video') {
      const v = this.image as HTMLVideoElement & { cancelVideoFrameCallback?: (id: number) => void };
      v.cancelVideoFrameCallback?.(this.rvfcId);
      this.rvfcId = 0;
    }
    this.disposeGpuNodes();
    this.hooks.onDisposed(this);
  }
}

export interface WebGLTrailOptions {
  planeSize?: { width: number; height: number } | (() => { width: number; height: number });
  planeCount?: number;
  staggerDelay?: number;
}

export class WebGLTrail {
  public timeline = gsap.timeline({ paused: true });
  public exitTimeline = gsap.timeline({ paused: true });
  private instancedMesh: THREE.InstancedMesh | null = null;
  private planeCount = 100;
  private staggerDelay = 0.01;
  private planeSize: { width: number; height: number } | (() => { width: number; height: number }) = {
    width: 100,
    height: 100,
  };
  private pathPoints: THREE.Vector3[] = [];
  private spacedPoints: THREE.Vector3[] = [];

  constructor(
    private el: SVGSVGElement,
    private scene: THREE.Scene,
    private getSizes: () => { width: number; height: number },
    private onDirty?: () => void,
    options: WebGLTrailOptions = {}
  ) {
    if (options.planeCount !== undefined) this.planeCount = options.planeCount;
    if (options.staggerDelay !== undefined) this.staggerDelay = options.staggerDelay;
    if (options.planeSize !== undefined) this.planeSize = options.planeSize;
    this.init();
  }

  private getPlaneSize(): { width: number; height: number } {
    return typeof this.planeSize === 'function' ? this.planeSize() : this.planeSize;
  }

  private init() {
    const path = this.el.querySelector('path');
    if (!path) return;
    this.parseSVGPath(path);
    if (this.pathPoints.length < 2) return;
    this.createPlanes();
    this.createTimelines();
  }

  private parseSVGPath(path: SVGPathElement) {
    const sizes = this.getSizes();
    const space = getElementSpace(this.el as unknown as HTMLElement, sizes.width, sizes.height);
    const vb = this.el.viewBox?.baseVal;
    const vbW = vb?.width || space.width || 1;
    const vbH = vb?.height || space.height || 1;
    const d = path.getAttribute('d') || '';
    const pts = this.svgPathToPoints(d);
    const scrollY = getLenis()?.scroll ?? window.scrollY;
    this.pathPoints = pts.map((p) => {
      const rx = space.xOriginal + (p.x / vbW) * space.width;
      const ry = space.yOriginal + (p.y / vbH) * space.height;
      const ax = rx - sizes.width / 2;
      const ay = -(ry - sizes.height / 2) - scrollY;
      return new THREE.Vector3(ax, ay, 0);
    });
  }

  private svgPathToPoints(d: string) {
    const pts: { x: number; y: number }[] = [];
    let x = 0;
    let y = 0;
    const segments = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/gi) || [];
    for (const seg of segments) {
      const cmd = seg[0];
      const nums = seg
        .slice(1)
        .trim()
        .replace(/(-)/g, ' $1')
        .split(/[\s,]+/)
        .filter((s) => s.length > 0)
        .map(Number)
        .filter((n) => !isNaN(n));
      switch (cmd.toUpperCase()) {
        case 'M':
          if (nums.length >= 2) {
            if (cmd === 'M') {
              x = nums[0];
              y = nums[1];
            } else {
              x += nums[0];
              y += nums[1];
            }
            pts.push({ x, y });
            for (let i = 2; i + 1 < nums.length; i += 2) {
              if (cmd === 'M') {
                x = nums[i];
                y = nums[i + 1];
              } else {
                x += nums[i];
                y += nums[i + 1];
              }
              pts.push({ x, y });
            }
          }
          break;
        case 'L':
          for (let i = 0; i + 1 < nums.length; i += 2) {
            if (cmd === 'L') {
              x = nums[i];
              y = nums[i + 1];
            } else {
              x += nums[i];
              y += nums[i + 1];
            }
            pts.push({ x, y });
          }
          break;
        case 'H':
          nums.forEach((n) => {
            x = cmd === 'H' ? n : x + n;
            pts.push({ x, y });
          });
          break;
        case 'V':
          nums.forEach((n) => {
            y = cmd === 'V' ? n : y + n;
            pts.push({ x, y });
          });
          break;
      }
    }
    return pts;
  }

  private createPlanes() {
    const sizes = this.getSizes();
    const space = getElementSpace(this.el as unknown as HTMLElement, sizes.width, sizes.height);
    const color = parseCssColor(space.computedStyle.color, srgbColor(0.831, 0.314, 0.376));
    const geom = new THREE.PlaneGeometry(1, 1, 1, 1);
    const curve = new THREE.CatmullRomCurve3(this.pathPoints, false, 'catmullrom', 0.5);
    this.spacedPoints = curve.getSpacedPoints(this.planeCount - 1);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        opacity: { value: 1 },
      },
      vertexShader: TRAIL_VERTEX_SHADER,
      fragmentShader: TRAIL_FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.instancedMesh = new THREE.InstancedMesh(geom, mat, this.planeCount);
    const opacities = new Float32Array(this.planeCount);
    const reduced = prefersReducedMotion();
    const { width: pw, height: ph } = this.getPlaneSize();
    const scaleMat = new THREE.Matrix4().makeScale(pw, ph, 1);
    const transMat = new THREE.Matrix4();

    this.spacedPoints.forEach((pt, idx) => {
      transMat.makeTranslation(pt.x, pt.y, pt.z);
      transMat.multiply(scaleMat);
      this.instancedMesh!.setMatrixAt(idx, transMat);
      opacities[idx] = reduced ? 1 : 0;
    });

    this.instancedMesh.geometry.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(opacities, 1));
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedMesh);
  }

  private createTimelines() {
    if (!this.instancedMesh) return;
    const attr = this.instancedMesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute;
    const arr = attr.array as Float32Array;

    for (let i = 0; i < this.planeCount; i++) {
      this.timeline.to(
        arr,
        {
          [i]: 1,
          duration: 0,
          ease: 'power2.out',
          onUpdate: () => {
            attr.needsUpdate = true;
            this.onDirty?.();
          },
        },
        i * this.staggerDelay
      );
      this.exitTimeline.to(
        arr,
        {
          [this.planeCount - 1 - i]: 0,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: () => {
            attr.needsUpdate = true;
            this.onDirty?.();
          },
        },
        i * this.staggerDelay
      );
    }
  }

  updatePositions() {
    if (!this.instancedMesh) return;
    const path = this.el.querySelector('path');
    if (!path) return;
    this.parseSVGPath(path);
    if (this.pathPoints.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(this.pathPoints, false, 'catmullrom', 0.5);
    this.spacedPoints = curve.getSpacedPoints(this.planeCount - 1);
    const { width: pw, height: ph } = this.getPlaneSize();
    const scaleMat = new THREE.Matrix4().makeScale(pw, ph, 1);
    const transMat = new THREE.Matrix4();
    this.spacedPoints.forEach((pt, idx) => {
      transMat.makeTranslation(pt.x, pt.y, pt.z);
      transMat.multiply(scaleMat);
      this.instancedMesh!.setMatrixAt(idx, transMat);
    });
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.onDirty?.();
  }

  destroy() {
    this.timeline.kill();
    this.exitTimeline.kill();
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
      this.instancedMesh = null;
    }
  }
}

export interface WebGLExperienceAPI {
  fgScene: THREE.Scene;
  bgScene: THREE.Scene;
  createImage: (el: HTMLImageElement | HTMLVideoElement, options?: WebGLImageOptions) => WebGLImage;
  createTrail: (el: SVGSVGElement, options?: WebGLTrailOptions) => WebGLTrail;
  createGroup: () => THREE.Group;
  relayout: () => void;
  rebuildPageTargets: () => void;
  reattachCanvases: () => void;
  notifyHeroTransitionStart: () => void;
  notifyHeroEntranceComplete: () => void;
  warmupGPU: () => Promise<void>;
  suspend: () => void;
  resume: () => void;
  isContextLost: () => boolean;
}

let experienceInstance: WebGLExperienceAPI | null = null;

function createRendererForCanvas(canvas: HTMLCanvasElement): THREE.WebGLRenderer | null {
  const attrs: WebGLContextAttributes = { antialias: true, stencil: false, alpha: true };
  const context =
    (canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null) ||
    (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null);
  if (!context || context.isContextLost()) return null;
  return new THREE.WebGLRenderer({ canvas, context, antialias: true, stencil: false, alpha: true });
}

export function createExperience(): WebGLExperienceAPI | null {
  if (experienceInstance) return experienceInstance;
  if (!canUseDistortion()) return null;

  const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas.webgl');
  if (canvases.length < 2) return null;

  let fgCanvas = canvases[0];
  let bgCanvas = canvases[1];

  const bgRendererInit = createRendererForCanvas(bgCanvas);
  const fgRendererInit = bgRendererInit ? createRendererForCanvas(fgCanvas) : null;
  if (!bgRendererInit || !fgRendererInit) {
    bgRendererInit?.dispose();
    (window as any).hasWebGL = false;
    gsap.set('.webgl-background', { opacity: 1, visibility: 'visible' });
    return null;
  }

  let bgRenderer: THREE.WebGLRenderer = bgRendererInit;
  let fgRenderer: THREE.WebGLRenderer = fgRendererInit;
  (window as any).hasWebGL = true;
  (window as any).threeJSReady = true;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let aspect = width / Math.max(1, height);
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let suspended = false;
  let fgContextLost = false;
  let bgContextLost = false;
  let dirtyFrames = 3;
  let waveActiveUntilElapsed = -1;
  let lastRenderedScrollY = Number.NaN;
  let resizeRafId = 0;
  let dprMedia: MediaQueryList | null = null;

  const configureRenderer = (r: THREE.WebGLRenderer) => {
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setPixelRatio(pixelRatio);
    r.setSize(width, height);
  };
  configureRenderer(bgRenderer);
  configureRenderer(fgRenderer);

  const bgScene = new THREE.Scene();
  const fgScene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);
  camera.position.set(0, 0, 2);

  const touchScene = new THREE.Scene();
  const touchCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);
  touchCamera.position.set(0, 0, 1);
  touchScene.add(touchCamera);

  let bgTouchTarget = new THREE.WebGLRenderTarget(50, Math.max(1, Math.round(50 * aspect)));
  let fgTouchTarget = new THREE.WebGLRenderTarget(50, Math.max(1, Math.round(50 * aspect)));
  const waveMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  const maxWaves = 150;
  let currentWave = 0;
  const mouse = new THREE.Vector2(0, 0);
  const startTime = Date.now();
  const waveGeom = new THREE.PlaneGeometry(1, 1, 1, 1);

  const markDirty = (frames = 2) => {
    dirtyFrames = Math.max(dirtyFrames, frames);
  };

  const ensureWaveMeshesPromise = preloadSquareStampTexture().then((squareTex) => {
    if (!squareTex || waveMeshes.length) return;
    for (let i = 0; i < maxWaves; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: TOUCH_VERTEX_SHADER,
        fragmentShader: TOUCH_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uBirthTime: { value: -999 },
          uBirthScroll: { value: 0 },
          uCurrentScroll: { value: 0 },
          uDuration: { value: 0.7 },
          uTexture: { value: squareTex },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(waveGeom, mat);
      mesh.scale.set(125, 125, 1);
      touchScene.add(mesh);
      waveMeshes.push(mesh);
    }
    markDirty();
  });

  const onMouseMove = (e: MouseEvent) => {
    if (suspended || fgContextLost || !waveMeshes.length || !canUseDistortion()) return;
    const mx = e.clientX - width / 2;
    const my = -e.clientY + height / 2;
    const dx = mx - mouse.x;
    const dy = my - mouse.y;
    if (dx * dx + dy * dy >= 1) {
      mouse.set(mx, my);
      const mesh = waveMeshes[currentWave];
      currentWave = (currentWave + 1) % maxWaves;
      const now = (Date.now() - startTime) / 1000;
      const scrollY = getLenis()?.scroll ?? window.scrollY;
      mesh.position.set(mx, my, 0);
      mesh.material.uniforms.uBirthTime.value = now;
      mesh.material.uniforms.uBirthScroll.value = scrollY;
      mesh.material.uniforms.uCurrentScroll.value = scrollY;
      waveActiveUntilElapsed = Math.max(waveActiveUntilElapsed, now + 0.8);
      markDirty();
    }
  };
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  const sharedUniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(width, height) },
    uScrollY: { value: 0 },
    uMouseTexture: { value: fgTouchTarget.texture },
    uPixelSize: { value: 25 },
    uTrailColor: { value: srgbColor(0.976, 0.924, 0.852) },
    uTrailOpacity: { value: 0 },
    uTrailThreshold: { value: 0.25 },
    uTrailBrightness: { value: 1.2 },
    uClipY: { value: -1 },
  };

  const fgImages = new Set<WebGLImage>();
  const imageRegistry = new WeakMap<HTMLElement, WebGLImage>();
  const getSizes = () => ({ width, height });

  const createImage = (el: HTMLImageElement | HTMLVideoElement, options: WebGLImageOptions = {}) => {
    const existing = imageRegistry.get(el);
    if (existing && !existing.isDestroyed) {
      if ((existing.options.group ?? null) === (options.group ?? null)) {
        existing.resize();
        return existing;
      }
      existing.destroy();
    }
    const img = new WebGLImage(
      el,
      fgScene,
      getSizes,
      sharedUniforms,
      {
        getRenderer: () => fgRenderer,
        getCamera: () => camera,
        isContextLost: () => fgContextLost || suspended,
        onDirty: () => markDirty(),
        onDisposed: (target) => {
          fgImages.delete(target);
          if (imageRegistry.get(el) === target) imageRegistry.delete(el);
        },
      },
      options
    );
    fgImages.add(img);
    imageRegistry.set(el, img);
    return img;
  };

  const sharedPlane = new THREE.PlaneGeometry(1, 1, 1, 1);
  const bgItems: { el: HTMLElement; mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> }[] = [];
  const allTrails: WebGLTrail[] = [];
  const heroTrails: WebGLTrail[] = [];
  let heroTrailLoopTl: gsap.core.Timeline | null = null;
  let heroEntranceTrailTl: gsap.core.Timeline | null = null;
  let heroEntranceFlareFired = false;
  let contactTrailTween: gsap.core.Tween | null = null;
  let footerEl = document.querySelector<HTMLElement>('.structure-footer');

  const appendTrailPulse = (tl: gsap.core.Timeline, tr: WebGLTrail, startPos: gsap.Position) =>
    tl
      .set(tr.timeline, { progress: 0 }, startPos)
      .to(tr.timeline, { progress: 1, duration: 1, ease: 'linear' })
      .set(tr.exitTimeline, { progress: 0 }, '>+2')
      .to(tr.exitTimeline, { progress: 1, duration: 1, ease: 'linear' });

  const fireHomeEntranceFlare = () => {
    if (heroEntranceFlareFired || !heroTrails.length || prefersReducedMotion()) return;
    const tr = heroTrails[0];
    if (!tr) return;
    heroEntranceFlareFired = true;
    heroEntranceTrailTl?.kill();
    const tl = gsap.timeline({
      onComplete: () => {
        heroEntranceTrailTl = null;
      },
    });
    appendTrailPulse(tl, tr, 0);
    heroEntranceTrailTl = tl;
    markDirty();
  };
  bus.on('hero-transition-start', fireHomeEntranceFlare);

  const startHeroTrailLoop = (immediateFirst = false) => {
    heroTrailLoopTl?.kill();
    heroTrailLoopTl = null;
    if (!heroTrails.length || prefersReducedMotion()) return;
    const heroTop = document.querySelector<HTMLElement>('.sections-hero .hero-top');
    const loopTl = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        if (heroTrails[0] && !heroEntranceTrailTl?.isActive()) {
          gsap.set(heroTrails[0].timeline, { progress: -0.1 });
        }
      },
      scrollTrigger: heroTop
        ? {
            trigger: heroTop,
            start: 'top bottom',
            end: 'bottom end',
            toggleActions: 'restart pause restart pause',
          }
        : undefined,
    });
    const ordered = [...heroTrails.slice(1), heroTrails[0]];
    if (heroTrails[0] && !heroEntranceTrailTl?.isActive()) {
      gsap.set(heroTrails[0].timeline, { progress: -0.1 });
    }
    ordered.forEach((tr, idx) => {
      if (!tr) return;
      const delayPos = idx === 0 && immediateFirst && !heroEntranceFlareFired ? 0 : '>+3';
      appendTrailPulse(loopTl, tr, delayPos);
    });
    heroTrailLoopTl = loopTl;
    markDirty();
  };
  bus.on('hero-entrance-complete', () => startHeroTrailLoop());

  const scanPageTargets = () => {
    document.querySelectorAll<HTMLElement>('.webgl-background').forEach((el) => {
      const space = getElementSpace(el, width, height);
      const bgColor = parseCssColor(space.computedStyle.backgroundColor, srgbColor(0.502, 0.0, 0.125));
      const trailAttr = el.getAttribute('data-trail');
      let trailColor = trailAttr
        ? parseCssColor(trailAttr, srgbColor(0.976, 0.924, 0.852))
        : srgbColor(0.976, 0.924, 0.852);
      if (el.closest('.sections-contactForm')) {
        trailColor = srgbColor(0.831, 0.314, 0.376);
      }

      const mat = new THREE.ShaderMaterial({
        vertexShader: BG_VERTEX_SHADER,
        fragmentShader: BG_FRAGMENT_SHADER,
        uniforms: {
          uResolution: { value: new THREE.Vector2(width, height) },
          uMouseTexture: { value: bgTouchTarget.texture },
          uPlaneAspect: { value: new THREE.Vector2(width, height) },
          uPixelSize: { value: 25 },
          uTrailThreshold: { value: 0.25 },
          uTrailBrightness: { value: 1.2 },
          uTrailColor: { value: trailColor },
          uScrollY: { value: getLenis()?.scroll ?? window.scrollY },
          uColor: { value: bgColor },
          uBorderRadius: {
            value: new THREE.Vector4(
              space.borderRadius.topLeft,
              space.borderRadius.topRight,
              space.borderRadius.bottomRight,
              space.borderRadius.bottomLeft
            ),
          },
        },
      });

      const mesh = new THREE.Mesh(sharedPlane, mat);
      mesh.position.set(space.x, space.y, -1);
      mesh.scale.set(space.width, space.height, 1);
      bgScene.add(mesh);
      bgItems.push({ el, mesh });
    });

    document.querySelectorAll<SVGSVGElement>('.sections-hero svg.webgl-trail').forEach((svg) => {
      const t = new WebGLTrail(svg, bgScene, getSizes, () => markDirty());
      allTrails.push(t);
      heroTrails.push(t);
    });

    const contactTrailSvg = document.querySelector<SVGSVGElement>('.sections-contactForm svg.webgl-trail');
    if (contactTrailSvg) {
      const ct = new WebGLTrail(contactTrailSvg, fgScene, getSizes, () => markDirty());
      allTrails.push(ct);
      if (!prefersReducedMotion()) {
        contactTrailTween = gsap.to(ct.timeline, {
          progress: 1,
          duration: 1,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: '.sections-contactForm',
            start: 'top center',
          },
        });
      }
    }

    footerEl = document.querySelector<HTMLElement>('.structure-footer');
    markDirty();
  };

  const rebuildPageTargets = () => {
    heroEntranceTrailTl?.kill();
    heroEntranceTrailTl = null;
    heroEntranceFlareFired = false;
    heroTrailLoopTl?.scrollTrigger?.kill();
    heroTrailLoopTl?.kill();
    heroTrailLoopTl = null;
    contactTrailTween?.scrollTrigger?.kill();
    contactTrailTween?.kill();
    contactTrailTween = null;

    bgItems.forEach(({ mesh }) => {
      bgScene.remove(mesh);
      mesh.material.dispose();
    });
    bgItems.length = 0;

    allTrails.forEach((tr) => tr.destroy());
    allTrails.length = 0;
    heroTrails.length = 0;

    [...fgImages].forEach((img) => img.destroy());
    fgImages.clear();

    for (let i = fgScene.children.length - 1; i >= 0; i--) {
      const child = fgScene.children[i];
      if (child !== camera) {
        fgScene.remove(child);
      }
    }

    scanPageTargets();
    relayout();
  };

  const updateFooterClip = () => {
    if (!footerEl) return;
    const rect = footerEl.getBoundingClientRect();
    sharedUniforms.uClipY.value = (height - rect.top) * fgRenderer.getPixelRatio();
  };

  const relayout = () => {
    const scrollY = getLenis()?.scroll ?? window.scrollY;
    sharedUniforms.uResolution.value.set(width, height);
    sharedUniforms.uScrollY.value = scrollY;
    bgItems.forEach(({ el, mesh }) => {
      const s = getElementSpace(el, width, height);
      mesh.position.set(s.x, s.y, -1);
      mesh.scale.set(s.width, s.height, 1);
      mesh.material.uniforms.uResolution.value.set(width, height);
      mesh.material.uniforms.uPlaneAspect.value.set(width, height);
      mesh.material.uniforms.uScrollY.value = scrollY;
    });
    fgImages.forEach((img) => {
      if (!img.isDestroyed) img.resize();
    });
    allTrails.forEach((tr) => tr.updatePositions());
    updateFooterClip();
    markDirty();
  };

  const applyViewportAndDpr = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width / Math.max(1, height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();

    touchCamera.left = -width / 2;
    touchCamera.right = width / 2;
    touchCamera.top = height / 2;
    touchCamera.bottom = -height / 2;
    touchCamera.updateProjectionMatrix();

    configureRenderer(bgRenderer);
    configureRenderer(fgRenderer);
    bgTouchTarget.setSize(50, Math.max(1, Math.round(50 * aspect)));
    fgTouchTarget.setSize(50, Math.max(1, Math.round(50 * aspect)));

    relayout();
  };

  const scheduleResize = () => {
    if (resizeRafId) cancelAnimationFrame(resizeRafId);
    resizeRafId = requestAnimationFrame(() => {
      resizeRafId = 0;
      applyViewportAndDpr();
    });
  };

  const armDprWatcher = () => {
    if (dprMedia) {
      dprMedia.removeEventListener('change', onDprChange);
      dprMedia = null;
    }
    if (typeof window.matchMedia !== 'function') return;
    dprMedia = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    dprMedia.addEventListener('change', onDprChange);
  };
  const onDprChange = () => {
    armDprWatcher();
    scheduleResize();
  };
  armDprWatcher();

  window.addEventListener('resize', scheduleResize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) markDirty(3);
  });

  if (typeof ResizeObserver !== 'undefined' && document.body) {
    let lastLayoutHeight = document.body.offsetHeight;
    let layoutRaf = 0;
    const layoutObserver = new ResizeObserver(() => {
      const h = document.body.offsetHeight;
      if (h !== lastLayoutHeight) {
        lastLayoutHeight = h;
        if (layoutRaf) cancelAnimationFrame(layoutRaf);
        layoutRaf = requestAnimationFrame(() => {
          layoutRaf = 0;
          relayout();
        });
      }
    });
    layoutObserver.observe(document.body);
  }

  ScrollTrigger.addEventListener('refresh', () => relayout());
  bus.on('hero-entrance-complete', () => relayout());

  const bindCanvasContextListeners = (canvas: HTMLCanvasElement, kind: 'fg' | 'bg') => {
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (kind === 'fg') fgContextLost = true;
      else bgContextLost = true;
      (window as any).hasWebGL = false;
      gsap.set('.webgl-background', { opacity: 1, visibility: 'visible' });
      fgImages.forEach((img) => img.activateFallback());
    });

    canvas.addEventListener('webglcontextrestored', async () => {
      if (kind === 'fg') {
        fgContextLost = false;
        fgTouchTarget.dispose();
        fgTouchTarget = new THREE.WebGLRenderTarget(50, Math.max(1, Math.round(50 * aspect)));
        sharedUniforms.uMouseTexture.value = fgTouchTarget.texture;
      } else {
        bgContextLost = false;
        bgTouchTarget.dispose();
        bgTouchTarget = new THREE.WebGLRenderTarget(50, Math.max(1, Math.round(50 * aspect)));
        bgItems.forEach(({ mesh }) => {
          mesh.material.uniforms.uMouseTexture.value = bgTouchTarget.texture;
          mesh.material.needsUpdate = true;
        });
      }
      await markCachedTexturesDirtyForRestore();
      const markObjDirty = (obj: THREE.Object3D) => {
        const m = (obj as THREE.Mesh).material;
        if (Array.isArray(m)) m.forEach((mat) => { mat.needsUpdate = true; });
        else if (m) m.needsUpdate = true;
        const g = (obj as THREE.Mesh).geometry;
        if (g) {
          Object.values(g.attributes).forEach((attr) => {
            attr.needsUpdate = true;
          });
        }
      };
      fgScene.traverse(markObjDirty);
      bgScene.traverse(markObjDirty);
      touchScene.traverse(markObjDirty);
      allTrails.forEach((tr) => tr.updatePositions());
      if (!fgContextLost && !bgContextLost) {
        (window as any).hasWebGL = true;
        gsap.set('.webgl-background', { clearProps: 'opacity,visibility' });
        fgImages.forEach((img) => img.restoreAfterContextLost());
      }
      applyViewportAndDpr();
      markDirty(4);
    });
  };
  bindCanvasContextListeners(fgCanvas, 'fg');
  bindCanvasContextListeners(bgCanvas, 'bg');

  scanPageTargets();

  gsap.ticker.add(() => {
    if (document.hidden || suspended) return;
    const scrollY = getLenis()?.scroll ?? window.scrollY;
    const elapsed = (Date.now() - startTime) / 1000;

    const scrollChanged = scrollY !== lastRenderedScrollY;
    if (scrollChanged) lastRenderedScrollY = scrollY;

    const wavesActive = elapsed <= waveActiveUntilElapsed;
    const trailsAnimating = Boolean(
      heroTrailLoopTl?.isActive() ||
        heroEntranceTrailTl?.isActive() ||
        contactTrailTween?.isActive()
    );

    if (dirtyFrames <= 0 && !scrollChanged && !wavesActive && !trailsAnimating) {
      return;
    }
    if (dirtyFrames > 0) dirtyFrames--;

    camera.position.y = -scrollY;
    camera.updateProjectionMatrix();

    sharedUniforms.uTime.value = elapsed * 1000;
    sharedUniforms.uScrollY.value = scrollY;
    sharedUniforms.uMouseTexture.value = fgTouchTarget.texture;
    updateFooterClip();

    if (wavesActive) {
      for (let i = 0; i < waveMeshes.length; i++) {
        const u = waveMeshes[i].material.uniforms;
        u.uTime.value = elapsed;
        u.uCurrentScroll.value = scrollY;
      }
    }

    for (let i = 0; i < bgItems.length; i++) {
      bgItems[i].mesh.material.uniforms.uScrollY.value = scrollY;
    }

    if (!bgContextLost && (bgItems.length > 0 || heroTrails.length > 0)) {
      bgRenderer.setRenderTarget(bgTouchTarget);
      bgRenderer.render(touchScene, touchCamera);
      bgRenderer.setRenderTarget(null);
      bgRenderer.clear();
      bgRenderer.render(bgScene, camera);
    }

    if (!fgContextLost) {
      fgRenderer.setRenderTarget(fgTouchTarget);
      fgRenderer.render(touchScene, touchCamera);
      fgRenderer.setRenderTarget(null);
      fgRenderer.clear();
      if (fgImages.size > 0 || allTrails.length > heroTrails.length) {
        fgRenderer.render(fgScene, camera);
      }
    }
  });

  const createTrail = (el: SVGSVGElement, options: WebGLTrailOptions = {}) => {
    const tr = new WebGLTrail(el, fgScene, getSizes, () => markDirty(), options);
    allTrails.push(tr);
    markDirty();
    return tr;
  };

  const reattachCanvases = () => {
    const next = document.querySelectorAll<HTMLCanvasElement>('canvas.webgl');
    if (next.length < 2) return;
    const nextFg = next[0];
    const nextBg = next[1];
    if (nextFg === fgCanvas && nextBg === bgCanvas) return;

    let newBg: THREE.WebGLRenderer;
    let newFg: THREE.WebGLRenderer;
    try {
      newBg = new THREE.WebGLRenderer({ canvas: nextBg, antialias: true, stencil: false, alpha: true });
      newFg = new THREE.WebGLRenderer({ canvas: nextFg, antialias: true, stencil: false, alpha: true });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Decbricks: WebGL renderer re-attach failed:', err);
      return;
    }

    bgRenderer.dispose();
    bgRenderer.forceContextLoss();
    fgRenderer.dispose();
    fgRenderer.forceContextLoss();

    fgCanvas = nextFg;
    bgCanvas = nextBg;
    bgRenderer = newBg;
    fgRenderer = newFg;
    bindCanvasContextListeners(fgCanvas, 'fg');
    bindCanvasContextListeners(bgCanvas, 'bg');
    configureRenderer(bgRenderer);
    configureRenderer(fgRenderer);
    markDirty(3);
  };

  const warmupGPU = async () => {
    if (suspended || fgContextLost || bgContextLost || !canUseDistortion()) return;
    await ensureWaveMeshesPromise;
    try {
      if (!fgContextLost) {
        fgRenderer.compile(fgScene, camera);
        if (waveMeshes.length) {
          fgRenderer.setRenderTarget(fgTouchTarget);
          fgRenderer.render(touchScene, touchCamera);
          fgRenderer.setRenderTarget(null);
        }
      }
      if (!bgContextLost && (bgItems.length || heroTrails.length)) {
        bgRenderer.compile(bgScene, camera);
        bgRenderer.setRenderTarget(bgTouchTarget);
        bgRenderer.render(touchScene, touchCamera);
        bgRenderer.setRenderTarget(null);
      }
      markDirty(2);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[WebGL] GPU warmup skipped:', err);
      }
    }
  };

  const suspend = () => {
    if (suspended) return;
    suspended = true;
    (window as any).hasWebGL = false;
    fgRenderer.clear();
    bgRenderer.clear();
    gsap.set('.webgl-background', { opacity: 1, visibility: 'visible' });
    fgImages.forEach((img) => img.activateFallback());
  };

  const resume = () => {
    if (!suspended || !canUseDistortion()) return;
    suspended = false;
    if (!fgContextLost && !bgContextLost) {
      (window as any).hasWebGL = true;
      gsap.set('.webgl-background', { clearProps: 'opacity,visibility' });
      fgImages.forEach((img) => img.restoreAfterContextLost());
    }
    applyViewportAndDpr();
    markDirty(4);
  };

  experienceInstance = {
    fgScene,
    bgScene,
    createImage,
    createTrail,
    createGroup: () => new THREE.Group(),
    relayout,
    rebuildPageTargets,
    reattachCanvases,
    notifyHeroTransitionStart: fireHomeEntranceFlare,
    notifyHeroEntranceComplete: () => startHeroTrailLoop(true),
    warmupGPU,
    suspend,
    resume,
    isContextLost: () => fgContextLost || bgContextLost || suspended,
  };
  (window as any).__webglExp = experienceInstance;
  return experienceInstance;
}
