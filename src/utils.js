const languages = {

    English: "en",
    Chinese: "zh",
    Afrikaans: "af",
    Arabic: "ar",
    Armenian: "hy",
    Azerbaijani: "az",
    Belarusian: "be",
    Bosnian: "bs",
    Bulgarian: "bg",
    Catalan: "ca",
    Croatian: "hr",
    Czech: "cs",
    Danish: "da",
    Dutch: "nl",
    Estonian: "et",
    Finnish: "fi",
    French: "fr",
    Galician: "gl",
    German: "de",
    Greek: "el",
    Hebrew: "he",
    Hindi: "hi",
    Hungarian: "hu",
    Icelandic: "is",
    Indonesian: "id",
    Italian: "it",
    Japanese: "ja",
    Kannada: "kn",
    Kazakh: "kk",
    Korean: "ko",
    Latvian: "lv",
    Lithuanian: "lt",
    Macedonian: "mk",
    Malay: "ms",
    Marathi: "mr",
    Maori: "mi",
    Nepali: "ne",
    Norwegian: "no",
    Persian: "fa",
    Polish: "pl",
    Portuguese:"pt",
    Romanian: "ro",
    Russian: "ru",
    Serbian: "sr",
    Slovak: "sk",
    Slovenian: "sl",
    Spanish: "es",
    Swahili: "sw",
    Swedish: "sv",
    Tagalog: "tl",
    Tamil: "ta",
    Thai: "th",
    Turkish: "tr",
    Ukrainian: "uk",
    Urdu: "ur",
    Vietnamese: "vi",
    Welsh: "cy"
}

// fix the above to be an object



// give me the language itself as an array

const languagesArray = Object.keys(languages)

// give me the language code as an array

const languagesCodeArray = Object.values(languages)

export { languages, languagesArray, languagesCodeArray }