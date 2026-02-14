import { useState } from "react";

export function WelcomeSlideshow({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);

  // If there are no images, don't render anything
  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-56 bg-black/20 rounded border border-neutral-800 overflow-hidden my-4 group">
      <img 
        src={images[current]} 
        alt={`Slideshow step ${current + 1}`} 
        className="w-full h-full object-contain"
      />
      
      <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={prev}
                className="p-2 rounded cursor-pointer bg-neutral-900/80 text-white hover:bg-neutral-800 border border-neutral-700 transition-colors"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={next}
                className="p-2 rounded cursor-pointer bg-neutral-900/80 text-white hover:bg-neutral-800 border border-neutral-700 transition-colors"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

      <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 rounded text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}