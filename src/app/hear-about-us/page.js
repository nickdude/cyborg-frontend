"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";
import Link from "next/link";

export default function HearAboutUsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expanded, setExpanded] = useState({
    socialMediaOrAd: true,
    wordOfMouth: false,
    podcast: false,
    creator: false,
    webSearch: false,
    email: false,
  });

  const [form, setForm] = useState({
    socialMediaOrAd: { platforms: [], otherText: "" },
    wordOfMouth: { sources: [], otherText: "" },
    podcast: { note: "" },
    creator: { note: "" },
    webSearch: { engines: [], otherText: "" },
    email: { sources: [], otherText: "" },
  });

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.id) {
      fetchSaved();
    }
  }, [token, user?.id]);

  const fetchSaved = async () => {
    try {
      const res = await userAPI.getHearAboutUs(user.id);
      if (res.data) {
        setForm({
          socialMediaOrAd: res.data.socialMediaOrAd || { platforms: [], otherText: "" },
          wordOfMouth: res.data.wordOfMouth || { sources: [], otherText: "" },
          podcast: res.data.podcast || { note: "" },
          creator: res.data.creator || { note: "" },
          webSearch: res.data.webSearch || { engines: [], otherText: "" },
          email: res.data.email || { sources: [], otherText: "" },
        });
      }
    } catch (e) {
      // ignore if none exists
    }
  };

  const toggleExpand = (key) =>
    setExpanded((prev) => {
      const allClosed = {
        socialMediaOrAd: false,
        wordOfMouth: false,
        podcast: false,
        creator: false,
        webSearch: false,
        email: false,
      };
      // If clicking the already-open section, close all; otherwise open the clicked one and close others
      const isCurrentlyOpen = !!prev[key];
      return { ...allClosed, [key]: !isCurrentlyOpen };
    });

  const toggleOption = (path, value) => {
    setForm((prev) => {
      const [section, field] = path.split(".");
      const list = prev[section][field];
      const exists = list.includes(value);
      const updated = exists ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [section]: { ...prev[section], [field]: updated } };
    });
  };

  const handleChange = (path, value) => {
    setForm((prev) => {
      const [section, field] = path.split(".");
      return { ...prev, [section]: { ...prev[section], [field]: value } };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await userAPI.saveHearAboutUs(user.id, form);
      setSuccess("Saved successfully");
      setTimeout(() => router.push("/welcome"), 800);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const Checkbox = ({ checked, onChange }) => (
    <span
      onClick={onChange}
      className={`w-4 h-4 inline-block border rounded cursor-pointer ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
    />
  );

  const Section = ({ title, children, expanded, onToggle }) => (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={onToggle} className="text-gray-600">{expanded ? "▾" : "▸"}</button>
      </div>
      {expanded && <div className="p-4 space-y-2">{children}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-gray-600 hover:underline">← Back</Link>
        </div>
        <h1 className="text-3xl font-bold mb-6">CYBORG</h1>
        <p className="text-gray-700 mb-6">How did you hear about us?</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
        )}

        {/* Social Media or Ad */}
        <Section
          title="Social Media or Ad"
          expanded={expanded.socialMediaOrAd}
          onToggle={() => toggleExpand("socialMediaOrAd")}
        >
          {[
            "TikTok",
            "Instagram",
            "Facebook",
            "YouTube",
            "LinkedIn",
            "Other",
          ].map((opt) => (
            <div key={opt} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={form.socialMediaOrAd.platforms.includes(opt)}
                  onChange={() => toggleOption("socialMediaOrAd.platforms", opt)}
                />
                <span>{opt}</span>
              </div>
            </div>
          ))}
          {form.socialMediaOrAd.platforms.includes("Other") && (
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="Please tell us more..."
              value={form.socialMediaOrAd.otherText}
              onChange={(e) => handleChange("socialMediaOrAd.otherText", e.target.value)}
            />
          )}
        </Section>

        {/* Word of Mouth */}
        <Section
          title="Word of Mouth"
          expanded={expanded.wordOfMouth}
          onToggle={() => toggleExpand("wordOfMouth")}
        >
          {["Friend", "Family", "Colleague", "Clinician", "Other"].map((opt) => (
            <div key={opt} className="flex items-center gap-3 py-2">
              <Checkbox
                checked={form.wordOfMouth.sources.includes(opt)}
                onChange={() => toggleOption("wordOfMouth.sources", opt)}
              />
              <span>{opt}</span>
            </div>
          ))}
          {form.wordOfMouth.sources.includes("Other") && (
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="Please tell us more..."
              value={form.wordOfMouth.otherText}
              onChange={(e) => handleChange("wordOfMouth.otherText", e.target.value)}
            />
          )}
        </Section>

        {/* Podcast */}
        <Section title="Podcast" expanded={expanded.podcast} onToggle={() => toggleExpand("podcast")}>
          <textarea
            className="w-full border rounded p-2 text-sm"
            placeholder="Please tell us more..."
            value={form.podcast.note}
            onChange={(e) => handleChange("podcast.note", e.target.value)}
          />
        </Section>

        {/* Creator */}
        <Section title="Creator" expanded={expanded.creator} onToggle={() => toggleExpand("creator")}>
          <textarea
            className="w-full border rounded p-2 text-sm"
            placeholder="Please tell us more..."
            value={form.creator.note}
            onChange={(e) => handleChange("creator.note", e.target.value)}
          />
        </Section>

        {/* Web Search */}
        <Section title="Web Search" expanded={expanded.webSearch} onToggle={() => toggleExpand("webSearch")}>
          {["Google", "Bing", "ChatGPT", "Perplexity", "Claude", "Other"].map((opt) => (
            <div key={opt} className="flex items-center gap-3 py-2">
              <Checkbox
                checked={form.webSearch.engines.includes(opt)}
                onChange={() => toggleOption("webSearch.engines", opt)}
              />
              <span>{opt}</span>
            </div>
          ))}
          {form.webSearch.engines.includes("Other") && (
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="Please tell us more..."
              value={form.webSearch.otherText}
              onChange={(e) => handleChange("webSearch.otherText", e.target.value)}
            />
          )}
        </Section>

        {/* Email */}
        <Section title="Email" expanded={expanded.email} onToggle={() => toggleExpand("email")}>
          {["Newsletter", "Superpower Journal", "Other"].map((opt) => (
            <div key={opt} className="flex items-center gap-3 py-2">
              <Checkbox
                checked={form.email.sources.includes(opt)}
                onChange={() => toggleOption("email.sources", opt)}
              />
              <span>{opt}</span>
            </div>
          ))}
          {form.email.sources.includes("Other") && (
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="Please tell us more..."
              value={form.email.otherText}
              onChange={(e) => handleChange("email.otherText", e.target.value)}
            />
          )}
        </Section>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
}
