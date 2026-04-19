"use client";

/**
 * PostsArchive
 *
 * Shows the full LinkedIn post history with:
 * - AI-generated insights on what posts reveal
 * - Search/filter
 * - Full post text with expand/collapse
 */

import { useState, useTransition, useMemo } from "react";
import { getPostInsights } from "@/app/actions/linkedin-insights";
import type { LinkedInPost } from "@/types/linkedin";
import type { PostInsights } from "@/lib/ai/linkedin";

// ── Insight panel ─────────────────────────────────────────────────────────────

function InsightPanel({
  insights,
  onAnalyze,
  isLoading,
}: {
  insights: PostInsights | null;
  onAnalyze: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div
        style={{
          padding: "2rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: "2.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="thinking-dot"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.82rem",
            color: "var(--text-4)",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          Analyzing your posts…
        </p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div
        style={{
          padding: "1.75rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: "2.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.82rem",
            color: "var(--text-4)",
            lineHeight: 1.65,
            marginBottom: "1.25rem",
          }}
        >
          Get AI analysis of what your posts reveal — recurring themes, expertise signals,
          and professional identity patterns the AI has observed.
        </p>
        <button
          onClick={onAnalyze}
          style={{
            background: "none",
            border: "1px solid var(--border-2)",
            color: "var(--text-3)",
            fontFamily: "Georgia, serif",
            fontSize: "0.68rem",
            letterSpacing: "0.08em",
            padding: "0.5rem 1.25rem",
            cursor: "pointer",
          }}
        >
          analyze posts →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        marginBottom: "2.5rem",
      }}
    >
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.58rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text-4)",
          marginBottom: "1.5rem",
        }}
      >
        What your posts reveal
      </p>

      {/* Main reveal */}
      <p
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontSize: "0.95rem",
          fontWeight: 300,
          color: "var(--text-2)",
          lineHeight: 1.75,
          borderLeft: "2px solid var(--border-2)",
          paddingLeft: "1rem",
          marginBottom: "2rem",
        }}
      >
        {insights.what_posts_reveal}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Themes */}
        <div>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.56rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-4)",
              marginBottom: "0.6rem",
            }}
          >
            Recurring themes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {insights.themes.map((t, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "0.78rem",
                  color: "var(--text-3)",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: "var(--copper)", fontFamily: "monospace" }}>→</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Expertise signals */}
        <div>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.56rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-4)",
              marginBottom: "0.6rem",
            }}
          >
            Expertise signals
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {insights.expertise_signals.map((e, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "0.78rem",
                  color: "var(--text-3)",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: "var(--green)", fontFamily: "monospace" }}>◆</span>
                {e}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Communication style */}
      <div
        style={{
          marginTop: "1.75rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.56rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-4)",
            marginBottom: "0.5rem",
          }}
        >
          Communication style
        </p>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.8rem",
            color: "var(--text-3)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {insights.communication_style}
        </p>
      </div>

      <button
        onClick={onAnalyze}
        style={{
          background: "none",
          border: "none",
          padding: "1rem 0 0",
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          fontSize: "0.68rem",
          color: "var(--text-4)",
          display: "block",
        }}
      >
        ↺ re-analyze
      </button>
    </div>
  );
}

// ── Post row ──────────────────────────────────────────────────────────────────

function PostRow({ post }: { post: LinkedInPost }) {
  const [expanded, setExpanded] = useState(false);
  const preview = post.text.slice(0, 220);
  const hasMore = post.text.length > 220;

  return (
    <article
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "1.5rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.62rem",
            color: "var(--text-4)",
          }}
        >
          {post.date.slice(0, 10)}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.58rem",
            color: post.type === "article" ? "var(--copper)" : "var(--text-4)",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            padding: "0.05rem 0.4rem",
          }}
        >
          {post.type}
        </span>
      </div>

      {post.title && (
        <p
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: "0.95rem",
            fontWeight: 300,
            color: "var(--text-2)",
            margin: "0 0 0.5rem",
          }}
        >
          {post.title}
        </p>
      )}

      <p
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "0.83rem",
          color: "var(--text-3)",
          lineHeight: 1.8,
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {expanded ? post.text : preview}
        {hasMore && !expanded && "…"}
      </p>

      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: "none",
            border: "none",
            padding: "0.5rem 0 0",
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            fontSize: "0.7rem",
            color: "var(--text-4)",
            display: "block",
          }}
        >
          {expanded ? "collapse ↑" : "read more ↓"}
        </button>
      )}
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PostsArchive({
  posts,
  totalPostCount,
}: {
  posts: LinkedInPost[];
  totalPostCount: number;
}) {
  const [insights, setInsights] = useState<PostInsights | null>(null);
  const [isAnalyzing, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "post" | "article">("all");

  const filtered = useMemo(() => {
    let list = posts;
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.text.toLowerCase().includes(q) ||
          (p.title && p.title.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [posts, typeFilter, search]);

  function analyze() {
    startTransition(async () => {
      const result = await getPostInsights();
      if (result.ok) setInsights(result.insights);
    });
  }

  const filterBtnStyle = (active: boolean) => ({
    background: "none",
    border: "none",
    borderBottom: `2px solid ${active ? "var(--copper)" : "transparent"}`,
    padding: "0.4rem 0",
    marginRight: "1.25rem",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    fontSize: "0.75rem",
    color: active ? "var(--text-2)" : "var(--text-4)",
    transition: "color 0.15s, border-color 0.15s",
  });

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        paddingLeft: "var(--sidebar-w, 60px)",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "calc(56px + 3.5rem) 5vw 8rem",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.58rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--text-4)",
              marginBottom: "0.75rem",
            }}
          >
            <a
              href="/linkedin"
              style={{ color: "inherit", textDecoration: "none", opacity: 0.7 }}
            >
              LinkedIn
            </a>
            {" / "}
            Posts
          </p>
          <h1
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 300,
              color: "var(--text-1)",
              margin: "0 0 0.5rem",
            }}
          >
            Your post archive
          </h1>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.8rem",
              color: "var(--text-4)",
            }}
          >
            {totalPostCount} posts and articles imported
          </p>
        </div>

        {/* Insight panel */}
        <InsightPanel insights={insights} onAnalyze={analyze} isLoading={isAnalyzing} />

        {/* Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search posts…"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              fontFamily: "Georgia, serif",
              fontSize: "0.8rem",
              padding: "0.4rem 0.75rem",
              outline: "none",
              flex: 1,
              minWidth: "160px",
            }}
          />
          <div style={{ display: "flex" }}>
            <button
              style={filterBtnStyle(typeFilter === "all")}
              onClick={() => setTypeFilter("all")}
            >
              all
            </button>
            <button
              style={filterBtnStyle(typeFilter === "post")}
              onClick={() => setTypeFilter("post")}
            >
              posts
            </button>
            <button
              style={filterBtnStyle(typeFilter === "article")}
              onClick={() => setTypeFilter("article")}
            >
              articles
            </button>
          </div>
        </div>

        {/* Post list */}
        {filtered.length === 0 ? (
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.82rem",
              color: "var(--text-4)",
              fontStyle: "italic",
              padding: "2rem 0",
            }}
          >
            No posts match your search.
          </p>
        ) : (
          filtered.map((post, i) => <PostRow key={i} post={post} />)
        )}
      </div>
    </div>
  );
}
