# 06: Revalidation covers the Locale pages and project pages

**What to build:** Calling the protected revalidation endpoint refreshes every Locale's Projects list and every Project page, so edits appear without a redeploy. Today it revalidates a literal dynamic pattern, which may not match `/en/projects` or `/pt-BR/projects`, and it does not touch Project pages at all. The endpoint's secret header name contains an underscore, which some proxies drop; decide whether to keep it.

**Spec:** github-sourced-portfolio. Bug sweep finding 10 (needs verification on a real deployment).

**Blocked by:** 03: Projects from GitHub on the live pages

**Status:** ready-for-agent

- [ ] After a change in GitHub and a call to the endpoint, the Projects list in each Locale shows it on the next request
- [ ] The same holds for a Project detail page in each Locale
- [ ] A request with a missing or wrong key still gets a 401 and refreshes nothing
- [ ] The header name is checked against the hosting proxy; if it can be dropped, it is renamed and the change is documented
- [ ] Verified against a running production build or deployment, not only the dev server; the owner is asked to confirm on the deployed site
