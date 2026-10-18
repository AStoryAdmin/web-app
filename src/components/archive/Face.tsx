/** A person in a memory as a face: their photograph when they have one, else the monogram seal (the shared Avatar). */
import { Avatar } from "../ui";
import { usePhotoUrl } from "../../lib/photoUrls";
import type { Person } from "../../data/family";

export default function Face({ person, size = 24 }: { person: Person; size?: number }) {
  const src = usePhotoUrl(person.photo);
  return <Avatar src={src} name={person.givenName || person.familyName || "?"} size={size} />;
}
