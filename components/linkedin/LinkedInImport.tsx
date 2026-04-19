"use client";

/**
 * LinkedInImport
 *
 * Guides the user through downloading + uploading their LinkedIn export ZIP.
 * Parses the ZIP client-side (privacy) and saves parsed data via server action.
 * Shows a preview of everything found before confirming import.
 */

import { useState, useRef, useTransition, useCallback } from "react";
import { importLinkedInData } from "@/app/actions/linkedin";
import { parseLinkedInZip } from "@/lib/linkedin/parser";
import type { ParsedLinkedInData, LinkedInPost } from "@/types/linkedin";

// ── Step machine ──────────────────────────────────────────────────────────────

type Step =
  | { id: "instructions" }
  | { id: "parsing" }
  | { id: "preview"; data: ParsedLinkedInData }
  | { id: "saving" }
  | { id: "done"; data: ParsedLinkedInData }
  | { id: "error"; message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'DM Mono', 'Courier New', monospace",
        fontSize: "0.58rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--text-4)",
        marginBottom: "0.5rem",
      }}
    >
      {children}
    </p>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "Georgia, serif",
        fontSize: "0.72rem",
        color: "var(--text-3)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "0.15rem 0.5rem",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        padding: "1rem 1.5rem",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        flex: 1,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "1.6rem",
          fontWeight: 300,
          color: "var(--copper)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "0.72rem",
          color: "var(--text-4)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PostCard({ post }: { post: LinkedInPost }) {
  const [expanded, setExpanded] = useState(false);
  const preview = post.text.slice(0, 180);
  const hasMore = post.text.length > 180;

  return (
    <div
      style={{
        borderLeft: "1px solid var(--border)",
        paddingLeft: "1.25rem",
        marginBottom: "1.25rem",
      }}
    >
      {post.title && (
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--text-2)",
            marginBottom: "0.25rem",
          }}
        >
          {post.title}
        </p>
      )}
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "0.8rem",
          color: "var(--text-3)",
          lineHeight: 1.75,
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {expanded ? post.text : preview}
        {hasMore && !expanded && "…"}
      </p>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginTop: "0.5rem",
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
            fontSize: "0.6rem",
            color: "var(--text-4)",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            padding: "0.05rem 0.35rem",
          }}
        >
          {post.type}
        </span>
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
              fontSize: "0.7rem",
              color: "var(--text-4)",
            }}
          >
            {expanded ? "collapse" : "read more"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Instructions step ─────────────────────────────────────────────────────────

function Instructions({ onFile }: { onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const steps = [
    {
      n: "01",
      text: "Go to LinkedIn → Me → Settings & Privacy → Data Privacy → Get a copy of your data",
    },
    {
      n: "02",
      text: 'Select "The works" or pick: Profile, Positions, Skills, Posts, Articles. Then click Request Archive.',
    },
    {
      n: "03",
      text: "LinkedIn emails you a link (usually within 10 minutes). Download the ZIP file.",
    },
    { n: "04", text: "Upload the ZIP file below. Everything is parsed locally — raw data never leaves your device." },
  ];

  return (
    <div>
      <div style={{ marginBottom: "3rem" }}>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.58rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--text-4)",
            marginBottom: "1rem",
          }}
        >
          LinkedIn Import
        </p>
        <h1
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
            fontWeight: 300,
            color: "var(--text-1)",
            margin: "0 0 1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Stop entering things manually.
        </h1>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.88rem",
            color: "var(--text-4)",
            lineHeight: 1.75,
            maxWidth: "480px",
          }}
        >
          Upload your LinkedIn data export and Pathon automatically imports your work history,
          education, skills, and every post you've ever written. The AI gets your full professional
          context without you typing a word.
        </p>
      </div>

      {/* Steps */}
      <div style={{ marginBottom: "3rem" }}>
        <Label>How to get your export</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginTop: "0.75rem" }}>
          {steps.map((s) => (
            <div
              key={s.n}
              style={{
                display: "flex",
                gap: "1.25rem",
                alignItems: "flex-start",
                padding: "0.9rem 1rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  color: "var(--copper)",
                  flexShrink: 0,
                  marginTop: "1px",
                }}
              >
                {s.n}
              </span>
              <span
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "0.82rem",
                  color: "var(--text-3)",
                  lineHeight: 1.65,
                }}
              >
                {s.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div>
        <Label>Upload your LinkedIn ZIP</Label>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) onFile(file);
          }}
          style={{
            border: "1px dashed var(--border-2)",
            padding: "3rem 2rem",
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.2s ease",
            marginTop: "0.75rem",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--copper)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-2)";
          }}
        >
          <p
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "1rem",
              color: "var(--text-3)",
              margin: "0 0 0.5rem",
            }}
          >
            Drop ZIP file here
          </p>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.72rem",
              color: "var(--text-4)",
              margin: 0,
            }}
          >
            or click to browse — only .zip files accepted
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".zip"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Preview step ──────────────────────────────────────────────────────────────

function Preview({
  data,
  onConfirm,
  onBack,
}: {
  data: ParsedLinkedInData;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "posts">("overview");

  const tabStyle = (tab: typeof activeTab) => ({
    background: "none",
    border: "none",
    borderBottom: `2px solid ${activeTab === tab ? "var(--copper)" : "transparent"}`,
    padding: "0.5rem 0",
    marginRight: "1.5rem",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    fontSize: "0.78rem",
    color: activeTab === tab ? "var(--text-2)" : "var(--text-4)",
    transition: "color 0.15s, border-color 0.15s",
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <Label>Import preview</Label>
        <h2
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: "1.4rem",
            fontWeight: 300,
            color: "var(--text-1)",
            margin: "0.5rem 0 0.75rem",
          }}
        >
          Here's what we found
        </h2>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.82rem",
            color: "var(--text-4)",
            lineHeight: 1.65,
          }}
        >
          Review your data, then click Import to add it to your profile.
          The AI will use all of this as context.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "1px",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
        }}
      >
        <StatPill value={data.positions.length} label="positions" />
        <StatPill value={data.education.length} label="education" />
        <StatPill value={data.skills.length} label="skills" />
        <StatPill value={data.posts.length} label="posts & articles" />
      </div>

      {/* Tabs */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          marginBottom: "2rem",
        }}
      >
        <button style={tabStyle("overview")} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button style={tabStyle("posts")} onClick={() => setActiveTab("posts")}>
          Posts ({data.posts.length})
        </button>
      </div>

      {activeTab === "overview" && (
        <div>
          {/* Headline & Summary */}
          {(data.headline || data.summary) && (
            <div style={{ marginBottom: "2rem" }}>
              {data.headline && (
                <p
                  style={{
                    fontFamily: "'Poppins', system-ui, sans-serif",
                    fontSize: "1.05rem",
                    color: "var(--text-2)",
                    marginBottom: "0.75rem",
                  }}
                >
                  &ldquo;{data.headline}&rdquo;
                </p>
              )}
              {data.summary && (
                <p
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "0.82rem",
                    color: "var(--text-4)",
                    lineHeight: 1.75,
                    borderLeft: "1px solid var(--border)",
                    paddingLeft: "1rem",
                  }}
                >
                  {data.summary.slice(0, 300)}
                  {data.summary.length > 300 && "…"}
                </p>
              )}
            </div>
          )}

          {/* Work history */}
          {data.positions.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <Label>Work history</Label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                  marginTop: "0.75rem",
                }}
              >
                {data.positions.slice(0, 6).map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.75rem 1rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "0.82rem",
                          color: "var(--text-2)",
                          margin: "0 0 0.2rem",
                        }}
                      >
                        {p.title}
                      </p>
                      <p
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "0.75rem",
                          color: "var(--text-4)",
                          margin: 0,
                        }}
                      >
                        {p.company}
                        {p.location ? ` · ${p.location}` : ""}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.62rem",
                        color: "var(--text-4)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.started_on?.slice(0, 7) ?? "?"}
                      {" → "}
                      {p.is_current ? "now" : (p.finished_on?.slice(0, 7) ?? "?")}
                    </span>
                  </div>
                ))}
                {data.positions.length > 6 && (
                  <p
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "0.72rem",
                      color: "var(--text-4)",
                      padding: "0.5rem 0",
                    }}
                  >
                    + {data.positions.length - 6} more positions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <Label>Skills ({data.skills.length})</Label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                  marginTop: "0.75rem",
                }}
              >
                {data.skills.slice(0, 24).map((s, i) => (
                  <Chip key={i}>{s.name}</Chip>
                ))}
                {data.skills.length > 24 && (
                  <Chip>+{data.skills.length - 24} more</Chip>
                )}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <Label>Education</Label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  marginTop: "0.75rem",
                }}
              >
                {data.education.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "0.82rem",
                      color: "var(--text-3)",
                      padding: "0.6rem 1rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {e.school}
                    {e.degree && (
                      <span style={{ color: "var(--text-4)" }}>
                        {" "}· {e.degree}
                        {e.field ? ` in ${e.field}` : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "posts" && (
        <div>
          {data.posts.length === 0 ? (
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "0.82rem",
                color: "var(--text-4)",
                fontStyle: "italic",
              }}
            >
              No posts or articles found in the export. Make sure you selected
              "Posts" or "The works" when requesting the archive.
            </p>
          ) : (
            data.posts.slice(0, 20).map((post, i) => (
              <PostCard key={i} post={post} />
            ))
          )}
          {data.posts.length > 20 && (
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "0.72rem",
                color: "var(--text-4)",
                fontStyle: "italic",
              }}
            >
              Showing 20 of {data.posts.length} posts. All will be imported.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          alignItems: "center",
          marginTop: "3rem",
          paddingTop: "2rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          onClick={onConfirm}
          style={{
            background: "none",
            border: "1px solid var(--copper)",
            color: "var(--copper)",
            fontFamily: "Georgia, serif",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            padding: "0.6rem 1.75rem",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,108,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >
          import all →
        </button>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            fontSize: "0.7rem",
            color: "var(--text-4)",
          }}
        >
          ← try different file
        </button>
      </div>
    </div>
  );
}

// ── Done state ────────────────────────────────────────────────────────────────

function Done({ data }: { data: ParsedLinkedInData }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 0" }}>
      <span
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "2rem",
          color: "var(--green)",
          display: "block",
          marginBottom: "1.5rem",
        }}
      >
        ✓
      </span>
      <h2
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontSize: "1.5rem",
          fontWeight: 300,
          color: "var(--text-1)",
          margin: "0 0 1rem",
        }}
      >
        LinkedIn imported.
      </h2>
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "0.85rem",
          color: "var(--text-4)",
          lineHeight: 1.75,
          maxWidth: "400px",
          margin: "0 auto 2rem",
        }}
      >
        {data.positions.length} positions, {data.skills.length} skills, and{" "}
        {data.posts.length} posts are now part of your profile. The AI knows your
        full professional history.
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <a
          href="/paths"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.72rem",
            color: "var(--copper)",
            border: "1px solid var(--copper)",
            padding: "0.5rem 1.25rem",
            textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(201,168,108,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "none";
          }}
        >
          regenerate paths →
        </a>
        <a
          href="/linkedin/posts"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.72rem",
            color: "var(--text-3)",
            border: "1px solid var(--border)",
            padding: "0.5rem 1.25rem",
            textDecoration: "none",
          }}
        >
          view post archive →
        </a>
        <a
          href="/dashboard"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.72rem",
            color: "var(--text-4)",
            padding: "0.5rem 0",
            textDecoration: "none",
          }}
        >
          back to dashboard
        </a>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LinkedInImport({ alreadyImported }: { alreadyImported: boolean }) {
  const [step, setStep] = useState<Step>(
    alreadyImported ? { id: "instructions" } : { id: "instructions" },
  );
  const [isPending, startTransition] = useTransition();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setStep({ id: "error", message: "Please upload a .zip file." });
      return;
    }
    setStep({ id: "parsing" });
    try {
      const data = await parseLinkedInZip(file);
      const total = data.positions.length + data.skills.length + data.posts.length + data.education.length;
      if (total === 0) {
        setStep({
          id: "error",
          message:
            "No data was found in this file. Make sure you uploaded the LinkedIn export ZIP (not a different file) and that you selected all data categories when requesting the export.",
        });
        return;
      }
      setStep({ id: "preview", data });
    } catch (err) {
      setStep({
        id: "error",
        message: `Could not parse the file: ${err instanceof Error ? err.message : "unknown error"}`,
      });
    }
  }, []);

  const handleConfirm = useCallback(
    (data: ParsedLinkedInData) => {
      setStep({ id: "saving" });
      startTransition(async () => {
        const result = await importLinkedInData(data);
        if (result.ok) {
          setStep({ id: "done", data });
        } else {
          setStep({ id: "error", message: result.error });
        }
      });
    },
    [],
  );

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
          maxWidth: "680px",
          margin: "0 auto",
          padding: "calc(56px + 4rem) 5vw 8rem",
        }}
      >
        {/* Already imported banner */}
        {alreadyImported && step.id === "instructions" && (
          <div
            style={{
              border: "1px solid var(--green-dim, #2d4039)",
              background: "rgba(45,64,57,0.15)",
              padding: "0.75rem 1rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span style={{ color: "var(--green)", fontSize: "0.8rem" }}>✓</span>
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "0.78rem",
                color: "var(--text-3)",
                margin: 0,
              }}
            >
              LinkedIn data already imported. Upload a new export to refresh it.
            </p>
          </div>
        )}

        {step.id === "instructions" && (
          <Instructions onFile={handleFile} />
        )}

        {step.id === "parsing" && (
          <div style={{ padding: "4rem 0", textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                gap: "6px",
                justifyContent: "center",
                marginBottom: "1.5rem",
              }}
            >
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
                fontSize: "0.85rem",
                color: "var(--text-4)",
                fontStyle: "italic",
              }}
            >
              Parsing your LinkedIn export…
            </p>
          </div>
        )}

        {step.id === "preview" && (
          <Preview
            data={step.data}
            onConfirm={() => handleConfirm(step.data)}
            onBack={() => setStep({ id: "instructions" })}
          />
        )}

        {step.id === "saving" && (
          <div style={{ padding: "4rem 0", textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                gap: "6px",
                justifyContent: "center",
                marginBottom: "1.5rem",
              }}
            >
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
                fontSize: "0.85rem",
                color: "var(--text-4)",
                fontStyle: "italic",
              }}
            >
              Saving to your profile…
            </p>
          </div>
        )}

        {step.id === "done" && <Done data={step.data} />}

        {step.id === "error" && (
          <div>
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "0.85rem",
                color: "var(--text-3)",
                borderLeft: "1px solid var(--border)",
                paddingLeft: "1rem",
                lineHeight: 1.7,
                marginBottom: "2rem",
              }}
            >
              {step.message}
            </p>
            <button
              onClick={() => setStep({ id: "instructions" })}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: "Georgia, serif",
                fontSize: "0.72rem",
                color: "var(--text-4)",
              }}
            >
              ← try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
