"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
  type ResourceDocument,
} from "../../lib/supabase/client";

export function PolicyResources() {
  const configured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );
  const [resources, setResources] = useState<ResourceDocument[]>([]);
  const [loading, setLoading] = useState(configured);

  const loadResources = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("documents")
      .select("id,title,summary,document_type,storage_bucket,storage_path,access_level,created_at")
      .eq("document_type", "policy")
      .eq("access_level", "public")
      .order("created_at", { ascending: false });

    setResources((data ?? []) as ResourceDocument[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadResources();
  }, [loadResources]);

  if (loading) {
    return <p className="resource-empty">Loading published policies...</p>;
  }

  if (!resources.length) {
    return (
      <p className="resource-empty">
        No APEC policy documents have been published yet.
      </p>
    );
  }

  return (
    <div className="resource-grid">
      {resources.map((resource) => {
        const publicUrl = supabase?.storage
          .from(resource.storage_bucket)
          .getPublicUrl(resource.storage_path).data.publicUrl;

        return (
          <article className="resource-item" key={resource.id}>
            <span className="resource-file-icon"><FileText aria-hidden="true" /></span>
            <div>
              <h3>{resource.title}</h3>
              {resource.summary ? <p>{resource.summary}</p> : null}
              {publicUrl ? (
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  View policy <ExternalLink aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
