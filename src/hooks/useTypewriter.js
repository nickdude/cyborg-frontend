"use client";
import { useEffect, useRef, useState } from "react";

const CHARS_PER_SECOND = 80;
const MS_PER_CHAR = 1000 / CHARS_PER_SECOND;

export function useTypewriter(fullText, active) {
  const [displayed, setDisplayed] = useState(active ? "" : fullText);
  const indexRef = useRef(active ? 0 : fullText.length);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!active) {
      indexRef.current = fullText.length;
      setDisplayed(fullText);
      return;
    }

    const step = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsed = timestamp - lastTimeRef.current;
      const charsToAdd = Math.floor(elapsed / MS_PER_CHAR);

      if (charsToAdd > 0 && indexRef.current < fullText.length) {
        indexRef.current = Math.min(
          indexRef.current + charsToAdd,
          fullText.length
        );
        setDisplayed(fullText.slice(0, indexRef.current));
        lastTimeRef.current = timestamp;
      }

      if (indexRef.current < fullText.length) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fullText, active]);

  return displayed;
}
