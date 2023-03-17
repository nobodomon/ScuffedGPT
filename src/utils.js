import moment from 'moment'

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

export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function getBytesFromUnit(unit, value) {
    if (!+value) return 0

    const k = 1024
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = sizes.indexOf(unit)

    return value * Math.pow(k, i)
}


export function toSeconds(time, format = 'mm:ss:SS'){
    return moment(time,"s.S").format(format)
}

export { languages, languagesArray, languagesCodeArray }