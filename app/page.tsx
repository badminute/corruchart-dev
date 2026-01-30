"use client";

import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import { OPTIONS } from "@/data/options";
import DreamBackground from "@/components/DreamBackground";

export default function HomePage() {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    return (
        <>
            {/* ✅ Google Fonts */}
            <Head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="relative min-h-screen bg-[#1F2023] text-violet">
                {/* Dreamlike background floating labels */}
                <div className="absolute inset-0 z-0">
                    <DreamBackground count={40} />
                </div>

                {/* Page content above the background */}
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-8 min-h-screen">
                    {/* HEADER */}
                    <div className="relative inline-block mb-6">
                        <h1 className="text-4xl sm:text-6xl font-bold text-violet-400 drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">
                            Corruchart
                        </h1>

                        <span
                            className="absolute text-sm text-neutral-400 font-medium"
                            style={{
                                top: 0,
                                right: 0,
                                transform: "translate(100%, -40%)",
                                textShadow: "0px 1px 0px rgba(0,0,0,0.6)",
                            }}
                        >
                            v0.23.0
                        </span>
                    </div>

                    {/* INFORMATION */}
                    <p className="text-sm sm:text-md text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
                        Welcome to Corruchart (Corruption Chart). This interactive tool allows you to
                        indicate your sexual interests on a large and sprawling chart to learn more about yourself and/or share with others.
                        There are currently over a thousand interests (
                        <span
                            className={`text-violet-400 font-semibold inline-block transform transition-all animate-text-flicker duration-700 ${animate ? "scale-100 opacity-100" : "scale-75 opacity-0"
                                }`}
                        >
                            {OPTIONS.length}!!
                        </span>
                        ) available for you to weigh on, but to save space and time, interests are not as granular as they could be. To solve this, the results page attempts to be as informative and concise as possible with the responses you give.
                    </p>

                    {/* Disclaimer */}
                    <p className="text-xs sm:text-md text-gray-400 mb-7 sm:mb-9 leading-relaxed max-w-2xl text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)] ">
                        Disclaimer: This tool is designed for fun and educational purposes, NONE of the interests (especially the taboo ones) are endorsed and/or condoned by the creator of this tool. The interests available are interests that real people have (even if you don't believe it). The creator assumes no responsibility for any consequences that arise from the use of this tool. Please exercise discretion when using it and sharing results.
                    </p>

                    {/* START Button */}
                    <Link
                        href="/corruchart"
                        className="
                            relative inline-flex items-center justify-center px-8 py-4 text-xl font-bold text-white
                            bg-gray-400 rounded-sm overflow-hidden
                            drop-shadow-[0_4px_0px_rgba(0,0,0,0.6)]
                            border-3 border-black
                            focus:outline-none
                            w-auto
                            max-w-xs sm:max-w-none
                            before:absolute before:inset-0 before:bg-violet-400 before:translate-x-[-100%] before:transition-transform before:duration-300
                            hover:before:translate-x-0
                        "
                    >
                        <span
                            className="relative z-10 text-black drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] animate-glow"
                            style={{ fontFamily: "'Cinzel', serif", fontWeight: 600 }}
                        >
                            START
                        </span>
                    </Link>
                </div>
            </div>

            {/* 🔹 Custom glow animation */}
            <style jsx>{`
    @keyframes glow {
        0%, 100% { text-shadow: 0 0 5px rgba(139,92,246,0.3); }   /* violet-400 light */
        50% { text-shadow: 0 3 0px rgba(139,92,246,0.7); }       /* violet-400 stronger */
    }
    .animate-glow {
        animation: glow 4.5s ease-in-out infinite alternate;
    }
`}</style>
        </>
    );
}
