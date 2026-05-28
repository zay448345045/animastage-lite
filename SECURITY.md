# Security Policy

AnimaStage Lite is an open-source, client-side web application. Security issues in this repository are taken seriously. Please report them responsibly so we can fix them before public disclosure.

## Supported Versions

Security fixes are provided for the **latest release** on the default branch (`main`). Older tags may receive fixes at maintainer discretion.

| Version   | Supported |
| --------- | --------- |
| 1.0.x     | ✅ Yes    |
| &lt; 1.0  | ❌ No     |

Pre-release builds, forks, and unmerged branches are **not** officially supported.

## What We Consider In Scope

Issues that affect **this repository** when running the app as documented (`npm run dev` / static `dist/`):

- Cross-site scripting (XSS) or unsafe HTML/script injection in the UI
- Unsafe handling of user-supplied files (PMX, PMD, VMD, textures, HDR, video) that leads to code execution or serious data exposure in the browser
- Authentication or session flaws in **built-in collab** (Local / WebRTC) that allow unauthorized control of another user’s session
- Dependency vulnerabilities in **direct** production dependencies, when exploitable in AnimaStage Lite’s usage
- Misleading or dangerous defaults that cause predictable harm (e.g. exposing secrets in shipped builds)

## Out of Scope

Please **do not** open public issues for the following (they may be closed without a fix):

- Reports about **third-party MMD assets** (models, motions, textures) you downloaded — verify the asset author
- Bugs in **upstream** libraries only (Three.js, Vite, yjs, etc.) — report to those projects; we still welcome links if our integration is at fault
- **Denial of service** from very large PMX/VMD files or extreme GPU load (expected for heavy 3D in-browser)
- Issues that require the victim to **paste a malicious API key** or run a modified build you supplied
- **`VITE_*` secrets in the client bundle** — by design, Vite embeds `VITE_` variables in frontend code. Do not put production secrets in `.env` for public deployments; use a backend proxy for sensitive keys (e.g. Gemini)
- Vulnerabilities in **deployments** you host (misconfigured CDN, missing HTTPS, old Node on a custom server) unless caused by this repo’s default build output
- The **`android/`** folder unless you clearly show the same flaw exists in the web app and affects users

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

### Preferred: GitHub Private Security Advisory

1. Open the repository on GitHub.
2. Go to **Security** → **Advisories** → **Report a vulnerability**.
3. Describe the issue, steps to reproduce, impact, and affected version (e.g. `1.0.0`).

### Alternative: Email

If private advisories are unavailable, email the maintainer (replace with your contact when publishing):

**security@YOUR_DOMAIN** — subject: `[AnimaStage Lite] Security report`

Include:

- Summary and severity (your assessment)
- Steps to reproduce (minimal PoC)
- Browser/OS and commit hash or release tag
- Whether you believe `VITE_GEMINI_API_KEY` or collab signaling is involved

## What to Expect

| Step | Timeline (goal) |
|------|------------------|
| Acknowledgment | Within **7 days** |
| Initial triage / severity | Within **14 days** |
| Fix or planned fix | Depends on severity; critical issues prioritized |

We may:

- **Accept** the report and prepare a patch + advisory release
- **Decline** if out of scope or not reproducible (with a short explanation)
- **Ask for more information** before deciding

We ask reporters to **allow reasonable time** for a fix before public disclosure (typically **90 days**, shorter for critical active exploitation if we agree).

Credit: with your permission, we may thank you in the release notes or advisory.

## Safe Harbor

We support good-faith security research on supported versions. Do not access data you do not own, disrupt services, or violate applicable law. Testing should use your own models and a local or staging instance.

## Security Best Practices for Users

- Do not commit `.env` or share `VITE_GEMINI_API_KEY` in screenshots or streams
- Use only MMD content you trust; malicious models are a content risk, not only an app bug
- For public sites, serve `dist/` over **HTTPS**
- For WebRTC collab, use trusted signaling servers (`VITE_COLLAB_SIGNALING`)

## License

This project is open source. Security reports do not grant a separate license to project code; follow the repository **LICENSE** file for usage terms.
