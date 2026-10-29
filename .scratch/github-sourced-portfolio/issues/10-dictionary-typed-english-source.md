# 10: Dictionary: typed English source with every string moved in

**What to build:** English is the typed, hand-edited source of the Dictionary, and its type is the single definition of the shape. Every other Locale is a separate reviewable file. Every user-visible string lives in the Dictionary, including the strings that are hard-coded today: the "Links" heading on the About page, the page title and description (Portuguese only today), and the "project not found" message. The existing hand-written Portuguese is kept and treated as an existing Translation. The old UI label "Resume" becomes "Project summary".

**Spec:** github-sourced-portfolio. ADR 0002. Bug sweep findings 7 and 9.

**Blocked by:** 09: Locale module

**Status:** done

- [x] The English Dictionary is the typed source; the ambient interface for the Dictionary shape is removed
- [x] The Portuguese Dictionary is preserved with its current wording, in the generated-Locale file layout
- [x] The page title and description differ per Locale
- [x] The About links heading and the not-found message come from the Dictionary, and a missing Project shows a translated not-found state
- [x] "Resume" (meaning Project summary) is renamed to match `GLOSSARY.md`
- [x] A test fails if any Locale's Dictionary is missing a key or has an extra one compared with English
- [x] No user-visible string remains hard-coded in pages or modules

## Comments

Done. Verified by `tsc`, `lint`, `pnpm test` (118 tests), `pnpm build`, and `pnpm start` + curl: `<title>` and meta description per Locale on `/en`, `/pt-BR`, `/en/about`, `/pt-BR/about`; a missing Project returns 404 in both Locales and a headless browser shows the translated message and back link.

- Layout: `dictionary/en.ts` (source; `DictionaryEntry = typeof en`), `dictionary/pt-BR.ts` (typed `DictionaryEntry`), `dictionary/index.ts` (`dictionaries: Record<Locale, DictionaryEntry>`; a Locale missing there is a compile error). Parity test in `dictionary/dictionary.test.ts`.
- New keys: `Meta.Title`, `Meta.Description`, `About.LinksHeading`, `Projects.CountLabel`, `ProjectInfo.BackToProjects`. Renamed `ProjectInfo.Resume` to `ProjectInfo.Summary` (English "Project summary").
- Not moved, on purpose: the owner's name and the "LinkedIn" / "GitHub" link names (proper nouns; ticket 13 rebuilds the Profile links), the Locale switch label (ticket 12), and the theme toggle labels (ticket 14).
- The localized not-found is `app/[lang]/not-found.tsx`, a client component reading the Locale from `useParams`. `curl` sees an empty client-render shell for it (status 404); this matches the previous default 404 behaviour of this app (root layout under `[lang]`), and the text appears once the page hydrates.
- Hand-written Portuguese (owner to review): `Meta.Title` "Jonatas Lopes - Portfólio" (was "Portfolio", changed so the title differs per Locale), `Projects.CountLabel` "Número de projetos", `ProjectInfo.BackToProjects` "Voltar aos projetos". `ProjectInfo.Summary` keeps the existing "Resumo". `Meta.Description` English is a new translation of the existing Portuguese.
