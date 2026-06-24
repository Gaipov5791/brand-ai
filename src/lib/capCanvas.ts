/**
 * Procedural CAD wireframe cap renderer.
 * Future-ready: pass a preloaded image array to swap for a photo sequence.
 */

export interface CapRenderState {
  opacity: number;
  scale: number;
  rotationY: number;
  rotationX: number;
  /** 0–1 neon underbrim fill — active from 75% scroll */
  underbrimReveal: number;
}

export interface CanvasSurface {
  ctx: CanvasRenderingContext2D;
  logicalWidth: number;
  logicalHeight: number;
  dpr: number;
}

type Vec3 = { x: number; y: number; z: number };
type Vec2 = { x: number; y: number };

const BG = "#050505";
const NEON_ORANGE = "#FF5A00";
const WIRE = "rgba(255, 255, 255, 0.12)";
const LINE = 0.5;

const CROWN_SEGMENTS = 8;
const CROWN_RINGS = 3;
const BRIM_SEGMENTS = 14;

/** ~1.65× larger than the first wireframe pass — fills ~55% of viewport height */
const SIZE_FACTOR = 0.58;

function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

export function syncCanvasSurface(
  canvas: HTMLCanvasElement,
  cached?: CanvasSurface | null,
): CanvasSurface | null {
  const parent = canvas.parentElement;
  if (!parent) return null;

  const dpr = getDevicePixelRatio();
  const logicalWidth = parent.clientWidth;
  const logicalHeight = parent.clientHeight;
  if (logicalWidth <= 0 || logicalHeight <= 0) return null;

  const backingWidth = Math.round(logicalWidth * dpr);
  const backingHeight = Math.round(logicalHeight * dpr);

  const needsResize =
    !cached ||
    cached.dpr !== dpr ||
    canvas.width !== backingWidth ||
    canvas.height !== backingHeight ||
    cached.logicalWidth !== logicalWidth ||
    cached.logicalHeight !== logicalHeight;

  if (needsResize) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, logicalWidth, logicalHeight, dpr };
}

export function clearCanvasBuffer(ctx: CanvasRenderingContext2D, dpr: number) {
  const { width, height } = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function rotateX(p: Vec3, rad: number): Vec3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function rotateY(p: Vec3, rad: number): Vec3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function transformPoint(p: Vec3, rotX: number, rotY: number): Vec3 {
  return rotateX(rotateY(p, rotY), rotX);
}

function project(p: Vec3, cx: number, cy: number, focal: number): Vec2 {
  const scale = focal / (focal + p.z);
  return { x: cx + p.x * scale, y: cy + p.y * scale };
}

function strokeLine(
  ctx: CanvasRenderingContext2D,
  a: Vec2,
  b: Vec2,
  width = LINE,
) {
  ctx.strokeStyle = WIRE;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function buildCapGeometry(size: number) {
  const crownH = size * 0.5;
  const crownR = size * 0.42;
  const brimDepth = size * 0.54;

  const apex: Vec3 = { x: 0, y: -crownH, z: 0 };

  const baseRing: Vec3[] = [];
  for (let i = 0; i < CROWN_SEGMENTS; i++) {
    const t = (i / CROWN_SEGMENTS) * Math.PI * 2;
    baseRing.push({
      x: Math.sin(t) * crownR,
      y: 0,
      z: Math.cos(t) * crownR * 0.52,
    });
  }

  const crownRings: Vec3[][] = [];
  for (let r = 1; r <= CROWN_RINGS; r++) {
    const ring: Vec3[] = [];
    const h = -crownH + (crownH * r) / (CROWN_RINGS + 1);
    const radius = crownR * (r / (CROWN_RINGS + 1)) * 0.9;
    for (let i = 0; i < CROWN_SEGMENTS; i++) {
      const t = (i / CROWN_SEGMENTS) * Math.PI * 2;
      ring.push({
        x: Math.sin(t) * radius,
        y: h,
        z: Math.cos(t) * radius * 0.52,
      });
    }
    crownRings.push(ring);
  }

  const brimInner: Vec3[] = [];
  const brimOuter: Vec3[] = [];
  const brimUnder: Vec3[] = [];

  for (let i = 0; i <= BRIM_SEGMENTS; i++) {
    const t = Math.PI * 0.12 + (i / BRIM_SEGMENTS) * Math.PI * 0.76;
    const sx = Math.sin(t) * crownR * 0.9;
    const sz = Math.cos(t) * crownR * 0.4 + crownR * 0.14;

    brimInner.push({ x: sx, y: size * 0.018, z: sz });

    const spread = 0.58 + Math.cos(t) * 0.42;
    brimOuter.push({
      x: sx * spread * 1.08,
      y: size * 0.04,
      z: sz + brimDepth * (0.52 + Math.cos(t) * 0.48),
    });

    brimUnder.push({
      x: brimOuter[brimOuter.length - 1].x,
      y: size * 0.055,
      z: brimOuter[brimOuter.length - 1].z,
    });
  }

  return { apex, baseRing, crownRings, brimInner, brimOuter, brimUnder };
}

function drawUnderbrimFill(
  ctx: CanvasRenderingContext2D,
  brimIn: Vec2[],
  brimUnder: Vec2[],
  reveal: number,
) {
  if (reveal <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = reveal;
  ctx.fillStyle = NEON_ORANGE;
  ctx.beginPath();
  ctx.moveTo(brimUnder[0].x, brimUnder[0].y);
  for (let i = 1; i < brimUnder.length; i++) {
    ctx.lineTo(brimUnder[i].x, brimUnder[i].y);
  }
  for (let i = brimIn.length - 1; i >= 0; i--) {
    ctx.lineTo(brimIn[i].x, brimIn[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWireframeCap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: CapRenderState,
) {
  const cx = width / 2;
  const cy = height / 2;
  const size = Math.min(width, height) * SIZE_FACTOR * state.scale;
  const focal = size * 4.5;

  const rotY = (state.rotationY * Math.PI) / 180;
  const rotX = (state.rotationX * Math.PI) / 180;

  const geo = buildCapGeometry(size);
  const map = (p: Vec3): Vec2 =>
    project(transformPoint(p, rotX, rotY), cx, cy, focal);

  const apex = map(geo.apex);
  const base = geo.baseRing.map(map);
  const rings = geo.crownRings.map((ring) => ring.map(map));
  const brimIn = geo.brimInner.map(map);
  const brimOut = geo.brimOuter.map(map);
  const brimUnder = geo.brimUnder.map(map);

  ctx.save();
  ctx.globalAlpha = state.opacity;

  drawUnderbrimFill(ctx, brimIn, brimUnder, state.underbrimReveal);

  for (let i = 0; i < CROWN_SEGMENTS; i++) {
    strokeLine(ctx, apex, base[i]);
  }

  for (const ring of rings) {
    for (let i = 0; i < CROWN_SEGMENTS; i++) {
      const next = (i + 1) % CROWN_SEGMENTS;
      strokeLine(ctx, ring[i], ring[next], 0.5);
    }
  }

  for (let i = 0; i < CROWN_SEGMENTS; i++) {
    const next = (i + 1) % CROWN_SEGMENTS;
    strokeLine(ctx, base[i], base[next]);
  }

  for (let i = 0; i < brimIn.length - 1; i++) {
    strokeLine(ctx, brimIn[i], brimOut[i], 0.5);
    strokeLine(ctx, brimOut[i], brimOut[i + 1]);
    strokeLine(ctx, brimIn[i], brimIn[i + 1], 0.5);
  }

  for (let i = 2; i < brimIn.length - 2; i += 2) {
    const idx = Math.floor((i / (brimIn.length - 1)) * (CROWN_SEGMENTS - 1));
    strokeLine(ctx, base[idx], brimIn[i], 0.5);
  }

  const frontIdx = Math.floor(BRIM_SEGMENTS / 2);
  strokeLine(ctx, apex, brimOut[frontIdx], 0.75);

  ctx.restore();
}

export function renderCapFrame(surface: CanvasSurface, state: CapRenderState) {
  const { ctx, logicalWidth, logicalHeight, dpr } = surface;

  clearCanvasBuffer(ctx, dpr);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  drawWireframeCap(ctx, logicalWidth, logicalHeight, state);
}
