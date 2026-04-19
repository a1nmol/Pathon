"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/db/client";
import type { CredentialsInsert, ProjectDescription } from "@/types";

// ─── PDF text extraction ──────────────────────────────────────────────────────
// Dynamic import keeps pdfjs out of the initial bundle.
// The worker URL is resolved from unpkg using the installed version so they
// always match — no manual version pinning needed.

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(text);
  }

  return pages.join("\n\n");
}

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadPhase =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "extracting" }
  | { status: "ready"; filename: string; charCount: number }
  | { status: "error"; message: string };

type SaveStatus = "idle" | "saving" | "saved" | "error";

type LocalProject = {
  key: string;
  title: string;
  description: string;
};

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({
  phase,
  isDragging,
  onFile,
  onDragOver,
  onDragLeave,
  onDrop,
  inputRef,
}: {
  phase: UploadPhase;
  isDragging: boolean;
  onFile: (file: File) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  const borderClass = isDragging
    ? "border-current/60 bg-current/[0.03]"
    : phase.status === "error"
      ? "border-current/30"
      : "border-current/15 hover:border-current/30";

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors duration-150 ${borderClass}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,text/plain,application/pdf"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload resume"
      />

      {phase.status === "idle" && (
        <>
          <p className="text-base">Drop your resume here</p>
          <p className="mt-1 text-sm text-current/40">PDF or plain text file</p>
        </>
      )}

      {phase.status === "reading" && (
        <p className="text-base text-current/50">Reading file...</p>
      )}

      {phase.status === "extracting" && (
        <p className="text-base text-current/50">Extracting text...</p>
      )}

      {phase.status === "ready" && (
        <>
          <p className="text-base">{phase.filename}</p>
          <p className="mt-1 text-sm text-current/40">
            {phase.charCount.toLocaleString()} characters extracted
          </p>
          <p className="mt-3 text-xs text-current/30">Click to replace</p>
        </>
      )}

      {phase.status === "error" && (
        <>
          <p className="text-base">Extraction failed</p>
          <p className="mt-1 text-sm text-current/40">{phase.message}</p>
          <p className="mt-3 text-xs text-current/30">Click to try again</p>
        </>
      )}
    </div>
  );
}

// ─── CredentialIntake ─────────────────────────────────────────────────────────

export function CredentialIntake({
  userId,
  onSaved,
}: {
  userId: string;
  onSaved?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input mode
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>({ status: "idle" });

  // Collected data
  const [resumeText, setResumeText] = useState("");
  const [resumeSource, setResumeSource] = useState<"pdf" | "text" | "paste" | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [projects, setProjects] = useState<LocalProject[]>([]);

  // Save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── File handling ────────────────────────────────────────────────────────────

  async function processFile(file: File) {
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");

    setResumeFile(file);
    setUploadPhase({ status: "reading" });

    try {
      let text: string;
      let source: "pdf" | "text";

      if (isPDF) {
        setUploadPhase({ status: "extracting" });
        text = await extractTextFromPDF(file);
        source = "pdf";
      } else {
        text = await file.text();
        source = "text";
      }

      if (!text.trim()) {
        setUploadPhase({ status: "error", message: "No readable text found in this file." });
        return;
      }

      setResumeText(text);
      setResumeSource(source);
      setUploadPhase({ status: "ready", filename: file.name, charCount: text.length });
    } catch {
      setUploadPhase({ status: "error", message: "Could not read this file. Try a different format." });
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  // ── Projects ─────────────────────────────────────────────────────────────────

  function addProject() {
    setProjects((prev) => [
      ...prev,
      { key: crypto.randomUUID(), title: "", description: "" },
    ]);
  }

  function updateProject(key: string, field: "title" | "description", value: string) {
    setProjects((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)),
    );
  }

  function removeProject(key: string) {
    setProjects((prev) => prev.filter((p) => p.key !== key));
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  async function handleSave() {
    const hasResume = (inputMode === "file" && uploadPhase.status === "ready") ||
                      (inputMode === "paste" && resumeText.trim().length > 0);
    const hasGitHub = githubUrl.trim().length > 0;
    const hasProjects = projects.some((p) => p.description.trim().length > 0);

    if (!hasResume && !hasGitHub && !hasProjects) return;

    setSaveStatus("saving");
    setSaveError(null);

    const supabase = createClient();

    // Upload original file to storage (best-effort — never block on failure)
    let resumeFilePath: string | null = null;
    if (resumeFile && resumeSource !== "paste") {
      const ext = resumeSource === "pdf" ? "pdf" : "txt";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { data } = await supabase.storage
        .from("resumes")
        .upload(path, resumeFile, { upsert: true });
      resumeFilePath = data?.path ?? null;
    }

    const projectPayload: ProjectDescription[] = projects
      .filter((p) => p.title.trim() || p.description.trim())
      .map(({ title, description }) => ({ title: title.trim(), description: description.trim() }));

    const payload: CredentialsInsert = {
      user_id: userId,
      resume_text: resumeText.trim() || null,
      resume_file_path: resumeFilePath,
      resume_source: resumeSource,
      github_url: githubUrl.trim() || null,
      project_descriptions: projectPayload,
    };

    const { error } = await (supabase
      .from("credentials") as unknown as { upsert: (v: unknown, o: unknown) => Promise<{ error: { message: string } | null }> })
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      setSaveStatus("error");
      setSaveError(error.message);
    } else {
      setSaveStatus("saved");
      onSaved?.();
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────────

  const canSave =
    saveStatus !== "saving" &&
    (
      (inputMode === "file" && uploadPhase.status === "ready") ||
      (inputMode === "paste" && resumeText.trim().length > 0) ||
      githubUrl.trim().length > 0 ||
      projects.some((p) => p.description.trim().length > 0)
    );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto px-6 space-y-14" style={{ paddingTop: "calc(52px + 3.5rem)", paddingBottom: "8rem" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#5c6478", marginBottom: "0.75rem" }}>
          Credentials
        </p>
        <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 300, color: "#8892a4", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
          What you&apos;ve actually built.
        </h1>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", color: "#2a3040", margin: 0, lineHeight: 1.7 }}>
          Resume, GitHub, and the projects you&apos;re proud of.
        </p>
      </div>

      {/* ── Resume ── */}
      <section className="space-y-5">
        {/* Mode toggle */}
        <div className="flex gap-1 text-sm">
          <button
            onClick={() => setInputMode("file")}
            className={`px-3 py-1.5 rounded transition-colors duration-150 ${
              inputMode === "file" ? "bg-current/[0.06]" : "text-current/40 hover:text-current/70"
            }`}
          >
            Upload file
          </button>
          <button
            onClick={() => setInputMode("paste")}
            className={`px-3 py-1.5 rounded transition-colors duration-150 ${
              inputMode === "paste" ? "bg-current/[0.06]" : "text-current/40 hover:text-current/70"
            }`}
          >
            Paste text
          </button>
        </div>

        {inputMode === "file" ? (
          <DropZone
            phase={uploadPhase}
            isDragging={isDragging}
            onFile={processFile}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            inputRef={fileInputRef}
          />
        ) : (
          <textarea
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              setResumeSource("paste");
            }}
            placeholder="Paste your resume text here..."
            rows={14}
            className="w-full resize-none bg-transparent outline-none border border-current/15 rounded-lg p-4 text-sm leading-relaxed placeholder:text-current/25 focus:border-current/35 transition-colors duration-150"
          />
        )}
      </section>

      {/* ── GitHub URL ── */}
      <section>
        <input
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="GitHub URL (optional)"
          className="w-full bg-transparent outline-none border-b border-current/15 pb-2 text-base placeholder:text-current/30 focus:border-current/40 transition-colors duration-150"
        />
      </section>

      {/* ── Projects ── */}
      <section className="space-y-6">
        {projects.map((project) => (
          <div key={project.key} className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                value={project.title}
                onChange={(e) => updateProject(project.key, "title", e.target.value)}
                placeholder="Project name"
                className="flex-1 bg-transparent outline-none border-b border-current/15 pb-1.5 text-sm placeholder:text-current/30 focus:border-current/40 transition-colors duration-150"
              />
              <button
                onClick={() => removeProject(project.key)}
                className="text-xs text-current/30 hover:text-current/60 transition-colors shrink-0"
                aria-label="Remove project"
              >
                Remove
              </button>
            </div>
            <textarea
              value={project.description}
              onChange={(e) => updateProject(project.key, "description", e.target.value)}
              placeholder="What you built, your role, the outcome..."
              rows={3}
              className="w-full resize-none bg-transparent outline-none border border-current/15 rounded-lg p-3 text-sm leading-relaxed placeholder:text-current/25 focus:border-current/35 transition-colors duration-150"
            />
          </div>
        ))}

        <button
          onClick={addProject}
          className="text-sm text-current/40 hover:text-current/70 transition-colors"
        >
          + Add project
        </button>
      </section>

      {/* ── Save ── */}
      <section className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
        </button>

        {saveStatus === "error" && saveError && (
          <p className="text-sm text-current/40">{saveError}</p>
        )}

        {saveStatus === "saved" && (
          <button
            onClick={() => setSaveStatus("idle")}
            className="text-sm text-current/30 hover:text-current/60 transition-colors"
          >
            Edit
          </button>
        )}
      </section>

    </div>
  );
}
