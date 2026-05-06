"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

/**
 * GlucoseNotification
 *
 * Alert card for glucose scores.
 * Shows a colored badge, message, and Dismiss / Details buttons.
 *
 * @param {number}   score     - Glucose score value
 * @param {string}   message   - Alert message text
 * @param {string}   type      - "positive" | "negative"
 * @param {string}   date      - Date string (YYYY-MM-DD) for the day review link
 * @param {function} onDismiss - Called when user dismisses
 */
export default function GlucoseNotification({ score, message, type, date, onDismiss }) {
  const router = useRouter();

  const isNegative = type === "negative";
  const badgeBg = isNegative ? "bg-red-100" : "bg-green-100";
  const badgeText = isNegative ? "text-red-600" : "text-green-600";
  const borderColor = isNegative ? "border-red-200" : "border-green-200";
  const Icon = isNegative ? AlertTriangle : CheckCircle;

  const handleDetails = () => {
    if (date) {
      router.push(`/glucose/review/${date}`);
    }
  };

  return (
    <div
      className={`relative rounded-2xl border ${borderColor} bg-white p-4 shadow-sm`}
    >
      {/* Top row: badge + dismiss */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${badgeBg}`}
          >
            <Icon size={16} className={badgeText} />
          </div>
          {score != null && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeBg} ${badgeText}`}
            >
              {score}/10
            </span>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6d6f7b] hover:bg-[#f6f7fb]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Message */}
      <p className="mt-3 text-sm leading-relaxed text-[#14151a]">
        {message || "Glucose event detected."}
      </p>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-borderColor px-4 py-2 text-xs font-medium text-[#6d6f7b] transition hover:bg-[#f6f7fb]"
          >
            Dismiss
          </button>
        )}
        {date && (
          <button
            type="button"
            onClick={handleDetails}
            className="rounded-xl bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-black/85"
          >
            Details
          </button>
        )}
      </div>
    </div>
  );
}
