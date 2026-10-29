import type { Locale } from "@/lib/locale";
import { en, type DictionaryEntry } from "./en";
import { ptBR } from "./pt-BR";

export type { DictionaryEntry };

/**
 * Every Locale's Dictionary. Typed `Record<Locale, ...>`, so a Locale added
 * to the list in `lib/locale` without an entry here is a compile error.
 */
export const dictionaries: Record<Locale, DictionaryEntry> = {
    en,
    "pt-BR": ptBR,
};
