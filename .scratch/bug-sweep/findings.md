# Bug sweep findings (2026-10-29)

All findings are folded into the `github-sourced-portfolio` tickets (see "Ticket map" at the bottom); there is no separate bug-sweep ticket set. Checks run: `tsc --noEmit` (clean), `next lint` (clean), `next build` (fails without Supabase env, expected, goes away with the Supabase removal), `npm ci` (fails, see 1).

"Verified" = reproduced by a command. "By reading" = from the code, not run.

## Verified

1. **`package-lock.json` is out of sync with `package.json`.** `npm ci` fails with "Missing: @formatjs/intl-localematcher@0.4.2, @supabase/supabase-js@2.118.0, negotiator@0.6.4, next-themes@0.2.1, ...". A second lockfile (`yarn.lock`) is also committed. Fix: pick one package manager, delete the other lockfile, regenerate. Note: Supabase deps disappear in the migration, so do this after it or regenerate twice.
2. **Next 13.4.4 is flagged by npm as having a security vulnerability** ("upgrade to a patched version"). Fix: upgrade Next within the supported range, then re-run build, lint and typecheck. Separate from the bug fixes because it can need code changes.
3. **`next build` cannot run without Supabase env vars** (`supabaseUrl is required`, thrown while collecting page data for `/[lang]/projects/[projectName]`). Superseded by the Projects module work; only a ticket if the migration is delayed.

## By reading

4. **`generateStaticParams` returns `{ ProjectName }` but the route segment is `projectName`**, and it uses `data!`, which throws if the query fails. (`app/[lang]/projects/[projectName]/page.tsx`)
5. **NavBar links are relative** (`` `${lang}/projects` ``). On a nested page such as `/projects/foo` they resolve to `/projects/en/projects`. (`components/NavBar.tsx`)
6. **`ListItem` links to `/projects/${name}` with no locale prefix** and uses a plain `<a>`, so the user's explicit locale is dropped and the navigation is a full page load. (`components/ListItem.tsx`)
7. **`dictionary.ProjectInfo.NotFound` is never used.** The not-found state is Next's default English page. (`app/[lang]/projects/[projectName]/page.tsx`)
8. **Icon-only links and the theme toggle have no accessible name**: LinkedIn, GitHub and CV links on Home, and the clickable SVGs in `ThemeSwitch`, are not buttons or labelled. (`app/[lang]/page.tsx`, `components/ThemeSwitch.tsx`)
9. **Site `<title>` and description are Portuguese for every locale.** (`app/[lang]/layout.tsx`) Already covered by the dictionary ticket.
10. **Revalidate route**: `revalidatePath("/[lang]/projects")` passes a literal dynamic pattern, which may not invalidate `/en/projects` or `/pt-BR/projects`, and project detail pages are not covered. Also the header name `revalidate_key` contains an underscore, which some proxies drop. Needs verification against a running deployment before fixing. (`app/api/revalidate/route.ts`)
11. **`types_db.ts` is UTF-16 with CRLF**, which breaks plain-text tools. Goes away with the Supabase removal.
12. **Project page image `alt` is `image_path`** (a file name), not a description. (`app/[lang]/projects/[projectName]/page.tsx`)

## Ticket map

All tickets are in `.scratch/github-sourced-portfolio/issues/`.

| Finding | Ticket |
|---|---|
| 1 | 01 |
| 2 | 05 |
| 3 | 03, 04 (superseded) |
| 4 | 03 |
| 5 | 09 |
| 6 | 08 |
| 7 | 10 |
| 8 | 13 (links), 14 (theme toggle) |
| 9 | 10 |
| 10 | 06 |
| 11 | 04 |
| 12 | 03 |
