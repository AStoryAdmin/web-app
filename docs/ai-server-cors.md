# For whoever runs the AI server: let the web app call it

The web app (app.astoryapp.com) calls the same AI server as the phone app, for example `POST /api/memory/help` (Tidy, Suggest a title, Ask me questions). Browsers block those calls today: the server answers the CORS preflight without an `Access-Control-Allow-Origin` header. The phone app is unaffected, because native apps don't do CORS.

## What to change

Answer `OPTIONS` and the real request with these headers when the `Origin` is one of the allowed origins:

```
Access-Control-Allow-Origin: <the request's Origin, echoed>
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: authorization, content-type
Access-Control-Max-Age: 86400
Vary: Origin
```

Allowed origins:

```
https://app.astoryapp.com
http://localhost:5180
```

Add the Cloudflare Pages preview domain too (`https://<project>.pages.dev`) if previews should work.

Nothing else changes: the same bearer token, the same request and response bodies (`phone-app/docs/memory-help-for-server.md`).

## How to check

Send a preflight the way a browser does, with the server's address in place of `<AI server>`:

```bash
curl -i -X OPTIONS "<AI server>/api/memory/help" -H "Origin: https://app.astoryapp.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization, content-type"
```

It should return 204 or 200 with the headers above.

When it works, set `VITE_TIDY_FROM_SERVER=1` in the web app's environment. The memory page then reads spoken memories through the server's tidy pass, cached in the reader's browser.
