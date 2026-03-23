import { LucideProps } from "lucide-react";

export const SaoJoseIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Head */}
    <circle cx="10" cy="5" r="3" />
    {/* Body/Robe Silhouette */}
    <path d="M10 8c-2.5 0-4 2-4 5v8h8v-8c0-3-1.5-5-4-5z" />
    {/* Staff (Cajado) */}
    <path d="M18 4v17" />
    {/* Lily Detail (Simplified) */}
    <path d="M16 6l2-2 2 2" />
  </svg>
);
