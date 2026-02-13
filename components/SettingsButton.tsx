"use client";

import { useState, useEffect } from "react";

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

// Load saved setting once
useEffect(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("reducedMotion");
    if (saved === "true") setReducedMotion(true);
  }
}, []);

// Apply/remove page-level attribute and save
useEffect(() => {
  if (typeof document !== "undefined") {
    if (reducedMotion) {
      document.documentElement.setAttribute("data-reduced-motion", "true");
    } else {
      document.documentElement.removeAttribute("data-reduced-motion");
    }
    localStorage.setItem("reducedMotion", reducedMotion ? "true" : "false");
  }
}, [reducedMotion]);


  return (
    <div className="relative">
      {/* Button to toggle dropdown */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
          px-3 py-2
          rounded
          bg-neutral-900 text-gray-200
          hover:bg-neutral-800
          transition
          cursor-pointer
        "
      >
        ⚙
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-56
            rounded-md bg-neutral-900 text-gray-200
            shadow-lg border border-neutral-700
            z-50
          "
        >
          <div className="p-3 space-y-2">
            {/* Reduced Motion Toggle as Button */}
            <button
              onClick={() => setReducedMotion((prev) => !prev)}
              className={`
                w-full text-left cursor-pointer px-3 py-2 rounded
                font-medium transition
                ${reducedMotion
                  ? "bg-neutral-900 text-gray-100 hover:bg-neutral-800"
                  : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
                }
              `}
            >
              Reduced Motion: {reducedMotion ? "ON" : "OFF"}
            </button>

            {/* Future settings can go here */}
          </div>
        </div>
      )}
    </div>
  );
}
