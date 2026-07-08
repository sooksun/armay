import { withAuth } from "@/lib/api/handler";

/**
 * Client-visible runtime config. The Google Maps key is a browser (referrer-
 * restricted) key, read from the server env at request time so it can be
 * changed without rebuilding the image. Returns null when unset.
 */
export const GET = withAuth("any", async () => ({
  mapsKey: process.env.GOOGLE_MAPS_API_KEY || null,
}));
