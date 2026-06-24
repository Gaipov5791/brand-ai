export const CAP_MODEL_LOCAL = "/models/hapebeast-cap-draco.glb";

/** Public CDN fallback when Vercel deployment protection blocks static assets */
export const CAP_MODEL_CDN =
  "https://raw.githubusercontent.com/Gaipov5791/brand-ai/master/public/models/hapebeast-cap-draco.glb";

export const DRACO_DECODER =
  "https://www.gstatic.com/draco/versioned/decoders/1.5.5/";

export function getCapModelUrl(): string {
  return process.env.NEXT_PUBLIC_CAP_MODEL_URL ?? CAP_MODEL_LOCAL;
}
