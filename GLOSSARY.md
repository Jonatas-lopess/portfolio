# Portfolio

A personal portfolio site that presents the owner's projects and CV to visitors in several locales, without exposing private or commercial code.

## Language

### Projects

**Project**:
A piece of the owner's work shown on the site, backed by exactly one GitHub repo.
_Avoid_: Repo (when meaning the showcased work), item, entry, work

**Allowlist**:
The public list of repos that may appear as Projects, each with a Visibility. A repo not on it is Hidden.
_Avoid_: Whitelist, manifest, registry

**Visibility**:
How much of a Project the site reveals: Full, Showcase, or Hidden.
_Avoid_: Access level, privacy

**Full**:
A Visibility where the Project is listed and links to its code, allowed only when the repo is public.
_Avoid_: Open, public project

**Showcase**:
A Visibility where the Project is listed with its summary, stack, screenshot and demo link but no code link. The default.
_Avoid_: Preview, teaser

**Hidden**:
A Visibility where the Project is not on the Allowlist, so nothing about it appears anywhere.
_Avoid_: Private project, unlisted

**Project summary**:
The prose describing a Project, taken from the marked block of its README.
_Avoid_: Resume, description (that is the repo's short GitHub description), overview

**Marked block**:
The part of a README the owner has explicitly opted in to the site; nothing outside it is ever shown.
_Avoid_: Excerpt, section

**Screenshot**:
The single image that represents a Project, kept at a fixed path in the Project's repo.
_Avoid_: Thumbnail, cover, banner

**Code access**:
A GitHub collaborator invite that lets a specific person read a private Project's code.
_Avoid_: Whitelisting, permission, login

**Project index**:
The Projects page's list of Project names that reveals a Project's Screenshot on hover.
_Avoid_: Project showcase (clashes with the Showcase Visibility), gallery

### Locales

**CV**:
The owner's downloadable résumé document.
_Avoid_: Resume, résumé (the old UI label "Resume" meant Project summary, not this)

**Profile links**:
The owner's LinkedIn, GitHub and CV links, shown icons-only on Home and labelled on About.
_Avoid_: Social links, contact links, socials

**Locale**:
A language the site can be presented in, such as `en` or `pt-BR`.
_Avoid_: Language, lang

**Source text**:
The English text from which every other Locale's text is derived.
_Avoid_: Original, master copy

**Dictionary**:
All the interface strings of one Locale, including the About bio.
_Avoid_: Translations file, strings

**Translation**:
A Locale's rendering of one piece of Source text, produced by a machine or written by hand.
_Avoid_: Localization, version

**Stale translation**:
A Translation whose Source text has changed since it was made.
_Avoid_: Outdated, out of sync

**Sync**:
The owner-run, on-demand job that fetches Screenshots and produces Translations for review.
_Avoid_: Build step, import, update
