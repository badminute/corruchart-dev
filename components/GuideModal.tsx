"use client";

import { useState } from "react";
import { WelcomeSlideshow } from "./onboarding";

interface GuideTip {
  title: string;
  images: string[];
}

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  tips: GuideTip[];
  title: string;
  description: string;
  buttonLabel: string;
}

export default function GuideModal({
  isOpen,
  onClose,
  tips,
  title,
  description,
  buttonLabel,
}: GuideModalProps) {
  const [selectedTipIndex, setSelectedTipIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const selectedTip = selectedTipIndex !== null ? tips[selectedTipIndex] : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-4xl h-[650px] shadow-2xl flex flex-col">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-violet-400 mb-4">
          {title}
        </h2>

        {/* Description */}
        <div className="text-gray-400 text-center text-lg mb-4">
          <p>{description}</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex gap-4">
        {selectedTip === null ? (
            /* Tip List View */
            <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5">
                {tips.map((tip, index) => (
                <button
                    key={index}
                    onClick={() => setSelectedTipIndex(index)}
                    className="text-left px-3 py-2 bg-neutral-800 hover:bg-violet-500/30 text-gray-200 hover:text-white rounded-md transition-colors cursor-pointer border border-neutral-700 hover:border-violet-500/50 text-sm leading-snug"
                >
                    <span className="text-violet-400 font-semibold">
                    {index + 1}.
                    </span>{" "}
                    {tip.title}
                </button>
                ))}
            </div>
            </div>
        ) : (
            /* Slideshow View */
            <>
            <div className="flex-1">
                <WelcomeSlideshow images={selectedTip.images} />
            </div>
            </>
        )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          {selectedTip !== null && (
            <button
              onClick={() => setSelectedTipIndex(null)}
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 cursor-pointer text-white font-semibold rounded-xl transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl transition-colors"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
