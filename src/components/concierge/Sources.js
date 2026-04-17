"use client";
import { ExternalLink, FileText } from "lucide-react";

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
          date: s.date,
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
    <div className="mt-3 border border-borderColor rounded-lg bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-500">
        <FileText className="w-3 h-3" />
        Sources ({dedup.length})
      </div>
      <ul className="divide-y divide-gray-100">
        {dedup.map((c, i) => (
          <li key={i} className="px-3 py-2 text-xs">
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-purple-700 hover:underline inline-flex items-center gap-1"
            >
              <span className="truncate max-w-xs">{c.title}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <div className="text-gray-400 truncate">{c.url}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
