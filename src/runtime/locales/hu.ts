import type { LocaleMessages } from '../../types'
import { deepMerge } from '../utils/deep-merge'

// Base Hungarian (ONLY shared content between formal and informal)
const huBase: LocaleMessages = {
  common: {
    email: 'E-mail',
    password: 'Jelszó',
    name: 'Név',
    fullName: 'Teljes név',
    role: 'Szerepkör',
    active: 'Aktív',
    yes: 'Igen',
    no: 'Nem',
    id: 'Azonosító',
    created: 'Létrehozva',
    updated: 'Frissítve',
    lastLogin: 'Utolsó belépés',
    registered: 'Regisztrálva',
    lastUpdated: 'Utoljára frissítve',
    edit: 'Szerkesztés',
    delete: 'Törlés',
    loading: 'Betöltés...',
    error: 'Hiba'
  },
  login: {
    emailLabel: 'E-mail',
    passwordLabel: 'Jelszó',
    submit: 'Bejelentkezés',
    submitting: 'Bejelentkezés...',
    forgotPasswordSending: 'Küldés...'
  },
  register: {
    title: 'Regisztráció',
    nameLabel: 'Teljes név',
    emailLabel: 'E-mail',
    passwordLabel: 'Jelszó',
    confirmPasswordLabel: 'Jelszó megerősítése',
    passwordMismatch: 'A jelszavak nem egyeznek',
    submit: 'Regisztráció',
    submitting: 'Fiók létrehozása...',
  },
  resetPassword: {
    titleReset: 'Jelszó visszaállítása',
    titleChange: 'Jelszó megváltoztatása',
    currentPasswordLabel: 'Jelenlegi jelszó',
    newPasswordLabel: 'Új jelszó',
    confirmPasswordLabel: 'Új jelszó megerősítése',
    submitReset: 'Jelszó visszaállítása',
    submitUpdate: 'Jelszó frissítése',
    submittingReset: 'Visszaállítás...',
    submittingUpdate: 'Frissítés...',
    passwordHelpText: 'A jelszónak tartalmaznia kell legalább',
    secureResetInfo: 'Biztonságos linket használva állítod vissza a jelszavad.',
    emailLabel: 'E-mail:'
  },
  passwordStrength: {
    label: 'Jelszó követelmények:',
    strength: {
      weak: 'Gyenge',
      medium: 'Közepes',
      strong: 'Erős',
      veryStrong: 'Nagyon erős',
      unknown: 'Ismeretlen'
    },
    requirements: {
      minLength: 'Legalább {0} karakter',
      uppercase: 'Tartalmaz nagybetűt',
      lowercase: 'Tartalmaz kisbetűt',
      numbers: 'Tartalmaz számot',
      specialChars: 'Tartalmaz speciális karaktert'
    },
    requirementsTitle: 'Jelszó követelmények:'
  },
  profile: {
    title: 'Profil információk',
    name: 'Név:',
    email: 'E-mail:',
    role: 'Szerepkör:',
    registered: 'Regisztrálva:',
    lastUpdated: 'Utoljára frissítve:',
    active: 'Aktív:',
    id: 'Azonosító:'
  },
  emailConfirmation: {
    successTitle: 'E-mail megerősítve!',
    errorTitle: 'Megerősítés sikertelen',
    loginButton: 'Tovább a bejelentkezéshez',
    backToLogin: 'Vissza a bejelentkezéshez',
    processing: 'Feldolgozás...',
  },
  logout: {
    linkText: 'Kijelentkezés',
    loggingOut: 'Kijelentkezés...',
    confirmMessage: 'Biztosan ki szeretnél jelentkezni?'
  },
  userCard: {
    edit: 'Szerkesztés',
    delete: 'Törlés'
  },
  googleLogin: {
    buttonText: 'Folytatás Google-lel',
    redirecting: 'Átirányítás...'
  },
  usersList: {
    title: 'Felhasználók listája',
    loading: 'Felhasználók betöltése...',
    noUsers: 'Nem található felhasználó',
    error: 'Hiba:',
    page: 'Oldal',
    of: '/',
    total: 'Összesen:',
    users: 'felhasználó',
    previous: 'Előző',
    next: 'Következő'
  }
}

// Informal Hungarian (tegező forma)
const huInformalOverrides: LocaleMessages = {
  login: {
    title: 'Üdvözöljük',
    subtitle: 'Jelentkezz be a fiókodba',
    emailPlaceholder: 'Add meg az e-mail címed',
    passwordPlaceholder: 'Add meg a jelszavad',
    forgotPassword: 'Elfelejtetted a jelszavad?',
    rememberMe: 'Emlékezz rám'
  },
  register: {
    subtitle: 'Hozz létre egy új fiókot',
    namePlaceholder: 'Add meg a teljes neved',
    emailPlaceholder: 'Add meg az e-mail címed',
    passwordPlaceholder: 'Add meg a jelszavad',
    confirmPasswordPlaceholder: 'Erősítsd meg a jelszavad',
    alreadyHaveAccount: 'Már van fiókod?',
    signInLink: 'Jelentkezz be itt',
    submit: 'Regisztrálj'
  },
  passwordStrength: {
    hintsTitle: 'Hogyan tedd erősebbé a jelszavad:'
  },
  logout: {
    confirmMessage: 'Biztosan ki szeretnél jelentkezni?'
  },
  userCard: {
    deleteConfirm: 'Biztosan törlöd {0} felhasználót?'
  },
  emailConfirmation: {
    processingMessage: 'Kérjük, várj, amíg feldolgozzuk az e-mail megerősítését.',
    successMessage: 'Az e-mail címed megerősítésre került és a fiókod aktív.',
    errorMessage: 'A megerősítő link érvénytelen vagy lejárt. Kérjük, próbáld újra regisztrálni vagy lépj kapcsolatba az ügyfélszolgálattal.'
  }
}

// Formal Hungarian (magázó forma)
const huFormalOverrides: LocaleMessages = {
  login: {
    title: 'Üdvözöljük',
    subtitle: 'Jelentkezzen be fiókjába',
    emailPlaceholder: 'Adja meg az e-mail címét',
    passwordPlaceholder: 'Adja meg a jelszavát',
    forgotPassword: 'Elfelejtette a jelszavát?',
    rememberMe: 'Maradjon bejelentkezve'
  },
  register: {
    subtitle: 'Hozzon létre egy új fiókot',
    namePlaceholder: 'Adja meg a teljes nevét',
    emailPlaceholder: 'Adja meg az e-mail címét',
    passwordPlaceholder: 'Adja meg a jelszavát',
    confirmPasswordPlaceholder: 'Erősítse meg a jelszavát',
    alreadyHaveAccount: 'Már van fiókja?',
    signInLink: 'Jelentkezzen be itt',
    submit: 'Regisztráljon'
  },
  passwordStrength: {
    hintsTitle: 'Hogyan tegye erősebbé a jelszavát:'
  },
  logout: {
    confirmMessage: 'Biztosan ki szeretne jelentkezni?'
  },
  userCard: {
    deleteConfirm: 'Biztosan törli {0} felhasználót?'
  },
  emailConfirmation: {
    processingMessage: 'Kérjük, várjon, amíg feldolgozzuk az e-mail megerősítését.',
    successMessage: 'Az e-mail címe megerősítésre került és a fiókja aktív.',
    errorMessage: 'A megerősítő link érvénytelen vagy lejárt. Kérjük, próbáljon meg újra regisztrálni vagy lépjen kapcsolatba az ügyfélszolgálattal.'
  }
}

// Export variants
export const hu: LocaleMessages = deepMerge(huBase, huInformalOverrides)
export const huFormal: LocaleMessages = deepMerge(huBase, huFormalOverrides)
