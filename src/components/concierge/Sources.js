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

export default function Sources({ content }) {
  if (!Array.isArray(content)) return null;
  const all = [];
  for (const block of content) {
    if (block?.type !== "tool") continue;
    if (!PERPLEXITY_TOOLS.has(block.name)) continue;
    if (block.status !== "done") continue;
    all.push(...extractCitationsFromResult(block.result));
  }
  if (!all.length) return null;

  const seen = new Set();
  const dedup = all.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1.5">
        Sources
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dedup.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-2 py-1 text-gray-600 hover:text-primary transition-colors"
            title={c.url}
          >
            <span className="truncate max-w-[120px]">{c.title}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-gray-400" />
          </a>
        ))}
      </div>
    </div>
  );
}
