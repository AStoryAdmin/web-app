/**
 * Showing a family's photographs without making them public.
 *
 * memory-photos and family-photos are private buckets: a photo is only
 * readable through a signed URL, minted by someone the Storage policy lets
 * read the story. What a memory stores is unchanged (the object URL,
 * photoRefs.js); this is where that becomes something an <img> can load.
 *
 * Signed URLs are cached until shortly before they expire, and requests
 * made in the same tick are signed together, one call per bucket (a list of
 * cards would otherwise mint one URL per photo per render). Ported from the
 * app's src/lib/photoUrls.js.
 */
import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { privatePhotoRef } from "../app-core/lib/photoRefs.js";

const SIGN_TTL_SECONDS = 60 * 60;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

const cache = new Map<string, { url: string; expiresAt: number }>();
type Resolver = (url: string | null) => void;
let pending: Map<string, Map<string, Resolver[]>> | null = null;

function cached(key: string): string | null {
  const hit = cache.get(key);
  return hit && hit.expiresAt - REFRESH_MARGIN_MS > Date.now() ? hit.url : null;
}

async function flush(batch: Map<string, Map<string, Resolver[]>>) {
  const sb = getSupabase();
  for (const [bucket, waiting] of batch) {
    const paths = [...waiting.keys()];
    let results: { path: string | null; signedUrl: string | null; error: string | null }[] = [];
    try {
      if (!sb) throw new Error("not connected");
      const { data, error } = await sb.storage.from(bucket).createSignedUrls(paths, SIGN_TTL_SECONDS);
      if (error) throw error;
      results = data || [];
    } catch (err) {
      console.warn("sign photos:", (err as Error)?.message || err);
    }
    const expiresAt = Date.now() + SIGN_TTL_SECONDS * 1000;
    const byPath = new Map<string | null, string>();
    for (const r of results) if (r && !r.error && r.signedUrl) byPath.set(r.path, r.signedUrl);
    for (const [path, resolvers] of waiting) {
      const url = byPath.get(path) || null;
      if (url) cache.set(`${bucket}/${path}`, { url, expiresAt });
      resolvers.forEach((resolve) => resolve(url));
    }
  }
}

function requestSigned(bucket: string, path: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!pending) {
      pending = new Map();
      const batch = pending;
      setTimeout(() => {
        pending = null;
        void flush(batch);
      }, 0);
    }
    if (!pending.has(bucket)) pending.set(bucket, new Map());
    const waiting = pending.get(bucket)!;
    if (!waiting.has(path)) waiting.set(path, []);
    waiting.get(path)!.push(resolve);
  });
}

/**
 * A smaller rendition for a small frame: Supabase's image transform (`/render/image/sign/…?width=`), signed one photo
 * at a time because the batch call cannot carry a transform. A print 170–490px wide asks for 600px and a List thumbnail
 * for 400px, instead of the 1100–1200px original (measured on the founder's photographs: 600px is 15–33% fewer bytes
 * and 400px about half; 800px is no smaller than the original, so a large print keeps the original). If the transform
 * cannot be signed, the original is used.
 */
async function requestRendition(bucket: string, path: string, width: number): Promise<string | null> {
  const key = `${bucket}/${path}@${width}`;
  const hit = cached(key);
  if (hit) return hit;
  const sb = getSupabase();
  try {
    if (!sb) throw new Error("not connected");
    const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, SIGN_TTL_SECONDS, { transform: { width } });
    if (error || !data?.signedUrl) throw error || new Error("no url");
    cache.set(key, { url: data.signedUrl, expiresAt: Date.now() + SIGN_TTL_SECONDS * 1000 });
    return data.signedUrl;
  } catch (err) {
    console.warn("sign a smaller photo:", (err as Error)?.message || err);
    return cached(`${bucket}/${path}`) ?? requestSigned(bucket, path);
  }
}

/** A URL that loads right now, or null if it still has to be signed. */
export function photoUrlNow(url: string | null | undefined, width?: number): string | null {
  if (!url) return null;
  const ref = privatePhotoRef(url);
  if (!ref) return url; // a data: URI, a demo picture, a public bucket
  return cached(`${ref.bucket}/${ref.path}${width ? `@${width}` : ""}`);
}

/** A URL that loads, signing it if it must; with `width`, a rendition about that wide. */
export async function photoUrl(url: string | null | undefined, width?: number): Promise<string | null> {
  if (!url) return null;
  const ref = privatePhotoRef(url);
  if (!ref) return url;
  if (width) return requestRendition(ref.bucket, ref.path, width);
  return cached(`${ref.bucket}/${ref.path}`) ?? requestSigned(ref.bucket, ref.path);
}

/** The signed URL for one stored photo, for an <img>; null until it is ready. `width` asks for a smaller rendition. */
export function usePhotoUrl(url: string | null | undefined, width?: number): string | null {
  const [signed, setSigned] = useState<string | null>(() => photoUrlNow(url, width));
  useEffect(() => {
    let live = true;
    const now = photoUrlNow(url, width);
    if (now) {
      // Already known: no round trip, but keep the state in step with a new url.
      queueMicrotask(() => live && setSigned(now));
      return () => {
        live = false;
      };
    }
    photoUrl(url, width).then((u) => live && setSigned(u));
    return () => {
      live = false;
    };
  }, [url, width]);
  return signed;
}
