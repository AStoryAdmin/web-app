// Recognising a stored photo that lives in a private bucket.
//
// Memories keep their photos as the URL Storage handed back when the photo
// was uploaded: https://<project>/storage/v1/object/public/memory-photos/
// <story>/<memory>/<uuid>.jpg. Those strings are the photo's identity: they
// are in memory_photos.public_url and memories.cover_url, the save diff
// compares them, and the public share page returns them. So they stay as
// they are, and the bucket's path is read back out of them whenever a photo
// has to be shown, then signed. Kept free of lib/supabase so it can be tested
// without a network.

// family-photos: the faces on the family tree (supabase/family_photos.sql).
export const PRIVATE_PHOTO_BUCKETS = ["memory-photos", "family-photos"];

const STORAGE_OBJECT_RE =
  /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?#]+)\/([^?#]+)/;

// { bucket, path } for a URL into one of the private photo buckets, or null
// for anything else: a local file, a data: URI, a demo picture, an avatar,
// or a contribution photo (that bucket is still public).
export function privatePhotoRef(url) {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return null;
  const match = STORAGE_OBJECT_RE.exec(url);
  if (!match) return null;
  const bucket = match[1];
  if (!PRIVATE_PHOTO_BUCKETS.includes(bucket)) return null;
  let path;
  try {
    path = decodeURIComponent(match[2]);
  } catch {
    return null;
  }
  return path ? { bucket, path } : null;
}
