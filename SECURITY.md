# Security Decisions

This project is a static restaurant website. It has no backend, no database, no authentication, no admin panel, no API endpoints, and no payment flow.

## Implemented Controls

- User-controlled menu/site data is rendered with `textContent` or escaped before `innerHTML`.
- Product image paths are allowlisted to local `assets/`, `photos/`, and `video/` folders.
- External URLs are allowlisted for WhatsApp, WhatsApp Business compatible links, Instagram, Google Maps, Waze, and O&H Tech.
- Phone and WhatsApp values are reduced to digits and length-checked before use.
- `target="_blank"` links use `rel="noopener noreferrer"`.
- Pages include a restrictive static Content Security Policy where possible.
- Pages include `X-Content-Type-Options` and strict referrer policy meta tags.
- Cart data is stored only in browser `localStorage`; no sensitive data is collected.
- Unavailable products remain visible but cannot be selected or sent.
- Automated security smoke checks are available in `tests/security-smoke.js`.

## Static-Site Limitations

These controls require an HTTP server or backend and cannot be fully enforced by HTML files alone:

- HSTS
- X-Frame-Options HTTP header
- Server-side rate limiting
- CSRF tokens
- Server-side validation
- RBAC
- Password hashing
- JWT/session security
- Audit trails
- File-upload scanning
- Database parameterized queries

If this site is later moved behind a backend, these controls must be implemented server-side before production release.

## Required Hosting Headers

Configure the hosting provider, CDN, or web server to send:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
```

## Manual Data Rules

When editing `data/menu.js` or `data/site.js`:

- Do not paste scripts, HTML, or unknown external URLs.
- Use only local image paths such as `photos/item.jpg`.
- Use `available: 1` for available products and `available: 0` for unavailable products.
- Keep phone and WhatsApp values as digits only.
