import {getLocales} from "expo-localization";
import {I18n} from "i18n-js";

import en from "@/localization/en";
import ua from "@/localization/ua";

const messages = {
    en: en,
    ua: ua,
};

const i18n = new I18n(messages);

// Українська за замовчуванням; ключі, яких ще немає в ua, беруться з en
// (без цього i18n-js показує "[missing ...]").
i18n.defaultLocale = "en";
i18n.enableFallback = true;
i18n.locale = "ua";

export const currentDeviceLocale = getLocales()[0].languageCode!;

export default i18n;