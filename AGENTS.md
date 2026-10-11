# AGENTS.md

Instructions for AI coding agents (and a quick start for people) working in this repository.

## Before you change anything

1. Read sections 0 to 4 of [`project_context.md`](project_context.md). It is the single source of truth for this product: the customer site in this repo, and the backend API and staff admin panel in the companion repo.
2. Follow the golden rules in section 2. Each one records a client decision or a past incident; do not "simplify" them away.
3. Check section 17 before fixing an open item. Many of them wait for an owner decision and must not be implemented unprompted.
4. Check `git status` and `git log -1` before you write: commits made outside your work have appeared mid-session here.

## After every change

1. Add a changelog entry at the top of section 20 (template in section 0.5): date, branch, title, What / Why / Verified / Follow-ups.
2. Fix every section the change made stale.
3. Update the open-items list in section 17: add what you found, move what you resolved to "recently resolved". Ids are never reused.
4. Bump "Last updated" in the header (date, branch, commit).

If the code and the handbook disagree, the code wins: correct the handbook and say so in the changelog entry.

## Never

- Never handle secrets. Do not open or print `.env`, `.env.local`, keystores or private keys (`.env.example` is fine). Do not write a secret value or personal data into code, tests, logs or the handbook.
- Never commit, push or merge unless asked in that turn. Leave changes in the working tree; the owner reviews, commits and merges.
- Never run anything that opens a database connection or writes to production (details in section 2.6 of the handbook).
