/**
 * The storyteller at the top of the Archive: their face, who they are, and
 * the three numbers that say how far the archive has come.
 */
import { Avatar } from "../ui";
import { usePhotoUrl } from "../../lib/photoUrls";
import { storySubtitle } from "../../app-core/lib/social.js";
import { archiveStats } from "../../app-core/lib/timeline.js";
import type { Story } from "../../data/stories";

type Stats = { memories: number; dated: number; undated: number; years: number[]; span: { from: number; to: number } | null; chapters: number };

export default function ProfileCard({ story }: { story: Story }) {
  const photo = usePhotoUrl(story.photo);
  const stats = archiveStats(story) as Stats;
  const fullName = `${story.name} ${story.lastName}`.trim();
  const years = stats.span ? (stats.span.from === stats.span.to ? String(stats.span.from) : `${stats.span.from}–${stats.span.to}`) : "—";
  return (
    <section className="card arc-profile" aria-label="Storyteller" data-arrive>
      <Avatar src={photo} name={story.name} size={96} />
      <div>
        <h2>{fullName}</h2>
        <p className="meta">{storySubtitle(story) as string}</p>
      </div>
      <dl className="arc-stats">
        <div>
          <b>{stats.memories}</b>
          <span>{stats.memories === 1 ? "Memory" : "Memories"}</span>
        </div>
        <div>
          <b>{years}</b>
          <span>Years covered</span>
        </div>
        <div>
          <b>{stats.chapters}</b>
          <span>{stats.chapters === 1 ? "Chapter" : "Chapters"}</span>
        </div>
      </dl>
    </section>
  );
}
