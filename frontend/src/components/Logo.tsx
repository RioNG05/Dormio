"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface LogoProps {
  /**
   * Target destination URL when clicked. Defaults to root homepage ("/")
   */
  href?: string;
  /**
   * Additional classes for the wrapping Link element
   */
  className?: string;
  /**
   * Additional classes for the logo Image element
   */
  imageClassName?: string;
  /**
   * Preset sizing variant
   * - sm: h-7
   * - md: h-8 md:h-9 (default)
   * - lg: h-9 md:h-10
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to prioritize image loading (defaults to true for above-the-fold logos)
   */
  priority?: boolean;
}

export default function Logo({
  href = "/",
  className = "",
  imageClassName = "",
  size = "md",
  priority = true,
}: LogoProps) {
  const sizeClasses = {
    sm: "h-7 w-auto",
    md: "h-8 md:h-9 w-auto",
    lg: "h-9 md:h-10 w-auto",
  };

  return (
    <Link
      href={href}
      className={`inline-flex items-center group cursor-pointer select-none transition-transform duration-200 active:scale-[0.98] ${className}`}
      aria-label="Dormio Homepage"
    >
      <Image
        src="/full-logo.png"
        alt="Dormio Logo"
        width={1393}
        height={350}
        priority={priority}
        className={`object-contain block ${imageClassName || sizeClasses[size]}`}
      />
    </Link>
  );
}

export { Logo };
