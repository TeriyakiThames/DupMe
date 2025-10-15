"use client";

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      // Class updates:
      // text-black for visibility
      // cursor-pointer indicates interactivity
      // hover:text-gray-600 adds a subtle visual feedback on hover
      className="text-black text-lg font-normal cursor-pointer hover:text-gray-600 transition-colors"
      aria-label="Go back to previous page"
    >
      &lt; back
    </button>
  );
}