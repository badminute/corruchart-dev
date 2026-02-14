import { useState } from "react";

type Props = {
  images: string[];
};

export function WelcomeSlideshow({ images }: Props) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
      
      {/* Image */}
      <img
        src={images[current]}
        alt={`Slideshow step ${current + 1}`}
        className="max-w-full max-h-full object-contain"
      />

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-2 p-2 rounded-full cursor-pointer  bg-neutral-900/80 text-white hover:bg-neutral-800 border border-neutral-700 transition-colors"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={next}
        className="absolute right-2 p-2 cursor-pointer rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 border border-neutral-700 transition-colors"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-bold text-gray-400 uppercase tracking-widest">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}
``
