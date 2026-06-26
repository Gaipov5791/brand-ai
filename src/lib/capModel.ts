export const CAP_MODEL_LOCAL = "/models/hapebeast-cap-fast-normal.glb";

/** Public CDN fallback when Vercel deployment protection blocks static assets */
export const CAP_MODEL_CDN =
  "https://raw.githubusercontent.com/Gaipov5791/brand-ai/master/public/models/hapebeast-cap-fast-normal.glb";

export const KTX2_BASIS_PATH =
  "https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/";

export function getCapModelUrl(): string {
  return process.env.NEXT_PUBLIC_CAP_MODEL_URL ?? CAP_MODEL_LOCAL;
}
