# 11: Approve the proofread English bio

**What to build:** The English About bio is the Source text for every translation, and it currently has errors ("Im a formed Computer technician…"). The agent drafts a corrected version; the owner reads it, edits anything that does not sound like them, and approves it. The approved text becomes the English Dictionary entry. Nothing is translated until this is done.

**Spec:** github-sourced-portfolio. Decided in the design interview (Q22).

**Blocked by:** 10: Dictionary: typed English source with every string moved in

**Status:** done

- [x] A corrected English bio is drafted and shown to the owner next to the current text
- [x] The owner approves or edits the draft
- [x] The approved text is written into the English Dictionary
- [x] The existing Portuguese bio is not changed unless the owner asks (the owner asked: see Comments)

## Comments

- The owner replaced the bio with the summary from their current CV instead of the proofread draft. The English text is the CV summary verbatim (it needed no corrections); the Portuguese bio is now the summary from the Portuguese CV, also verbatim, at the owner's request.
- The old bio's education line (Universidade de Vassouras) and Unimed work are no longer on the About page, by the owner's choice.
- Two CVs now ship, one per Locale: `public/cv/en.pdf` and `public/cv/pt-BR.pdf`. `cvPath(locale)` in `lib/profile-links.ts` picks the file and falls back to the default Locale's CV. The old `/curriculo-jonatas.pdf` was removed.
