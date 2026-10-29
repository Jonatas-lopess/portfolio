# 14: Accessible theme toggle

**What to build:** The light and dark theme toggle is a real button that works with the keyboard and tells screen readers what it does and which theme is active. Today it is a clickable SVG with no name.

**Spec:** github-sourced-portfolio. Bug sweep finding 8 (remainder).

**Blocked by:** 10: Dictionary: typed English source with every string moved in

**Status:** done

- [x] The toggle is a button reachable and operable by keyboard
- [x] It has an accessible name from the Dictionary in every Locale, and its state is announced
- [x] It still avoids the server/client theme mismatch flicker it handles today
- [x] The visual result matches today's, in both themes

## Comments

Done. `components/ThemeSwitch.tsx` is now a `<button type="button">` with `aria-hidden` SVG icons (the Light/Dark icons and their `dark:fill-white` are unchanged). `NavBar` passes `locale` down as it does for `LocaleSwitch`.

- Name and state: `aria-label` = new Dictionary key `NavBar.DarkTheme` ("Dark theme" / "Tema escuro"); `aria-pressed` is true when dark is active. The icon still shows the theme a press switches to.
- **Hand-written string to review:** `Tema escuro` was written by hand, like the other existing pt-BR strings. Sync (ticket 15) will treat it as an existing Translation.
- No-flicker strategy kept (a `mounted` flag), moved from `NavBar` into `ThemeSwitch`. Before mount, the server HTML and first client render both have the named button with an empty 18x18 box and no `aria-pressed`, so nothing shifts when the icon appears. Before, the span was empty until mount and the language select moved when the icon arrived.
- Behaviour change: the state now comes from `resolvedTheme` instead of `theme`. With an OS in dark mode and no saved choice, `theme` is `system`, so the old toggle showed the moon icon for a page that was already dark; it now shows the sun and `aria-pressed="true"`.
- No extra focus ring: the browser's default `:focus-visible` outline appears on keyboard focus and nothing changes when not focused.
- Verified: `tsc`, `pnpm lint`, `pnpm test` (122 passed; the dictionary parity test covers the new key), `pnpm build`. Headless Chromium 1248 over CDP at 1000x700: Home `/en` and `/pt-BR`, light and dark (4 screenshots) are byte-identical before and after. Keyboard: Tab reaches the button (`:focus-visible` true); Enter and Space each toggle `class="dark"` on `<html>`, `aria-pressed`, the icon and `localStorage.theme`, in both Locales. The button's box is the same 18x18 at the same position with JS off (server HTML) and after mount. Production server SSR HTML for `/en` and `/pt-BR` contains `<button type="button" aria-label="Dark theme">` / `"Tema escuro"`.
- Not verified: a screen reader (NVDA/VoiceOver/Orca), so how "Dark theme, toggle button, pressed" is spoken is unchecked; other browsers; the OS-dark `system` case was reasoned from next-themes' behaviour, not run.
