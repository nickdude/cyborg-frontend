import React from "react";
import Image from "next/image";

export default function SocialButton({
  children,
  icon,
  onClick,
  disabled = false,
  fullWidth = true,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-3 border-[1px] border-tertiary rounded-xl font-semibold text-blue hover:bg-gray-50 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {icon && (
        <Image src={icon} alt="Icon" width={20} height={20} />
      )}
      {children}
    </button>
  );
}
