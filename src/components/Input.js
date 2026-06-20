import React from "react";

export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="mb-5">
      {label && (
        <label
          htmlFor={name}
          className="block text-secondary font-medium mb-2 text-sm"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-3 border-[1px] border-tertiary rounded-xl focus:outline-none focus:border-primary text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors ${
          error ? "border-red-500 focus:border-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
