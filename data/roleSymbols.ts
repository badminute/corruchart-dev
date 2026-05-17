// app/data/roleSymbols.ts
export const ROLE_SYMBOLS: Record<string, { symbol: string; color?: string }> = {
        // SEX ROLES
    "top": { symbol: "▲", color: "#ff9933" },   // Top (Giver)
    "bottom": { symbol: "▼", color: "#3ac3fa" },   // Bottom (Receiver)
    "versatile": { symbol: "⬢", color: "#a64dff" },   // Versatile (Giver and Receiver)


        // DOMINATION AND SUBMISSION
    "dominant": { symbol: "⛓", color: "#ff9933" },   // Dominant
    "submissive": { symbol: "☍", color: "#66ccff" },   // Submissive
    "switch": { symbol: "⇄", color: "#cc99ff" },   // Switch
    "sadist": { symbol: "⇝", color: "#dd4620" },   // Sadist
    "masochist": { symbol: "✧", color: "#3ac3fa" },   // Masochist
    "sadomasochist": { symbol: "🎭", color: "#33ff7e" },   // Sadomasochist
    "brat": { symbol: "🥺", color: "#fac856" },  // Brat
    "brat-tamer": { symbol: "💢", color: "#e64630" },  // Brat Tamer
    "pet": { symbol: "🐶", color: "#ba955d" },  // Pet
    "pet-owner": { symbol: "🐕‍🦺", color: "#56afe6" },  // Pet Owner
    "paypig": { symbol: "🏧", color: "#74b5fb" },  // Paypig
    "findom": { symbol: "🧾", color: "#d9d9d9" },  // Findom
    "slave": { symbol: "⛓️", color: "#e74b25" },  // Slave
    "master": { symbol: "🔑", color: "#ffd700" },  // Master
    "pig": { symbol: "🐷", color: "#FF8687" },  // Pig
    "mommy": { symbol: "👩‍🍼", color: "#cc4d2d" },  // Mommy
    "daddy": { symbol: "👨‍🍼", color: "#cc4d2d" },  // Daddy
    "little": { symbol: "🌸", color: "#f290e3" },  // Little
    "rope-bunny": { symbol: "🧶", color: "#5993f0" },   // Rope Bunny
    "rope-top": { symbol: "🪢", color: "#3381ff" },   // Rope Top
    "service-top": { symbol: "▲", color: "#ffcc66" },   // Service Top
    "service-dom": { symbol: "▼", color: "#ff6600" },   // Service Dom
    "degrader": { symbol: "▼", color: "#ff6600" },   // Degrader
    "degradee": { symbol: "▲", color: "#66ccff" },   // Degradee
    "sensation-junkie": { symbol: "⚡", color: "#fb6f1e" },   // Sensation Junkie
    "doctor": { symbol: "⚕️", color: "#66ccff" },   // Doctor
    "patient": { symbol: "🛌", color: "#fbbb7b" },   // Patient
    "predator-primal": { symbol: "🦖", color: "#45d562" },   // Predator (Primal)
    "prey-primal": { symbol: "🐁", color: "#cacaca" },   // Prey (Primal)
    "abductor": { symbol: "🛸", color: "#ecc432" },   // Abductor
    "abductee": { symbol: "🧍", color: "#e8b041" },   // Abductee
    "sadistic-caregiver": { symbol: "🩹", color: "#fdda8d" },   // Sadistic Caregiver
    "prisoner": { symbol: "⛓️", color: "#aaaaaa" },   // Prisoner
    "captor": { symbol: "👤", color: "#6B438B" },   // Captor
    "furniture": { symbol: "🙇", color: "#e8b041" },   // Furniture
    "goddess": { symbol: "♛", color: "#ffcc66" },   // Goddess
    "god": { symbol: "♛", color: "#ffcc66" },   // God
    "pony": { symbol: "🪅", color: "#b06bec" },   // Pony
    "feedee": { symbol: "🦃", color: "#885d45" },   // Feedee
    "feeder": { symbol: "🧑‍🍳", color: "#da3e3e" },   // Feeder
    "nudist": { symbol: "🦵🏼", color: "#dbc292" },   // Nudist
    "looner-b2p": { symbol: "🎈", color: "#f35555" },   // Nudist
    "looner-np": { symbol: "🎈", color: "#f35555" },   // Nudist
    "tiny": { symbol: "🧍", color: "#eca35e" },   // Tiny
    "giantess": { symbol: "🧍‍♀️", color: "#8e5abb" },   // Giantess
    "giant": { symbol: "🧍‍♂️", color: "#92c774" },   // Giant
    "sugar-baby": { symbol: "🐥", color: "#f5d671" },   // Sugar Baby
    "prince": { symbol: "🤴", color: "#f7cf4d" },   // Prince
    "prince-dominant": { symbol: "🤴", color: "#f7cf4d" },   // Prince (Dominant)
    "princess": { symbol: "👸", color: "#f7cf4d" },   // Princess
    "princess-dominant": { symbol: "👸", color: "#f7cf4d" },   // Princess (Dominant)
    "keyholder": { symbol: "🔑", color: "#f7cf4d" },   // Keyholder
    "locked": { symbol: "🔒", color: "#f7cf4d" },   // Locked

        // GENDER EXPRESSION
    "androgynous-gender-exp": { symbol: "⚧", color: "#a578ce" },  // Androgynous
    "masculine-gender-exp": { symbol: "♂", color: "#61a8ee" },   // Masculine
    "feminine-gender-exp": { symbol: "♀", color: "#d792d7" },   // Feminine


        // GENDERS
    "male": { symbol: "♂", color: "#3399ff" },   // Male
    "female": { symbol: "♀", color: "#c855a2" },   // Female
    "intersex": { symbol: "⚥", color: "#cc99ff" },   // Intersex
    "man-cisgender": { symbol: "♂", color: "#61a8ee" },   // Man (Cisgender)
    "woman-cisgender": { symbol: "♀", color: "#d792d7" },   // Woman (Cisgender)
    "man-transgender": { symbol: "TRANS_FLAG" },
    "woman-transgender": { symbol: "TRANS_FLAG" },
    "non-binary-transgender": { symbol: "NONBINARY_FLAG" },
    "non-binary-man-transgender": { symbol: "NONBINARY_FLAG" },
    "non-binary-woman-transgender": { symbol: "NONBINARY_FLAG" },
    "agender-transgender": { symbol: "TRANS_FLAG" },
    "genderfluid-transgender": { symbol: "TRANS_FLAG" },
    "bigender-transgender": { symbol: "TRANS_FLAG" },
    "two-spirit-transgender": { symbol: "TRANS_FLAG" },


        // SEXUAL ORIENTATIONS
    "straight": { symbol: "⚤", color: "#c2c2c2" },   // Heterosexual (Straight)
    "gay": { symbol: "GAY_FLAG" },
    "lesbian": { symbol: "LESBIAN_FLAG" },
    "bisexual": { symbol: "BI_FLAG" },
    "pansexual": { symbol: "PAN_FLAG" },
    "asexual": { symbol: "ACE_FLAG" },
    "aromantic": { symbol: "ARO_FLAG" },
    "demisexual": { symbol: "DEMI_FLAG" },


    
        // EROTIC NOVELS READ
    "50-shades": { symbol: "📖", color: "#959595" },   // 50 Shades (1-15 Read)
    "milking-minotaurs": { symbol: "🐂", color: "#86675a" },   // Milking Minotaurs (15-50 Read)
    "smut-sommelier": { symbol: "🍷", color: "#eb6584" },   // Smut Sommelier (51-100 Read)
    "erotica-expert": { symbol: "🍹", color: "#fcaf74" },   // Erotica Expert (101-200 Read)
    "smut-librarian": { symbol: "🏫", color: "#e3cd7d" },   // Smut Librarian (201+ Read)


        // HENTAI DOUJINSHI READ
    "nhentai-tourist": { symbol: "🗾", color: "#65cb7e" },   // Nhentai Tourist (1-50 Read)
    "177013-initiate": { symbol: "👀", color: "#bebebe" },   // 177013 Initiate (51-150 Read)
    "has-favourites": { symbol: "🖼️", color: "#89ca73" },   // Has Favourites (151-400 Read)
    "for-the-plot": { symbol: "🐻‍❄️", color: "#cac8c9" },   // ExHentai Explorer (401-800 Read)
    "rereader": { symbol: "📕", color: "#e66198" },   // Rereader (801-1,500 Read)
    "sad-panda": { symbol: "🐼", color: "#c4ccce" },   // Sad Panda (1,501+ Read)


        // HENTAI ANIME WATCHED
    "tentacle": { symbol: "🐙", color: "#ea7f54" },   // Seen a Tentacle (1-25 Watched)
    "deflowered": { symbol: "🌸", color: "#e7a5e7" },   // Deflowered (26-75 Watched)
    "kuroinu": { symbol: "🧝🏽‍♀️", color: "#975ba3" },   // Kuroinu (76-150 Watched)
    "get-pregnant": { symbol: "🤰", color: "#51b4e6" },   // Get Pregnant (151-300 Watched)
    "mind-broken": { symbol: "😵‍💫", color: "#f3ae47" },   // Mind Broken (301-600 Watched)
    "watched-everything": { symbol: "🚫", color: "#aeaeae" },   // Watched Everythig (601+ Watched)


        // HENTAI GAMES PLAYED
    "meet-n-fuck-racer": { symbol: "👯", color: "#fde19f" },   // Meet'N'Fuck Street Racer (1-25 Played)
    "rpg-maker": { symbol: "💀", color: "#c9c9c9" },   // Got Some Bad Ends (26-100 Played)
    "slop-sifter": { symbol: "🥱", color: "#ebc16e" },   // NTR Slop Sifter (101-250 Played)
    "gallery-grinder": { symbol: "🖼️", color: "#3cb371" },   // Gallery Grinder (251-500 Played)
    "fluent-in-mtl": { symbol: "🤖", color: "#b6b6b6" },   // Fluent in MTL (501-1,000 Played)
    "waiting-on-devs": { symbol: "⌛", color: "#ecd979" },   // Waiting for Developers (1,001+ Played)


        // SEX EXPERIENCE
    "virgin": { symbol: "🍒", color: "#f04502" },   // Virgin
    "sex-had": { symbol: "🍆", color: "#aa45c1" },   // Sex Had (~1-10 Sex)
    "sex-haver": { symbol: "😏", color: "#ffb6c1" },   // Sex Haver (~10-1000 Sex)
    "sex-adept": { symbol: "🐇", color: "#e8e8e8" },   // Sex Adept (~1000-5000 Sex)
    "sex-expert": { symbol: "💦", color: "#57a5ff" },   // Sex Expert (~5000-10000 Sex)
    "sex-god": { symbol: "🪛", color: "#f24372" },   // Sex God (~10000+ Sex)


        // BODYCOUNT
    "single-digit": { symbol: "📍", color: "#e94388" },   // Single Digit Samaritan (~1-9 Bodies)
    "gets-around": { symbol: "❤️‍🩹", color: "#f33782" },   // Gets Around (~10-25 Bodies)
    "promiscuous": { symbol: "💋", color: "#f01b70" },   // Promiscuous (~25-50 Bodies)
    "flesh-enjoyer": { symbol: "🍑", color: "#ed9c33" },   // Flesh Enjoyer (~50-100 Bodies)
    "village-bicycle": { symbol: "🚲", color: "#d04949" },   // Village Bicycle (~100+)
    "city-trolley": { symbol: "🚌", color: "#52b8d2" },   // City Trolley (~500+ Bodies)
    "well-traveled": { symbol: "🌎", color: "#5ed05e" },   // Well-traveled (~1000+ Bodies)


        // PORN EXPERIENCE
    "naughty-video": { symbol: "👀", color: "#b0c4de" },   // Saw a Naughty Video (~1-25 Vids)
    "doomscrolled-porn": { symbol: "📱", color: "#b0c4de" },   // XXX Doomscroller (~200-1000 Vids)
    "the-watcher": { symbol: "📺", color: "#87cefa" },   // The Watcher (~1000-2500 Vids)
    "refined-taste": { symbol: "🍸", color: "#6bcc88" },   // Refined Taste (~2500-5000 Vids)
    "seen-things": { symbol: "🙈", color: "#795f55" },   // Seen Some Things (~5000-10000 Vids)
    "strong-arm": { symbol: "🩻", color: "#4893e4" },   // Bottomless Hunger (~10000-25000 Vids)
    "page-24732": { symbol: "📄", color: "#bcbcbc" },   // Page 24732 (~25000+ Vids)


        // PORN STASH
    "handful-of-favourites": { symbol: "⭐", color: "#fdcf6c" },   // A Handful of Favourites (1-25 Vids / 250 Images)
    "the-novice-stasher": { symbol: "📁", color: "#f2c753" },   // The Novice Stasher (25-100 Vids / 250-2500 Images)
    "the-stasher": { symbol: "🗄️", color: "#6f468e" },   // The Stasher (100-500 Vids / 2500-10000 Images)
    "the-bunker": { symbol: "🏣", color: "#c71536" },   // The Bunker (500-3000 Vids / 10000-20000 Images)
    "the-archivist": { symbol: "🏦", color: "#a4a4a4" },   // The Benevolent Archivist (3000+ Vids / 10000+ Images)

        // FUN ROLES
    "bull": { symbol: "♞", color: "#b98046" },   // Bull
    "cuckcake": { symbol: "🍰", color: "#dbad80" },   // Cuckcake
    "cuckold": { symbol: "🪑", color: "#A56953" },   // Cuckold
    "cuckquean": { symbol: "🪑", color: "#A56953" },   // Cuckquean
    "hotwife": { symbol: "🌶", color: "#eb461d" },   // Hotwife
    "hothusband": { symbol: "🌶", color: "#e74219" },   // Hothusband
    "swinger": { symbol: "⇄", color: "#66ccff" },   // Swinger
    "stag": { symbol: "🦌", color: "#ffb866" },   // Stag
    "vixen": { symbol: "💄", color: "#f67bcf" },   // Vixen
    "queen-of-spades": { symbol: "♠️", color: "#c2c2c2" },   // Queen of Spades
    "queen-of-hearts": { symbol: "❤️", color: "#fa3e3e" },   // Queen of Hearts
    "snowbunny": { symbol: "❄", color: "#f8f8f8" },   // Snowbunny
    "clown": { symbol: "🤡", color: "#e72e2e" },   // Clown
    "furry": { symbol: "🦊", color: "#fb8740" },   // Furry
    "scalie": { symbol: "🐊", color: "#fb8740" },   // Scalie
    "gooner": { symbol: "🫠", color: "#f9d970" },   // Gooner
    "goonette": { symbol: "🫠", color: "#f9d970" },   // Goonette
    "toilet": { symbol: "🚽", color: "#bbbbbb" },   // Toilet
    "urinal": { symbol: "⋱", color: "#ffea75" },   // Urinal
    "living-doll": { symbol: "🪆", color: "#fa6d99" },   // Living Doll
    "plushophile": { symbol: "🧸", color: "#c09457" },   // Plushophile
    "scientist": { symbol: "🧑‍🔬", color: "#d4d4d4" },   // Scientist
    "experiment": { symbol: "🧪", color: "#b2f86c" },   // Experiment
    "sugar-provider": { symbol: "💳", color: "#4ba5fa" },   // Sugar Provider
    "skunk": { symbol: "🦨", color: "#cfcfcf" },   // Skunk
    "cannibal": { symbol: "🍖", color: "#f04502" },   // Cannibal
    "hucow": { symbol: "🐮", color: "#aaaaaa" },   // Hucow
    "cum-slut": { symbol: "🤤", color: "#e2e2e2" },   // Hucow
    "2d-only": { symbol: "✎", color: "#59b465" },   // 2D ONLY
    "adult-baby-role": { symbol: "🍼", color: "#FFE5D9" },   // Adult Baby
    "diaper-lover": { symbol: "🚼", color: "#48a6f2" },   // Diaper Lover

};

  