"use client";
import { ExternalLink } from "lucide-react";

const PERPLEXITY_TOOLS = new Set([
  "webSearch",
  "searchMedicalEvidence",
  "searchMedicalEvidenceDeep",
]);

function deriveTitleFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function extractCitationsFromResult(result) {
  if (!result || typeof result !== "object") return [];
  const out = [];
  if (Array.isArray(result.citations)) {
    for (const entry of result.citations) {
      if (typeof entry === "string") {
        out.push({ url: entry, title: deriveTitleFromUrl(entry) });
      } else if (entry && typeof entry === "object" && entry.url) {
        out.push({
          url: entry.url,
          title: entry.title || deriveTitleFromUrl(entry.url),
        });
      }
    }
  }
  if (Array.isArray(result.search_results)) {
    for (const s of result.search_results) {
      if (s?.url)
        out.push({
          url: s.url,
          title: s.title || deriveTitleFromUrl(s.url),
        });
    }
  }
  if (Array.isArray(result.sources)) {
    for (const s of result.sources) {
      if (typeof s === "string")
        out.push({ url: s, title: deriveTitleFromUrl(s) });
      else if (s?.url)
        out.push({
          url: s.url,
          title: s.title || deriveTitleFromUrl(s.url),
        });
    }
  }
  const seen = new Set();
  return out.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

// Pull the deduped citation list out of a message's content blocks. Exported so
// the assistant action bar can show an "N Sources" toggle without re-deriving.
export function getCitations(content) {
  if (!Array.isArray(content)) return [];
  const all = [];
  for (const block of content) {
    if (block?.type !== "tool" && block?.type !== "step") continue;
    if (!PERPLEXITY_TOOLS.has(block.name)) continue;
    if (block.status !== "done") continue;
    all.push(...extractCitationsFromResult(block.result));
  }
  const seen = new Set();
  return all.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

export default function Sources({ content }) {
  const dedup = getCitations(content);
  if (!dedup.length) return null;

  return (
    <div className="mt-3">
      <div className="text-[11px] uppercase tracking-wide text-secondary font-semibold mb-1.5">
        Sources
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dedup.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[11px] bg-white hover:bg-pageBackground border border-borderColor rounded-full px-2 py-1 text-secondary hover:text-blue hover:border-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title={c.url}
          >
            <span className="truncate max-w-[40vw] sm:max-w-[160px]">{c.title}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-secondary" />
          </a>
        ))}
      </div>
    </div>
  );
}
