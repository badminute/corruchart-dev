"use client";

import React, { useState } from "react";

interface ChangelogFeedbackModalProps {
  showChangelog: boolean;
  setShowChangelog: (show: boolean) => void;
  onFeedbackSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  hasNewUpdate?: boolean;
  setHasNewUpdate?: (show: boolean) => void;
  isTestMode?: boolean;
}

export default function ChangelogFeedbackModal({
  showChangelog,
  setShowChangelog,
  onFeedbackSubmit,
  hasNewUpdate,
  setHasNewUpdate,
  isTestMode = false,
}: ChangelogFeedbackModalProps) {

  // ✅ ONLY state you need
  const [view, setView] = useState<"log" | "feedback">("log");

  const handleFeedbackSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (onFeedbackSubmit) {
      onFeedbackSubmit(event);
    } else {
      event.preventDefault();
    }
  };

  if (!showChangelog) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-6xl h-[650px] shadow-2xl flex flex-row gap-6">

          <div className="flex-1 flex flex-col">
            <h2 className="text-2xl font-bold text-center text-violet-400 mb-4">
              Changelog
            </h2>

            <div className="text-gray-400 text-center text-lg mb-4">
              <p>Recent changes, additions, and improvements.</p>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-gray-300">

             {view === "log" ? (
                <>
                    {/* 🔽 CHANGELOG CONTENT 🔽 */}
                <h3 className="text-lg font-semibold text-white">
                    v0.34.1 — Polishing Descriptions  
                </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Polished about 80% of the descriptions.</li>
                  </ul>
                <h3 className="text-lg font-semibold text-white">
                    v0.34.0 — <b>MASSIVE</b>: The Sets Update  
                </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added a new highly organized mode where you can engage with interests in carefully chiseled sets (by yours truly) instead of the now sprawling (and increasingly intimidating) chart. This should make suggestions a lot easier to spark so let me know what sets you'd like to see and what might be missing on any particular set.</li>
                    <li>Added these roles: Looner (NP) and Looner (B2P)!</li>
                    <li>Several QOL updates: the NEW! filter is now variantless, the feedback modal is now nested, the chart maintains an alphabetical order, import no longer has a limit due to URL sillyness, a sizeable tag update, and more!</li>
                    <li>I granulated a dozen or so interests, all of which will be in the NEW filter but not mentioned below.</li>
                    <li>Added these interests: Alpha Couple Dynamic, Auto Thighjobs, Bar Theme, Barbed Cocks, Buried Genitals, Beta Humiliation, Body Exploration, Bra Sniffing, Brutal Raceplay, BWCs, Clicker Training, Crate Training, Death Feederism, Death Feederism (Receiving), Discipline, Dommebreaking, Extreme Musk, Extreme Pregnancies, Flaccid Play, Food Tasks, Foreskin Worship, FUPAs, Hands-Free Orgasms, Touch-Free Orgasms, Hebephilia, Height Humiliation, Husband Humiliation, High Protocol, Instant Hookups, Immobilization (Weight), Lewd ASMR, Laboratory Theme, Locker Room Theme, Long Fingernails, Long Toenails, Looning (B2P), Looning (NP), Mating Press, Mursuits, Nightclub Theme, Oiled Asses, Oiled Chests, Oiled Tits, Oiled Pecs, Oiled Feet, Onomatopoeia, Ouji, Pregnancy Risk, Pregnant Bellies, Prehensile Cocks, Premature Humiliation, Queefing, Sexual Exhaustion, Sharp Teeth, Soft Raceplay, Submissive Tasks, Tantric Sex, Testicle Churning, Weight Humiliation, and Wife Humiliation!</li>
                  </ul>
                <h3 className="text-lg font-semibold text-white">
                    v0.33.1 — The Batch Update 2
                  
                </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added these interests: Animal on Human Vore, Armor, Artificial Intelligences, Artistic Displays, Bikini Armor, Blandification, Blindness, Bubble Censorship, Bubble Encasement, Clothing Transformation, Clownification, Cock Rings, Corsetting, Cum Transformation, Deafness, Digital Manipulation, Dildo Riding, Excessive Kiss Marks, Extreme Corsetting, Frilly Armor, Genital Modifications, Hoop Transformation, Human on Animal Vore, Liquid Latex, Mascot Costumes, Mob Face, Mutual Chastity Play, NPCification, Ojou-sama, Omnipotence, Para-skirting, Plant Monstergirls, Plushification, Puppeteering, Purification, Queenification, Quicksand, Reverse Spitroasting, Sexual Ballet, Sexual Gameplay Mechanics, Sexual Pranks, Soft Material Play, Teleportation, Testicle Cuffs, Toon Force, Toonification, Ugly Gentlemen, and Whipped Cream!</li>
                    <li>Added these roles: Keyholder and Locked!</li>
                    <li>Variant swapping can skip unavailable variants now, and shows what is being blocked and by what. This should lube up variant swapping.</li>
                    <li>Reset all now has a grey star next to it and swap all can be cycled with left and right click.</li>
                  </ul>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.33.0 — Results Sharing 2
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Exported image results now use steganography as a reliable fallback when the metadata is scrubbed.</li>
                    <li>JSON and CSV can now be exported and imported.</li>
                    <li>Added these interests: ANWO, Asian Domination (Riced), Aspie Gooning, Auto-cannibalism, Auto-vore, Big Cocks, Black Domination (Blacked), Bloated Bellies, Cringemoji, Digestion Noises, Erectile Dysfunction, Excessive Precum, Forced Masculinization, Healdomming, Indigestion, Isekai Theme, Kuudere, Latino Domination (Bronzed), Leg Humping, LNWO, Mass Vore, Object Vore, Oneshota, Pole Dancing, Pretending It's Straight, Sexual Worsening, Small Cocks, Small Penis Appreciation, Table Humping, Tooning, Twerking Sex, White Domination (Bleached), and WWO!</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.32.0 — QOL Update 2
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>The indifferent/unset filter actually helps now.</li>
                    <li>Added a reverse color cycling toggle and scroll cycling toggle to the settings menu.</li>
                    <li>Added a new SET ALL VISIBLE TO cycle to RESET ALL interests regardless of filter.</li>
                  </ul>
                </div> 

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.31.0 — Results Sharing
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Results are now stored in the metadata of the exported image. This image file can be imported on the Results page to give you interactive results. All information and redactions within the image metadata are secured using AES-GCM encryption, with XOR encryption as a fallback. Here's hoping that platforms don't scrub the metadata of shared image files.</li>
                    <li>Added a feedback button to the changelog modal on the chart page itself.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.30.0 — QOL Update 1
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added these interests: Amateur Porn, Autofootjobs (Pussies), Autofootjobs (Cocks), Bratty Domination, Chasers, Chasing, Dykebreaking, Fat Femboys, Flat Thighs, Foot Fucking, Futanari Facefucking, Futanari Facesitting, Grossdom, Hyper Nipples, Karate Gi, Ladypots, Litter Pregnancies, Living Clothes, Male Omorashi, Manure, Milking Table, Monster Pregnancies, Muscular Thighs, Mutual Weight Gain, OTK Spanking, Overfull Balls, Pro-Amateur Porn, Professional Porn, Sloppy Blowjobs, Sloppy Blowjobs (Receiving), Soft Thighs, Tentaclothes, TERFbreaking, Through The Clothes, TNWO, and Twerking!</li>
                    <li>Number of variants are shown next to each interest.</li>
                    <li>A new star to indicate maybe/interested.</li>
                    <li>A warning is now shown when applied filter is preventing variants from being swapped.</li>
                    <li>A filter for newly added interests so you can easily weigh on new additions instead of having to look for them.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.29.8 — The Futa Update
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added these futa interests: Casual Erections (Futa), Centaur Futas, Embarrassed Nude Futa, Futa Autopaizuri, Futa Cock Comparison, Futa Daddies, Futa Doms, Futa Heat Transformation, Futa Masturbation Desperation, Futa Mommies, Futa NTR, Futa Pregnancies, Futa Rape, Futa Sex Toys, Futa Shame Transformation, Futa Subs, Futa Underwear Transformation, Futa Virus, Hyper Futas, Loli Futas, Magic Onaholes, Male Futas, Masturbation Desperation, Masturbation (Futa), Needy Futas, Small Futas, and Werefutas!</li>
                    <li>Added 'receiving' versions to these: Assjobs, Ballbusting, Blowjobs, and Deepthroat.</li>
                    <li>Added these interests: Adult Comics, Adult Games, Animal Ears, Animated Porn, Auctioning, Autofootjobs, Casual Erections, Clothed Female Nude Female, Cock Births, Cock Comparison, Deepthroating, Denim, Needy Girls, Needy Guys, Pelvic Curtain Dresses, Polynesian Sex, Self Impregnation, Stuck In A Floor, Stuck In A Wall, Womb Tattoo (Arousal), and Womb Tattoo (Curse)!</li>
                    <li>Adjusted the corruption score thresholds to account for score inflation.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.29.7 — The Batch Update
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added these interests: Alien Impregnation, Anal Birthing, Aphrodisiac Spores, Bodily Fluids Into Food/Drinks, Bodily Fluids Into Food/Drinks (NC), Brain Fucking, Budding Breasts, Cigarette Burns, Clothes Theft, Cockroaches, Doll Anatomy, Ear Fucking (Pleasure), Ear Fucking (Gore), Ear Whispers & Blowing, Eyesocket Fucking, Face Play & Distortion, Femdom (Brutal), Finger Lacing, Finger-Toe Lacing, Foot Gagging, Forced Detransition, Fractionation Hypnosis, Frilly Clothing, Gothic Lolita, Heterochromia, Hothusbanding, Human Ashtray, Human Incubator, Hypnotic Eyes, Loli Pregnancies, Mastectomy, Nipple Births, Nudism, Nullification, Ovary Removal, Penis Flies, Piss Drinking, Plant Vore, Pre-Trans Selfcest, Split Tongues, Stomach Growling, Stranded Island Theme, Throat Impregnation, and Toe Lacing!</li>
                    <li>Added these censorship interests: Humiliation Censorship (Cocks), Humiliation Censorship (General), Humiliation Censorship (Silhouettes & Bars), and Humiliation Censorship (Text & Symbols)</li>
                    <li>Added these macrophilia interests: Giant (Unaware), Giant (Cruel), Giant (Gentle), and Giant (Growth)</li>
                    <li>Added various 'receiving' versions of acts.</li>
                    <li>Added these roles: Tiny, Princess, Sugar Baby, Nudist, and Giantess</li>
                    <li>Cleaned up Macrophilia tag.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.29.6 — The Incest Update
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added these interests: Younger Brother x Older Sister Incest, Younger Sister x Older Brother Incest, Second Cousin Incest, Same Sex Incest, Same Age Incest, Half Sibling Incest, Full Blooded Incest, Age Gaps (Siblings), and Stranded Island Incest!</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.29.5 — The Men's Update
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added these interests: Slim Pecs, Jacked Pecs, Shelf Pecs, Soft Pecs, Princes, Bifauxnen, Bishounen, Bishie Princes, Chest Scars, Clothed Male Nude Male, Embarrassed Nude Male, Femboy Pregancies, Genderbend Servitude, Blueberry Boys, Shota Pregnancies, T-Dick Pumping, Magical Boys, Maledom (Brutal), and Distressed Dudes!</li>
                    <li>Added a Colorblind Mode in Options.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.29.4 — The Poop Update
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added a Poop tag!</li>
                    <li>Added these interests: Coprophagia, Fecal Transfer, Hyperscat, Hypermess, Scat Smearing, Scat Cooking, Candy Scat, Soiling, Messing, Septic Tanks, and Scat Sex!</li>
                    <li>A new colourscheme for forbidden corruption reached.</li>
                    <li>Increased corruption amounts for several interests.</li>
                  </ul>
                </div>        

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.29.3 — The Changelog Update
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added a changelog, expect plenty of new things to show here!</li>
                    <li>Added these interests: Pillow Humping, Gumjobs, and Wide Tongues.</li>
                    <li>Separated BBW/BHM, SSBW/SSBHM</li>
                    <li>Description and label chiseling.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.29.2
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Added a legend for tag affinities.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    v0.29.1
                  </h3>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Little bits and bobs of chiseling.</li>
                  </ul>
                </div>

                    <div>
                    <h3 className="text-lg font-semibold text-white">
                        v0.29.0
                    </h3>
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li>Added a search button for tag affinities.</li>
                    </ul>
                    </div>

                    {/* ADD ALL OTHER CHANGELOG ITEMS ABOVE LIKE THIS */}
                </>
                ) : (
                <>
                  <h3 className="text-lg font-bold text-violet-400 mb-4">
                    Send Feedback
                  </h3>

                  <form
                    id="feedbackForm"
                    onSubmit={handleFeedbackSubmit}
                    action="https://formsubmit.co/badminute@protonmail.com"
                    method="POST"
                    className="flex flex-col gap-2"
                  >
                    <input
                      type="hidden"
                      name="_subject"
                      value={`Corruchart ${isTestMode ? "Sets Mode " : ""}Feedback - ${new Date().toLocaleDateString()}`}
                    />
                    <input type="hidden" name="_captcha" value="false" />
                    <input type="hidden" name="_template" value="table" />

                    <input
                      type="text"
                      name="name"
                      placeholder="Nickname"
                      className="px-2 py-1 rounded text-white bg-neutral-800 text-sm"
                      required
                    />

                    <input
                      type="email"
                      name="email"
                      placeholder="Email (Possibly Get a Reply)"
                      className="px-2 py-1 rounded text-white bg-neutral-800 text-sm"
                    />

                    <input type="text" name="honeypot" style={{ display: "none" }} />

                    <textarea
                      name="message"
                      placeholder={
                        isTestMode
                          ? "Your (suggestions, typos, improvements, ideas, kisses, etc.)"
                          : "Your feedback (suggestions, typos, improvements, ideas, kisses, etc.)"
                      }
                      className="px-2 py-1 rounded text-white bg-neutral-800 text-sm resize-y min-h-[20rem] max-h-96 overflow-y-auto"
                      required
                    />
                  </form>
                </>
              )}
            </div>

            {/* BOTTOM BUTTONS */}
            <div className="flex gap-2 mt-4">

              {view === "log" ? (
                <button
                  onClick={() => setView("feedback")}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl"
                >
                  Give Feedback
                </button>
              ) : (
                <button
                  onClick={() => setView("log")}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl"
                >
                  Back to Changelog
                </button>
              )}

              <button
                onClick={() => {
                  setView("log");
                  setShowChangelog(false);
                }}
                className="flex-1 py-3 bg-neutral-800 hover:bg-violet-500/30 cursor-pointer text-white font-semibold rounded-xl"
              >
                CLOSE
              </button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}