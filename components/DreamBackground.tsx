"use client";

import { useEffect, useState } from "react";
import { OPTIONS } from "@/data/options";

interface DreamBackgroundProps {
    count?: number; // maximum number of floating labels
    addInterval?: number; // ms between adding new labels
}

interface LabelItem {
    id: number;
    text: string;
}

export default function DreamBackground({ count = 250, addInterval = 2000 }: DreamBackgroundProps) {
    const [labels, setLabels] = useState<LabelItem[]>([]);
    const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1920);

    // Update window width on resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Assign a unique id for each label
    let nextId = 0;

    // Add a few new labels periodically
    useEffect(() => {
        const initial = Array.from({ length: Math.min(count, 50) }).map(() => ({
            id: nextId++,
            text: OPTIONS[Math.floor(Math.random() * OPTIONS.length)].label,
        }));
        setLabels(initial);

        const interval = setInterval(() => {
            setLabels(prev => {
                if (prev.length >= count) return prev; // limit total labels
                const newLabel: LabelItem = {
                    id: nextId++,
                    text: OPTIONS[Math.floor(Math.random() * OPTIONS.length)].label,
                };
                return [...prev, newLabel];
            });
        }, addInterval);

        return () => clearInterval(interval);
    }, [count, addInterval]);

    // Compute scale factor relative to a base width (1920px)
    const scaleFactor = Math.max(0.5, Math.min(1, windowWidth / 1920));

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {labels.map(label => {
                const top = Math.random() * 100; // %
                const left = Math.random() * 100; // %
                const size = (12 + Math.random() * 24) * scaleFactor; // responsive px
                const opacity = 0.03 + Math.random() * 0.04; // subtle
                const duration = 40 + Math.random() * 60; // seconds for float
                const delay = Math.random() * -duration; // stagger animation start
                const rotate = Math.random() * 20 - 10; // ±10deg

                // Random fade timings per label
                const fadeDuration = 7 + Math.random() * 7; // slower fade
                const fadeDelay = Math.random() * -fadeDuration;

                return (
                    <div
                        key={label.id}
                        className="absolute text-violet-400 select-none"
                        style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            fontSize: `${size}px`,
                            opacity,
                            transform: `rotate(${rotate}deg)`,
                            animation: `
                                floatSlow ${duration}s linear infinite,
                                fadeDream ${fadeDuration}s ease-in-out infinite alternate
                            `,
                            animationDelay: `${delay}s, ${fadeDelay}s`,
                        }}
                    >
                        {label.text}
                    </div>
                );
            })}

            <style jsx>{`
        @keyframes floatSlow {
          0% { transform: translateY(0) translateX(0) rotate(0deg); }
          50% { transform: translateY(-20px) translateX(10px) rotate(1deg); }
          100% { transform: translateY(0) translateX(0) rotate(0deg); }
        }

        @keyframes fadeDream {
          0% { opacity: 0; }
          50% { opacity: 0.08; }
          100% { opacity: 0; }
        }
      `}</style>
        </div>
    );
}
