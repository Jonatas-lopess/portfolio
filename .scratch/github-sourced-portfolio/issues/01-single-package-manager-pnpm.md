# 01: One package manager (pnpm) and a working lockfile

**What to build:** The repo installs reproducibly with a single package manager, pnpm. Today `npm ci` fails because `package-lock.json` is out of sync with `package.json`, and a second lockfile (`yarn.lock`) is also committed. This is the prefactor for everything else: adding a test runner would otherwise regenerate an already broken lockfile.

**Spec:** github-sourced-portfolio. Bug sweep finding 1.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A frozen-lockfile `pnpm install` succeeds on a clean checkout
- [ ] `package-lock.json` and `yarn.lock` are removed; exactly one lockfile (pnpm's) is committed
- [ ] The project declares pnpm as its package manager so tools and the host pick it up
- [ ] Dev, build, start and lint scripts still run under pnpm; typecheck and lint stay clean
- [ ] `CLAUDE.md` commands and the lockfile note are updated to pnpm
- [ ] No dependency versions change other than what the lockfile regeneration requires
