"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ImageIcon } from "lucide-react";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
  type Announcement,
} from "../../lib/supabase/client";

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function PublicUpdates() {
  const configured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );
  const [updates, setUpdates] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(configured);
  const [failed, setFailed] = useState(false);

  const loadUpdates = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFailed(false);
    const { data, error } = await supabase
      .from("announcements")
      .select(
        "id,title,body,target_audience,is_pinned,is_urgent,publish_at,image_path,image_alt",
      )
      .eq("target_audience", "public")
      .order("is_pinned", { ascending: false })
      .order("publish_at", { ascending: false })
      .limit(6);

    setLoading(false);
    if (error) {
      setFailed(true);
      return;
    }

    setUpdates((data ?? []) as Announcement[]);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUpdates();
  }, [loadUpdates]);

  if (loading) {
    return <p className="updates-empty" role="status">Loading APEC updates...</p>;
  }

  if (failed) {
    return (
      <div className="updates-empty updates-load-error" role="alert">
        <p>Public updates could not be loaded.</p>
        <button type="button" onClick={() => void loadUpdates()}>Try again</button>
      </div>
    );
  }

  if (!updates.length) {
    return <p className="updates-empty">No public updates have been published yet.</p>;
  }

  return (
    <div className="updates-grid">
      {updates.map((update) => {
        const imageUrl = update.image_path
          ? supabase?.storage.from("apec-public-post-images").getPublicUrl(update.image_path).data.publicUrl
          : null;

        return (
          <article className="update-card" key={update.id}>
            {imageUrl ? (
              // Public Supabase image URLs are generated at runtime.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="update-card-image"
                src={imageUrl}
                alt={update.image_alt || update.title}
              />
            ) : (
              <div className="update-card-image-placeholder" aria-hidden="true">
                <ImageIcon />
              </div>
            )}
            <div className="update-card-copy">
              <div className="update-card-meta">
                <span><CalendarDays aria-hidden="true" /> {formatPublishedDate(update.publish_at)}</span>
                {update.is_pinned ? <strong>Featured</strong> : null}
              </div>
              <h3>{update.title}</h3>
              <p>{update.body}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
