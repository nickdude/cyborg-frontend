"use client";

import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** vertical offset to animate from (px) */
  y?: number;
  /** stagger delay (s) */
  delay?: number;
  /** render as which element */
  as?: "div" | "section" | "li" | "span";
  once?: boolean;
};

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Fade + slide-up on scroll-into-view. Used to give every section the superpower reveal feel. */
export function Reveal({
  children,
  className,
  y = 28,
  delay = 0,
  as = "div",
  once = true,
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, delay, ease: easeOut }}
    >
      {children}
    </MotionTag>
  );
}

/** Container that staggers its <Reveal>-like children via index-based delay. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};
