"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SocialButton from "@/components/SocialButton";
import { authAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { getNextRoute } from "@/utils/navigationFlow";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Lazily inject the Google Identity Services script and resolve once ready.
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google sign-in is unavailable."));
      return;
    }
    if (window.google?.accounts?.oauth2) {
      resolve(window.google);
      return;
    }

    let script = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", () => {
      if (window.google?.accounts?.oauth2) resolve(window.google);
      else reject(new Error("Failed to initialize Google sign-in."));
    });
    script.addEventListener("error", () => reject(new Error("Failed to load Google sign-in.")));

    if (window.google?.accounts?.oauth2) resolve(window.google);
  });
}

/**
 * Social login button that authenticates with Google and exchanges the profile
 * for a Cyborg session via POST /api/auth/social-login. On success the user is
 * logged in and routed forward, exactly like the email OTP/password flows.
 */
export default function GoogleAuthButton({
  label = "Continue with Google",
  userType = "user",
  onError,
  className = "",
}) {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const tokenClientRef = useRef(null);

  const completeLogin = useCallback(
    async (accessToken) => {
      try {
        // Identity (email + provider id) is verified server-side from the access
        // token — we only fetch the profile here for the display name, which is
        // cosmetic and never trusted for authentication.
        let firstName = "";
        let lastName = "";
        try {
          const profileRes = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (profileRes.ok) {
            const profile = await profileRes.json();
            firstName = profile.given_name || "";
            lastName = profile.family_name || "";
          }
        } catch {
          /* name is optional — the backend derives identity from the token */
        }

        const response = await authAPI.socialLogin({
          provider: "google",
          accessToken,
          firstName,
          lastName,
          userType,
        });

        if (response?.data?.token && response?.data?.user) {
          login(response.data.user, response.data.token);
          router.push(getNextRoute(response.data.user));
        } else {
          throw new Error("Unexpected response from social login.");
        }
      } catch (err) {
        onError?.(err.message || "Google sign-in failed.");
      } finally {
        setLoading(false);
      }
    },
    [login, router, userType, onError]
  );

  const handleClick = useCallback(async () => {
    onError?.("");

    if (!CLIENT_ID) {
      onError?.("Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }

    setLoading(true);
    try {
      const google = await loadGoogleScript();

      if (!tokenClientRef.current) {
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: "openid email profile",
          callback: (resp) => {
            if (resp?.error || !resp?.access_token) {
              setLoading(false);
              onError?.("Google sign-in was cancelled.");
              return;
            }
            completeLogin(resp.access_token);
          },
        });
      }

      tokenClientRef.current.requestAccessToken();
    } catch (err) {
      setLoading(false);
      onError?.(err.message || "Could not start Google sign-in.");
    }
  }, [completeLogin, onError]);

  return (
    <SocialButton
      icon="/assets/icons/google.svg"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? "Connecting…" : label}
    </SocialButton>
  );
}
