import translations from '../game/config/translations.json'

let currentLang = 'en'

// Try to detect language once
export function initI18n() {
    const saved = localStorage.getItem('superfarmer_lang')
    if (saved && translations[saved]) {
        currentLang = saved
        return
    }

    const browserLang = navigator.language?.slice(0, 2)
    if (translations[browserLang]) {
        currentLang = browserLang
    }
}

export function setLang(lang) {
    if (!translations[lang]) return
    currentLang = lang
    localStorage.setItem('superfarmer_lang', lang)
}

export function getLang() {
    return currentLang
}

// The virus
export function t(key, params = {}) {
    let text = translations[currentLang]?.[key] ?? translations.en?.[key] ?? key

    Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v)
    })

    return text
}

export function ta(key, fallback = []) {
    const v = translations[currentLang]?.[key] ?? translations.en?.[key]
    return Array.isArray(v) ? v : fallback
}

export function tf(key, params = {}) {
    let str = t(key)
    Object.entries(params).forEach(([k, v]) => {
        str = str.replaceAll(`{${k}}`, v)
    })
    return str
}

