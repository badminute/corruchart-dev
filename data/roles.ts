// app/data/roles.ts
import type { Option } from "@/types/option";

// Extend Option for roles with category
export type RoleOption = Option & {
  category: 1 | 2 | 3 | 4 | 5 | 6;
  variantGroup?: string;
  variantOrder?: number;
};


export const ROLES: RoleOption[] = [

    // SEX ROLES
    { id: "top", label: "Top (Giver)", aka: ["Top"], tags: ["Sex Roles"], category: 1 },
    { id: "bottom", label: "Bottom (Receiver)", aka: ["Bottom"], tags: ["Sex Roles"], category: 1 },
    { id: "versatile", label: "Versatile (Giver and Receiver)", aka: ["Vers"], tags: ["Sex Roles"], category: 2 },


    // SADISM & MASOCHISM
    { id: "sadist", label: "Sadist", aka: [], tags: ["Sadism & Masochism"], category: 5 },
    { id: "masochist", label: "Masochist", aka: ["Pain Slut"], tags: ["Sadism & Masochism"], category: 4 },
    { id: "sadomasochist", label: "Sadomasochist", aka: ["S&M"], tags: ["Sadism & Masochism"], category: 5 },
    { id: "sadistic-caregiver", label: "Sadistic Caregiver", aka: [], tags: ["Sadism & Masochism"], category: 4 },


    // DOMINATION & SUBMISSION
    { id: "brat-tamer", label: "Brat Tamer", aka: [], tags: ["Domination & Submission"], category: 3 },
    { id: "brat", label: "Brat", aka: [], tags: ["Domination & Submission"], category: 3 },
    { id: "degradee", label: "Degradee", aka: [], tags: ["Domination & Submission"], category: 3, variantGroup: "degradation-variant", variantOrder: 1 },
    { id: "degrader", label: "Degrader", aka: [], tags: ["Domination & Submission"], category: 3, variantGroup: "degradation-variant", variantOrder: 0 },
    { id: "dominant", label: "Dominant", aka: ["Dom"], tags: ["Domination & Submission"], category: 3 },
    { id: "findom", label: "Findom", aka: ["Financial Dom"], tags: ["Domination & Submission"], category: 3 },
    { id: "master", label: "Master", aka: [], tags: ["Domination & Submission"], category: 4 },
    { id: "paypig", label: "Paypig", aka: [], tags: ["Domination & Submission"], category: 3 },
    { id: "pet-owner", label: "Pet Owner", aka: [], tags: ["Domination & Submission"], category: 3 },
    { id: "pet", label: "Pet", aka: [], tags: ["Domination & Submission"], category: 3 },
    { id: "predator-primal", label: "Predator (Primal)", aka: [], tags: ["Domination & Submission"], category: 3 },
    { id: "prey-primal", label: "Prey (Primal)", aka: [], tags: ["Domination & Submission"], category: 3 },
    { id: "slave", label: "Slave", aka: [], tags: ["Domination & Submission"], category: 4 },
    { id: "submissive", label: "Submissive", aka: ["Sub"], tags: ["Domination & Submission"], category: 3 },
    { id: "switch", label: "Switch", aka: [], tags: ["Domination & Submission"], category: 3 },


    // BONDAGE & DISCIPLINE
    { id: "abductor", label: "Abductor", aka: [], tags: ["Bondage & Discipline"], category: 5 },
    { id: "abductee", label: "Abductee", aka: [], tags: ["Bondage & Discipline"], category: 4 },
    { id: "prisoner", label: "Prisoner", aka: [], tags: ["Bondage & Discipline"], category: 4 },
    { id: "captor", label: "Captor", aka: [], tags: ["Bondage & Discipline"], category: 4 },
    { id: "furniture", label: "Furniture", aka: [], tags: ["Bondage & Discipline"], category: 3 },
    { id: "rope-bunny", label: "Rope Bunny", aka: [], tags: ["Bondage & Discipline"], category: 3 },
    { id: "rope-top", label: "Rope Top", aka: [], tags: ["Bondage & Discipline"], category: 3 },


    // BDSM ROLES Cont.
    { id: "pig", label: "Pig", aka: [], tags: ["BDSM Roles Cont."], category: 4 },
    { id: "little", label: "Little", aka: [], tags: ["BDSM Roles Cont."], category: 3 },
    { id: "doctor", label: "Doctor", aka: [], tags: ["BDSM Roles Cont."], category: 3 },
    { id: "patient", label: "Patient", aka: [], tags: ["BDSM Roles Cont."], category: 3 },
    { id: "goddess", label: "Goddess", aka: [], tags: ["BDSM Roles Cont."], category: 3 },
    { id: "pony", label: "Pony", aka: [], tags: ["BDSM Roles Cont."], category: 3 },
    { id: "service-top", label: "Service Top", aka: [], tags: ["BDSM Roles Cont."], category: 3 },
    { id: "service-dom", label: "Service Dom", aka: [], tags: ["BDSM Roles Cont."], category: 3 },
    { id: "sensation-junkie", label: "Sensation Junkie", aka: [], tags: ["BDSM Roles Cont."], category: 3 },
    { id: "mommy", label: "Mommy", aka: [], tags: ["BDSM Roles Cont."], category: 3, variantGroup: "parents-variant", variantOrder: 0 },
    { id: "daddy", label: "Daddy", aka: [], tags: ["BDSM Roles Cont."], category: 3, variantGroup: "parents-variant", variantOrder: 1 },


    // GENDER EXPRESSION
    { id: "androgynous-gender-exp", label: "Androgynous (Gender Exp.)", aka: [], tags: ["Gender Expression"], category: 1 },
    { id: "masculine-gender-exp", label: "Masculine (Gender Exp.)", aka: ["Masc"], tags: ["Gender Expression"], category: 1 },
    { id: "feminine-gender-exp", label: "Feminine (Gender Exp.)", aka: ["Femme"], tags: ["Gender Expression"], category: 1 },


    // SEX
    { id: "male", label: "Male", aka: [], tags: ["Sex"], category: 1 },
    { id: "female", label: "Female", aka: [], tags: ["Sex"], category: 1 },
    { id: "intersex", label: "Intersex", aka: [], tags: ["Sex"], category: 1 },


    // SEX EXPERIENCE
    { id: "virgin", label: "Virgin (~0 Sex)", aka: [], tags: ["Sex Experience"], category: 1 },
    { id: "sex-had", label: "Sex Had (~1-10 Sex)", aka: [], tags: ["Sex Experience"], category: 1 },
    { id: "sex-haver", label: "Sex Haver (~10-1000 Sex)", aka: [], tags: ["Sex Experience"], category: 1 },
    { id: "sex-adept", label: "Sex Adept (~1000-5000 Sex)", aka: [], tags: ["Sex Experience"], category: 1 },
    { id: "sex-expert", label: "Sex Expert (~5000-10000 Sex)", aka: [], tags: ["Sex Experience"], category: 1 },
    { id: "sex-god", label: "Sex God (~10000+ Sex)", aka: [], tags: ["Sex Experience"], category: 1 },


    // BODY COUNT
    { id: "single-digit", label: "Single Digit Samaritan (~1-9 Bodies)", aka: [], tags: ["Body Count"], category: 1 },
    { id: "gets-around", label: "Gets Around (~10-25 Bodies)", aka: [], tags: ["Body Count"], category: 1 },
    { id: "promiscuous", label: "Promiscuous (~25-50 Bodies)", aka: [], tags: ["Body Count"], category: 1 },
    { id: "flesh-enjoyer", label: "Flesh Enjoyer (~50-100 Bodies)", aka: [], tags: ["Body Count"], category: 1 },
    { id: "village-bicycle", label: "Village Bicycle (~100+)", aka: [], tags: ["Body Count"], category: 1 },
    { id: "city-trolley", label: "City Trolley (~500+ Bodies)", aka: [], tags: ["Body Count"], category: 1 },
    { id: "well-traveled", label: "Well-traveled (~1000+ Bodies)", aka: [], tags: ["Body Count"], category: 1 },


    // PORN EXPERIENCE
    { id: "naughty-video", label: "Saw a Naughty Video (~1-25 Vids)", aka: [], tags: ["Porn Experience"], category: 1 },
    { id: "doomscrolled-porn", label: "XXX Doomscroller (~200-1000 Vids)", aka: [], tags: ["Porn Experience"], category: 3 },
    { id: "the-watcher", label: "The Watcher (~1000-2500 Vids)", aka: [], tags: ["Porn Experience"], category: 3 },
    { id: "refined-taste", label: "Refined Taste (~2500-5000 Vids)", aka: [], tags: ["Porn Experience"], category: 4 },
    { id: "seen-things", label: "Seen Things (~5000-10000 Vids)", aka: [], tags: ["Porn Experience"], category: 4 },
    { id: "strong-arm", label: "Strong Arm (~10000-25000 Vids)", aka: [], tags: ["Porn Experience"], category: 4 },
    { id: "page-24732", label: "Page 24732 (~25000+ Vids)", aka: [], tags: ["Porn Experience"], category: 5 },


    // PORN STASH
    { id: "handful-of-favourites", label: "A Handful of Favourites (1-25 Vids / 250 Images)", aka: [], tags: ["Porn Stash"], category: 3 },
    { id: "the-novice-stasher", label: "The Novice Stasher (25-100 Vids / 250-2500 Images)", aka: [], tags: ["Porn Stash"], category: 4 },
    { id: "the-stasher", label: "The Stasher (100-500 Vids / 2500-10000 Images)", aka: [], tags: ["Porn Stash"], category: 4 },
    { id: "the-bunker", label: "The Bunker (500-3000 Vids / 10000-20000 Images)", aka: [], tags: ["Porn Stash"], category: 4 },
    { id: "the-archivist", label: "The Archivist (3000+ Vids / 10000+ Images)", aka: [], tags: ["Porn Stash"], category: 5 },


    // EROTIC NOVELS READ
    { id: "50-shades", label: "50 Shades (1-15 Read)", aka: [], tags: ["Erotic Novels Read"], category: 2 },
    { id: "milking-minotaurs", label: "Milking Minotaurs (15-50 Read)", aka: [], tags: ["Erotic Novels Read"], category: 3 },
    { id: "smut-sommelier", label: "Smut Sommelier (51-100 Read)", aka: [], tags: ["Erotic Novels Read"], category: 3 },
    { id: "erotica-expert", label: "Erotica Expert (101-200 Read)", aka: [], tags: ["Erotic Novels Read"], category: 3 },
    { id: "smut-librarian", label: "Smut Librarian (201+ Read)", aka: [], tags: ["Erotic Novels Read"], category: 4 },


    // HENTAI DOUJINSHI READ
    { id: "nhentai-tourist", label: "Nhentai Tourist (1-50 Read)", aka: [], tags: ["Hentai Doujinshi Read"], category: 2 },
    { id: "177013-initiate", label: "177013 Initiate (51-150 Read)", aka: [], tags: ["Hentai Doujinshi Read"], category: 2 },
    { id: "has-favourites", label: "Has Favourites (151-400 Read)", aka: [], tags: ["Hentai Doujinshi Read"], category: 3 },
    { id: "for-the-plot", label: "For The Plot (401-800 Read)", aka: [], tags: ["Hentai Doujinshi Read"], category: 3 },
    { id: "rereader", label: "Rereader (801-1,500 Read)", aka: [], tags: ["Hentai Doujinshi Read"], category: 4 },
    { id: "sad-panda", label: "Sad Panda (1,501+ Read)", aka: [], tags: ["Hentai Doujinshi Read"], category: 4 },


    // HENTAI ANIME WATCHED
    { id: "tentacle", label: "Seen a Tentacle (1-25 Watched)", aka: [], tags: ["Hentai Anime Watched"], category: 2 },
    { id: "deflowered", label: "Deflowered (26-75 Watched)", aka: [], tags: ["Hentai Anime Watched"], category: 2 },
    { id: "kuroinu", label: "Kuroinu (76-150 Watched)", aka: [], tags: ["Hentai Anime Watched"], category: 3 },
    { id: "get-pregnant", label: "Get Pregnant x12 (151-300 Watched)", aka: [], tags: ["Hentai Anime Watched"], category: 3 },
    { id: "mind-broken", label: "Mind Broken (301-600 Watched)", aka: [], tags: ["Hentai Anime Watched"], category: 3 },
    { id: "watched-everything", label: "Watched Everything (601+ Watched)", aka: [], tags: ["Hentai Anime Watched"], category: 4 },


    // HENTAI GAMES PLAYED
    { id: "meet-n-fuck-racer", label: "Meet'N'Fuck Street Racer (1-25 Played)", aka: [], tags: ["Hentai Games Played"], category: 2 },
    { id: "rpg-maker", label: "RPGMaker Rigamarole (26-100 Played)", aka: [], tags: ["Hentai Games Played"], category: 2 },
    { id: "slop-sifter", label: "Slop Sifter (101-250 Played)", aka: [], tags: ["Hentai Games Played"], category: 3 },
    { id: "gallery-grinder", label: "Gallery Grinder (251-500 Played)", aka: [], tags: ["Hentai Games Played"], category: 3 },
    { id: "fluent-in-mtl", label: "Fluent in MTL (501-1,000 Played)", aka: [], tags: ["Hentai Games Played"], category: 4 },
    { id: "waiting-for-devs", label: "Waiting for Developers (1,001+ Played)", aka: [], tags: ["Hentai Games Played"], category: 4 },


    // GENDER
    { id: "man-cisgender", label: "Man (Cisgender)", aka: ["Cis Man"], tags: ["Gender"], category: 1 },
    { id: "woman-cisgender", label: "Woman (Cisgender)", aka: ["Cis Woman"], tags: ["Gender"], category: 1 },
    { id: "man-transgender", label: "Man (Transgender)", aka: ["Trans Man"], tags: ["Gender"], category: 1 },
    { id: "woman-transgender", label: "Woman (Transgender)", aka: ["Trans Woman"], tags: ["Gender"], category: 1 },
    { id: "non-binary-transgender", label: "Non-Binary (Transgender)", aka: ["NB Trans"], tags: ["Gender"], category: 1 },


    // SEXUAL ORIENTATION
    { id: "straight", label: "Straight", aka: ["Straight"], tags: ["Sexual Orientation"], category: 1 },
    { id: "gay", label: "Gay", aka: ["Gay"], tags: ["Sexual Orientation"], category: 1 },
    { id: "lesbian", label: "Lesbian", aka: ["Lesbian"], tags: ["Sexual Orientation"], category: 1 },
    { id: "bisexual", label: "Bisexual", aka: ["Bi"], tags: ["Sexual Orientation"], category: 1, variantGroup: "bisexual", variantOrder: 0 },
    { id: "pansexual", label: "Pansexual", aka: ["Pan"], tags: ["Sexual Orientation"], category: 1, variantGroup: "bisexual", variantOrder: 1 },
    { id: "asexual", label: "Asexual", aka: ["Ace"], tags: ["Sexual Orientation"], category: 1 },
    { id: "aromantic", label: "Aromantic", aka: [], tags: ["Sexual Orientation"], category: 1 },
    { id: "demisexual", label: "Demisexual", aka: ["Demi"], tags: ["Sexual Orientation"], category: 1 },


    // FUN ROLES
    { id: "2d-only", label: "2D ONLY", aka: [], tags: ["Fun Roles"], category: 3 },
    { id: "adult-baby-option", label: "Adult Baby", aka: ["AB"], tags: ["Fun Roles"], category: 3, variantGroup: "abdls", variantOrder: 0 },
    { id: "diaper-lover", label: "Diaper Lover", aka: ["DL"], tags: ["Fun Roles"], category: 3, variantGroup: "abdls", variantOrder: 1 },
    { id: "bull", label: "Bull", aka: ["Stallion"], tags: ["Fun Roles"], category: 4, variantGroup: "thirds", variantOrder: 0 },
    { id: "cuckcake", label: "Cuckcake", aka: [], tags: ["Fun Roles"], category: 4, variantGroup: "thirds", variantOrder: 1 },
    { id: "cuckold", label: "Cuckold", aka: ["Cuck"], tags: ["Fun Roles"], category: 4, variantGroup: "cucks", variantOrder: 0 },
    { id: "cuckquean", label: "Cuckquean", aka: ["Cuck"], tags: ["Fun Roles"], category: 4, variantGroup: "cucks", variantOrder: 1 },
    { id: "hotwife", label: "Hotwife", aka: ["Hotwife"], tags: ["Fun Roles"], category: 4, variantGroup: "hotpartners", variantOrder: 0 },
    { id: "hothusband", label: "Hothusband", aka: ["Hotwife"], tags: ["Fun Roles"], category: 4, variantGroup: "hotpartners", variantOrder: 1 },
    { id: "swinger", label: "Swinger", aka: [], tags: ["Fun Roles"], category: 4 },
    { id: "stag", label: "Stag", aka: [], tags: ["Fun Roles"], category: 4, variantGroup: "stag-vixen", variantOrder: 0 },
    { id: "vixen", label: "Vixen", aka: [], tags: ["Fun Roles"], category: 4, variantGroup: "stag-vixen", variantOrder: 1 },
    { id: "queen-of-spades", label: "Queen of Spades", aka: ["QOS"], tags: ["Fun Roles"], category: 4, variantGroup: "queens", variantOrder: 0 },
    { id: "queen-of-hearts", label: "Queen of Hearts", aka: ["QOH"], tags: ["Fun Roles"], category: 4, variantGroup: "queens", variantOrder: 1 },
    { id: "snowbunny", label: "Snowbunny", aka: [], tags: ["Fun Roles"], category: 3 },
    { id: "clown", label: "Clown", aka: [], tags: ["Fun Roles"], category: 3 },
    { id: "furry", label: "Furry", aka: [], tags: ["Fun Roles"], category: 2 },
    { id: "gooner", label: "Gooner", aka: [], tags: ["Fun Roles"], category: 5, variantGroup: "gooners", variantOrder: 0 },
    { id: "goonette", label: "Goonette", aka: [], tags: ["Fun Roles"], category: 5, variantGroup: "gooners", variantOrder: 1 },
    { id: "urinal", label: "Urinal", aka: [], tags: ["Fun Roles"], category: 4, variantGroup: "toilets", variantOrder: 0 },
    { id: "toilet", label: "Toilet", aka: [], tags: ["Fun Roles"], category: 4, variantGroup: "toilets", variantOrder: 1 },
    { id: "living-doll", label: "Living Doll", aka: [], tags: ["Fun Roles"], category: 3 },
    { id: "plushophile", label: "Plushophile", aka: [], tags: ["Fun Roles"], category: 2 },
    { id: "scientist", label: "Scientist", aka: [], tags: ["Fun Roles"], category: 3 },
    { id: "experiment", label: "Experiment", aka: ["SUBJECT"], tags: ["Fun Roles"], category: 3 },
    { id: "hucow", label: "Hucow", aka: ["Human Cow"], tags: ["Fun Roles"], category: 3 },
    { id: "cum-slut", label: "Cum Slut", aka: [""], tags: ["Fun Roles"], category: 3 },
    { id: "sugar-provider", label: "Sugar Provider", aka: [], tags: ["Fun Roles"], category: 3 },
    { id: "skunk", label: "Skunk", aka: [], tags: ["Fun Roles"], category: 3 },
    { id: "cannibal", label: "Cannibal", aka: [], tags: ["Fun Roles"], category: 6 },

];
