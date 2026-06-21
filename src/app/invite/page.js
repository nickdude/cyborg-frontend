"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { productAPI } from "@/services/api";

const HOW_IT_WORKS = [
  {
    title: "Share your unique link",
    description:
      "Invite your friends to join Cyborg using your unique referral link.",
  },
  {
    title: "Give $50 to your friends",
    description:
      "When your friends join Cyborg, they get $50 to spend in the Cyborg Supplement Marketplace.",
  },
  {
    title: "Earn $50 in credit",
    description:
      "You'll also receive $50 for every friend who signs up with your link.",
  },
  {
    title: "Redeem your credits",
    description: "Use your credits in the Cyborg Supplement Marketplace.",
  },
];

const FAQS = [
  {
    question: "When do I get my reward?",
    answer:
      "Your $50 credit is applied to your account as soon as your friend signs up with your referral link and completes their first order.",
  },
  {
    question: "How do I use the credit?",
    answer:
      "Your credits are automatically available at checkout in the Cyborg Supplement Marketplace and applied to your order total.",
  },
  {
    question: "Who's eligible?",
    answer:
      "Anyone with a Cyborg account can share their referral link. Friends who are new to Cyborg and sign up with your link qualify for the reward.",
  },
];

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function StepIcon({ index }) {
  const icons = [
    // Share link
    <>
      <path d="M4 4h16v16H4z" opacity="0" />
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </>,
    // Dollar
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5a2.5 2.5 0 0 1 2.5-2 2 2 0 0 1 0 4 2 2 0 0 0 0 4 2.5 2.5 0 0 1-2.5-2" />
    </>,
    // User / earn
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </>,
    // Redeem / calendar-gift
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>,
  ];
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[index] || icons[0]}
    </svg>
  );
}

export default function InvitePage() {
  const { user } = useAuth();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Real products from OUR marketplace (never superpower's hardcoded list).
  useEffect(() => {
    let active = true;
    productAPI
      .getProducts({ limit: 8 })
      .then((res) => {
        const items = res?.data?.items || res?.items || [];
        if (active) setProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const productNames = useMemo(
    () => products.map((p) => p.name || p.title).filter(Boolean),
    [products],
  );
  const heroNames = productNames.slice(0, 4);
  const rewardItems = products.slice(0, 4);

  const userId = user?.id || user?._id || "";

  // Real referral link generated from the logged-in user id.
  const referralLink = useMemo(() => {
    const base = origin || "";
    if (!base) return "";
    return userId ? `${base}/register?ref=${userId}` : `${base}/register`;
  }, [origin, userId]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      // Fallback for browsers without clipboard API access
      const el = document.createElement("textarea");
      el.value = referralLink;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        /* no-op */
      }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!email || !referralLink) return;
    const subject = encodeURIComponent("Join me on Cyborg");
    const body = encodeURIComponent(
      `Hey! I'm using Cyborg and thought you'd love it too. Sign up with my link and we'll each get $50 to spend in the Cyborg Supplement Marketplace:\n\n${referralLink}`
    );
    if (typeof window !== "undefined") {
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 2500);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-pageBackground font-inter">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 text-white">
        <div className="mx-auto w-full max-w-5xl px-5 pt-12 pb-24 sm:pt-16 sm:pb-28">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Refer your friends
          </h1>
          <p className="mt-1 text-xl font-light text-white/90 sm:text-2xl">
            Earn rewards on supplements
          </p>

          {heroNames.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {heroNames.map((name) => (
                <div
                  key={name}
                  className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/15"
                >
                  <p className="text-sm font-medium">{name}</p>
                  <div className="mt-6 flex h-20 items-center justify-center rounded-xl bg-white/10">
                    <div className="h-14 w-7 rounded-md bg-white/30" aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content card */}
      <div className="relative z-10 -mt-12 rounded-t-3xl bg-white">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-12">
          {/* Referral block */}
          <h2 className="text-xl font-semibold text-black sm:text-2xl">
            Refer your friends and earn $50
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            Share your unique referral link with friends and family. When they
            sign up, you&apos;ll each receive $50 to spend in the Cyborg
            Supplement Marketplace.
          </p>

          {/* Referral link + copy */}
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-borderColor p-3 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 truncate px-2 text-sm text-blue">
              {referralLink || "Generating your link…"}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!referralLink}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{copied ? "Copied!" : "Copy Link"}</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-borderColor" />
            <span className="text-xs text-secondary">or invite via email</span>
            <span className="h-px flex-1 bg-borderColor" />
          </div>

          {/* Email invite */}
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your friend's email"
              className="min-w-0 flex-1 rounded-xl border border-borderColor px-4 py-3 text-sm text-black placeholder:text-secondary focus:border-blue focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-900"
            >
              {emailSent ? "Sent" : "Invite"}
              <ShareIcon />
            </button>
          </form>

          {/* How it works */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-black sm:text-xl">
              How it works
            </h3>
            <ul className="mt-5 space-y-6">
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borderColor text-orange-500">
                    <StepIcon index={i} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Turn your credits into results */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-black sm:text-xl">
              Turn your credits into results
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Shop recommendations from our marketplace
            </p>

            {rewardItems.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-borderColor">
                {rewardItems.map((product, i) => {
                  const pname = product.name || product.title || "Product";
                  return (
                    <div
                      key={product._id || product.id || pname}
                      className={`flex items-center gap-4 px-4 py-4 ${i !== 0 ? "border-t border-borderColor" : ""}`}
                    >
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-pageBackground" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-black">{pname}</p>
                        <p className="mt-0.5 text-xs text-secondary">
                          {product.brand ? `${product.brand} · ` : ""}Redeem your $50 credit toward this
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Link
                href="/market-place"
                className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-900"
              >
                Explore all products
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-12">
            <h3 className="text-lg font-semibold text-black sm:text-xl">
              FAQ&apos;s
            </h3>
            <div className="mt-4 divide-y divide-borderColor border-t border-borderColor">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between py-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-medium text-black">
                        {faq.question}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`shrink-0 text-secondary transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isOpen && (
                      <p className="pb-4 text-sm text-secondary">{faq.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
