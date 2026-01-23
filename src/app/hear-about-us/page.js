"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";
import Image from "next/image";
import CyborgLogo from "@/components/CyborgLogo";
import { getNextRoute } from "@/utils/navigationFlow";

export default function HearAboutUsPage() {
  const { user, token, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expanded, setExpanded] = useState({
    socialMediaOrAd: false,
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

  const fetchSaved = useCallback(async () => {
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
  }, [user?.id]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.id) {
      fetchSaved();
    }
  }, [token, user?.id, fetchSaved, router]);

  const toggleExpand = (key) => {
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
  };

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
      const response = await userAPI.saveHearAboutUs(user.id, form);
      setSuccess("Saved successfully");
      // Determine which source was selected
      let whereYouHeardAboutUs = "Other";
      if (form.socialMediaOrAd && Object.keys(form.socialMediaOrAd).length > 0) {
        whereYouHeardAboutUs = "Social Media";
      } else if (form.wordOfMouth && Object.keys(form.wordOfMouth).length > 0) {
        whereYouHeardAboutUs = "Friend Recommendation";
      } else if (form.webSearch && Object.keys(form.webSearch).length > 0) {
        whereYouHeardAboutUs = "Search Engine";
      } else if (form.podcast || form.creator || form.email) {
        whereYouHeardAboutUs = "Advertisement";
      }
      // Update user context with the value
      updateUser({ ...user, whereYouHeardAboutUs });
      setTimeout(() => {
        const nextRoute = getNextRoute({ ...user, whereYouHeardAboutUs });
        router.push(nextRoute);
      }, 800);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const OptionItem = ({ icon, label, checked, onChange }) => (
    <button
      onClick={onChange}
      className={`w-full flex items-center border-t-[1px] border-borderColor gap-3 py-3 transition hover:bg-gray-50 ${
        checked ? "bg-gray-50" : ""
      }`}
    >
      {icon && (
        <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
      )}
      <span className="text-black text-sm text-left flex-1">{label}</span>
      <div className={`w-5 h-5 rounded-full border-[1px] flex items-center justify-center ${
        checked ? "border-borderColor" : "border-borderColor"
      }`}>
        {checked && <div className="w-3 h-3 rounded-full bg-borderColor"></div>}
      </div>
    </button>
  );

  const Section = ({ title, children, expanded, onToggle, icon }) => (
    <div className="bg-white mb-4 border border-borderColor rounded-xl shadow-sm font-inter font-normal">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {icon && <Image src={icon} alt="" width={20} height={20} />}
          <span className="text-base text-black">{title}</span>
        </div>
        <Image
          src="/assets/icons/arrow-down.svg"
          alt="Toggle"
          width={16}
          height={16}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-pageBackground py-8 px-4 font-inter">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <CyborgLogo width={120} height={48} />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-medium text-black mb-8">
          How did you hear about us?
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {/* Social Media or Ad */}
        <Section
          title="Social Media or Ad"
          expanded={expanded.socialMediaOrAd}
          onToggle={() => toggleExpand("socialMediaOrAd")}
        >
          <OptionItem
            icon="/assets/icons/tiktok-icon.svg"
            label="TikTok"
            checked={form.socialMediaOrAd.platforms.includes("TikTok")}
            onChange={() => toggleOption("socialMediaOrAd.platforms", "TikTok")}
          />
          <OptionItem
            icon="/assets/icons/instagram.svg"
            label="Instagram"
            checked={form.socialMediaOrAd.platforms.includes("Instagram")}
            onChange={() => toggleOption("socialMediaOrAd.platforms", "Instagram")}
          />
          <OptionItem
            icon="/assets/icons/facebook.svg"
            label="Facebook"
            checked={form.socialMediaOrAd.platforms.includes("Facebook")}
            onChange={() => toggleOption("socialMediaOrAd.platforms", "Facebook")}
          />
          <OptionItem
            icon="/assets/icons/youtube.svg"
            label="YouTube"
            checked={form.socialMediaOrAd.platforms.includes("YouTube")}
            onChange={() => toggleOption("socialMediaOrAd.platforms", "YouTube")}
          />
          <OptionItem
            icon="/assets/icons/linkedin.svg"
            label="LinkedIn"
            checked={form.socialMediaOrAd.platforms.includes("LinkedIn")}
            onChange={() => toggleOption("socialMediaOrAd.platforms", "LinkedIn")}
          />
          <OptionItem
            icon="/assets/icons/ellipsis.svg"
            label="Other"
            checked={form.socialMediaOrAd.platforms.includes("Other")}
            onChange={() => toggleOption("socialMediaOrAd.platforms", "Other")}
          />
        </Section>

        {/* Word of Mouth */}
        <Section
          title="Word of Mouth"
          expanded={expanded.wordOfMouth}
          onToggle={() => toggleExpand("wordOfMouth")}
        >
          <OptionItem
            icon="/assets/icons/user.svg"
            label="Friend"
            checked={form.wordOfMouth.sources.includes("Friend")}
            onChange={() => toggleOption("wordOfMouth.sources", "Friend")}
          />
          <OptionItem
            icon="/assets/icons/user-group.svg"
            label="Family"
            checked={form.wordOfMouth.sources.includes("Family")}
            onChange={() => toggleOption("wordOfMouth.sources", "Family")}
          />
          <OptionItem
            icon="/assets/icons/briefcase.svg"
            label="Colleague"
            checked={form.wordOfMouth.sources.includes("Colleague")}
            onChange={() => toggleOption("wordOfMouth.sources", "Colleague")}
          />
          <OptionItem
            icon="/assets/icons/heart-pulse.svg"
            label="Clinician"
            checked={form.wordOfMouth.sources.includes("Clinician")}
            onChange={() => toggleOption("wordOfMouth.sources", "Clinician")}
          />
          <OptionItem
            icon="/assets/icons/ellipsis.svg"
            label="Other"
            checked={form.wordOfMouth.sources.includes("Other")}
            onChange={() => toggleOption("wordOfMouth.sources", "Other")}
          />
        </Section>

        {/* Podcast */}
        <Section
          title="Podcast"
          expanded={expanded.podcast}
          onToggle={() => toggleExpand("podcast")}
        >
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please tell us more..."
            rows={3}
            value={form.podcast.note}
            onChange={(e) => handleChange("podcast.note", e.target.value)}
          />
        </Section>

        {/* Creator */}
        <Section
          title="Creator"
          expanded={expanded.creator}
          onToggle={() => toggleExpand("creator")}
        >
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please tell us more..."
            rows={3}
            value={form.creator.note}
            onChange={(e) => handleChange("creator.note", e.target.value)}
          />
        </Section>

        {/* Web Search */}
        <Section
          title="Web Search"
          expanded={expanded.webSearch}
          onToggle={() => toggleExpand("webSearch")}
        >
          <OptionItem
            icon="/assets/icons/google.svg"
            label="Google"
            checked={form.webSearch.engines.includes("Google")}
            onChange={() => toggleOption("webSearch.engines", "Google")}
          />
          <OptionItem
            icon="/assets/icons/bing.svg"
            label="Bing"
            checked={form.webSearch.engines.includes("Bing")}
            onChange={() => toggleOption("webSearch.engines", "Bing")}
          />
          <OptionItem
            icon="/assets/icons/ChatGPT-Logo.svg"
            label="ChatGPT"
            checked={form.webSearch.engines.includes("ChatGPT")}
            onChange={() => toggleOption("webSearch.engines", "ChatGPT")}
          />
          <OptionItem
            icon="/assets/icons/perplexity-icon.svg"
            label="Perplexity"
            checked={form.webSearch.engines.includes("Perplexity")}
            onChange={() => toggleOption("webSearch.engines", "Perplexity")}
          />
          <OptionItem
            icon="/assets/icons/claude-icon.svg"
            label="Claude"
            checked={form.webSearch.engines.includes("Claude")}
            onChange={() => toggleOption("webSearch.engines", "Claude")}
          />
          <OptionItem
            icon="/assets/icons/ellipsis.svg"
            label="Other"
            checked={form.webSearch.engines.includes("Other")}
            onChange={() => toggleOption("webSearch.engines", "Other")}
          />
        </Section>

        {/* Email */}
        <Section
          title="Email"
          expanded={expanded.email}
          onToggle={() => toggleExpand("email")}
        >
          <OptionItem
            icon="/assets/icons/envelope.svg"
            label="Newsletter"
            checked={form.email.sources.includes("Newsletter")}
            onChange={() => toggleOption("email.sources", "Newsletter")}
          />
          <OptionItem
            icon="/assets/icons/envelope.svg"
            label="Superpower Journal"
            checked={form.email.sources.includes("Superpower Journal")}
            onChange={() => toggleOption("email.sources", "Superpower Journal")}
          />
          <OptionItem
            icon="/assets/icons/ellipsis.svg"
            label="Other"
            checked={form.email.sources.includes("Other")}
            onChange={() => toggleOption("email.sources", "Other")}
          />
        </Section>

        {/* Next Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition mt-6"
        >
          {loading ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
}
