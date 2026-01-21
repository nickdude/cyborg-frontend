"use client";

import Link from "next/link";

const variantClasses = {
  primary: "bg-primary text-white hover:bg-purple-800",
  secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
  ghost: "bg-transparent text-gray-900 hover:bg-gray-100",
};

const sizeClasses = {
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}) {
  const base = "rounded-xl font-semibold transition shadow-lg flex items-center justify-center";
  const composed = classNames(
    base,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth ? "w-full" : "",
    className
  );

  if (href) {
    return (
      <Link href={href} className={composed} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={composed} {...props}>
      {children}
    </button>
  );
}
