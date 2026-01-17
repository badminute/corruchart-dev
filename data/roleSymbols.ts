// app/data/roleSymbols.ts
export const ROLE_SYMBOLS: Record<string, { symbol: string; color?: string }> = {
    "1": { symbol: "🡅", color: "#ff9933" },   // Top (Giver)
    "2": { symbol: "🡇", color: "#3ac3fa" },   // Bottom (Receiver)
    "3": { symbol: "⬢", color: "#a64dff" },   // Versatile (Giver and Receiver)
    "4": { symbol: "⛓", color: "#ff9933" },   // Dominant
    "5": { symbol: "☍", color: "#66ccff" },   // Submissive
    "6": { symbol: "⇄", color: "#cc99ff" },   // Switch
    "7": { symbol: "⇝", color: "#ff3300" },   // Sadist
    "8": { symbol: "✧", color: "#3ac3fa" },   // Masochist
    "9": { symbol: "🎭", color: "#9933ff" },   // Sadomasochist
    "10": { symbol: "🥺", color: "#ff99cc" },  // Brat
    "11": { symbol: "💢", color: "#ffcc66" },  // Brat Tamer
    "12": { symbol: "🐶", color: "#996633" },  // Pet
    "13": { symbol: "🐕‍🦺", color: "#996633" },  // Pet Owner
    "14": { symbol: "🏧", color: "#fca7e2" },  // Paypig
    "15": { symbol: "🧾", color: "#3cf063" },  // Findom
    "16": { symbol: "⛓️", color: "#ff3300" },  // Slave
    "17": { symbol: "🔑", color: "#ffd700" },  // Master
    "18": { symbol: "🐷", color: "#ff99ff" },  // Pig
    "19": { symbol: "🌬", color: "#cc4d2d" },  // Daddy/Mommy
    "20": { symbol: "🌸", color: "#66ccff" },  // Little
    "21": { symbol: "🧶", color: "#cc99ff" },   // Rope Bunny
    "22": { symbol: "🪢", color: "#ff9933" },   // Rope Top
    "23": { symbol: "▲", color: "#ffcc66" },   // Service Top
    "24": { symbol: "▲", color: "#ff9933" },   // Service Dom
    "25": { symbol: "▼", color: "#ff6600" },   // Degrader
    "26": { symbol: "▲", color: "#66ccff" },   // Degradee
    "27": { symbol: "⚡", color: "#ff66cc" },   // Sensation Junkie
    "28": { symbol: "⚕️", color: "#66ccff" },   // Doctor
    "29": { symbol: "🛌", color: "#ff9933" },   // Patient
    "30": { symbol: "🦖", color: "#ff6600" },   // Predator (Primal)
    "31": { symbol: "🐁", color: "#66ccff" },   // Prey (Primal)
    "32": { symbol: "🛸", color: "#ff3300" },   // Abductor
    "33": { symbol: "🧍", color: "#66ccff" },   // Abductee
    "34": { symbol: "🩹", color: "#ff6600" },   // Sadistic Caregiver
    "35": { symbol: "⛓️", color: "#ff3300" },   // Prisoner
    "36": { symbol: "👤", color: "#ff9933" },   // Captor
    "37": { symbol: "💺", color: "#cc99ff" },   // Furniture
    "38": { symbol: "♛", color: "#ffcc66" },   // Goddess
    "39": { symbol: "🪅", color: "#cc99ff" },   // Pony
    "40": { symbol: "⚧", color: "#a578ce" },  // Androgynous
    "41": { symbol: "♂", color: "#3399ff" },   // Masculine
    "42": { symbol: "♀", color: "#ff66cc" },   // Feminine
    "43": { symbol: "♂", color: "#3399ff" },   // Male
    "44": { symbol: "♀", color: "#ff66cc" },   // Female
    "45": { symbol: "⚥", color: "#cc99ff" },   // Intersex
    "46": { symbol: "♂", color: "#3399ff" },   // Man (Cisgender)
    "47": { symbol: "♀", color: "#ff99ff" },   // Woman (Cisgender)
    "48": { symbol: "♂", color: "#6699ff" },   // Man (Transgender)
    "49": { symbol: "♀", color: "#ff99ff" },   // Woman (Transgender)
    "50": { symbol: "🜬", color: "#cc66ff" },   // Non-Binary (Transgender)
    "51": { symbol: "🜜", color: "#9966ff" },   // Non-Binary Man (Transgender)
    "52": { symbol: "🜠", color: "#a578ce" },   // Non-Binary Woman (Transgender)
    "53": { symbol: "⚲", color: "#999999" },   // Agender (Transgender)
    "54": { symbol: "🜡", color: "#a578ce" },   // Genderfluid (Transgender)
    "55": { symbol: "⚴", color: "#cc3399" },   // Bigender (Transgender)
    "56": { symbol: "🜐", color: "#cc3399" },   // Two-Spirit (Transgender)
    "57": { symbol: "⚤", color: "#c2c2c2" },   // Heterosexual (Straight)
    "58": { symbol: "⚣", color: "#45A893" },   // Homosexual (Gay)
    "59": { symbol: "⚢", color: "#D262A5" },   // Homosexual (Lesbian)
    "60": { symbol: "⚤", color: "#cc66ff" },   // Bisexual/Pansexual
    "61": { symbol: "😌", color: "#999999" },   // Asexual
    "62": { symbol: "🏹", color: "#ff9999" },   // Aromantic
    "63": { symbol: "❦", color: "#ff66cc" },   // Demisexual
    "64": { symbol: "✎", color: "#59b465" },   // 2D ONLY
    "65": { symbol: "🍼", color: "#ffccff" },   // Adult Baby
    "66": { symbol: "♞", color: "#b98046" },   // Bull
    "67": { symbol: "🪑", color: "#999966" },   // Cuckold/Cuckquean
    "68": { symbol: "🌶", color: "#ff3300" },   // Hotwife/Hothusband
    "69": { symbol: "⇄", color: "#66ccff" },   // Swinger
    "70": { symbol: "🦌", color: "#ff9966" },   // Stag
    "71": { symbol: "💄", color: "#ff99ff" },   // Vixen
    "72": { symbol: "♠︎", color: "#c2c2c2" },   // Queen of Spades
    "73": { symbol: "❄", color: "#f8f8f8" },   // Snowbunny
    "74": { symbol: "🤡", color: "#ff6e6e" },   // Clown
    "75": { symbol: "🦊", color: "#cc99ff" },   // Furry
    "76": { symbol: "🫠", color: "#ca8ae4" },   // Gooner/Goonette
    "77": { symbol: "⋱", color: "#ffea75" },   // Toilet/Urinal
    "78": { symbol: "🪆", color: "#ff99cc" },   // Living Doll
    "79": { symbol: "🧑‍🔬", color: "#66ccff" },   // Scientist
    "80": { symbol: "🧪", color: "#ff66cc" },   // Experiment
    "81": { symbol: "💳", color: "#ff99ff" },   // Sugar Provider
    "82": { symbol: "🦨", color: "#ffcc66" },   // Skunk
    "83": { symbol: "🍖", color: "#ff6600" },   // Cannibal
};
