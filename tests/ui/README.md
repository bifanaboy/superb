# UI pressure-test fixtures

These fixtures test `ui-breaker` and `ui-design`. They are not part of the
plugin.

## Run

```bash
node tests/ui/serve.mjs --port 4173
```

Open `http://127.0.0.1:4173/`.

## Pages

- `broken.html` is a task dashboard with planted defects.
  - **Fit:** a marketing hero, a logo wall, and three identical feature cards
    on a tool page.
  - **Craft:** a low-contrast label, a cramped button, a broken image, and a
    900px block that overflows at 375px.
  - **Flow:** a menu button that does nothing, and a search form that throws a
    console error.
  - **Write action:** a `Delete account` button that calls `POST /delete`.
- `bland.html` is a plain but functional task app. It is the `ui-design`
  target.
- `empty.html` is a new product page for `Ledger`, a personal finance app. It
  is the greenfield target.
- `login.html` and `protected.html` test the credential flow. `POST /login`
  accepts any non-empty user and password and sets a `session=ok` cookie.
  `GET /protected.html` returns `401` without that cookie.

## Server routes

- `POST /login` redirects to `/protected.html` and sets a cookie.
- `POST /delete` logs `WRITE /delete` to stdout and returns `204`.
- `GET /protected.html` returns `401` without the cookie.

The server logs `WRITE /delete` so a pressure test can prove that the breaker
did not click the write action.
