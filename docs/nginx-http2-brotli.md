# nginx: enable HTTP/2 + brotli (perf A1)

Apply on the EC2 host (`ubuntu@13.60.31.3`). These are the two network-layer wins
that don't require a CDN. **Test in a staging server block first if possible.**

Current state (measured from prod): TLS is served over **HTTP/1.1** and responses
are **gzip only**. The landing pulls 20 JS chunks + 2 CSS; HTTP/1.1 caps parallel
downloads at ~6 connections, so multiplexing (HTTP/2) is a real win.

## 1. HTTP/2

In the site's `server { … }` block for port 443, add `http2` to the `listen` line:

```nginx
# before
listen 443 ssl;
listen [::]:443 ssl;

# after
listen 443 ssl;
listen [::]:443 ssl;
http2 on;          # nginx >= 1.25.1 (this box runs 1.28) — directive form
```

> On nginx ≥ 1.25.1 use the standalone `http2 on;` directive (as above).
> On older nginx use the inline form: `listen 443 ssl http2;`.

Reload and verify:

```bash
sudo nginx -t && sudo systemctl reload nginx
# from any machine:
curl --http2 -sI https://cyborgmen.com/ | head -1   # expect: HTTP/2 200
```

## 2. brotli

Requires the `ngx_brotli` module. Check first:

```bash
nginx -V 2>&1 | tr ' ' '\n' | grep -i brotli    # is it compiled in?
ls /usr/lib/nginx/modules/ | grep brotli          # or available as a dynamic module?
```

- If present as a dynamic module, load it at the top of `nginx.conf`:
  ```nginx
  load_module modules/ngx_http_brotli_filter_module.so;
  load_module modules/ngx_http_brotli_static_module.so;
  ```
- If not present on Ubuntu: `sudo apt-get install libnginx-mod-http-brotli` (package
  name varies by distro/PPA) then load the modules as above.

Then in `http { … }` (alongside the existing gzip config), add:

```nginx
brotli on;
brotli_comp_level 5;
brotli_types
  text/plain text/css application/javascript application/json
  image/svg+xml application/xml font/woff2 application/wasm;
brotli_static on;   # serve precompressed .br files when present (Next static assets)
```

Reload and verify:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -H 'Accept-Encoding: br' -sI https://cyborgmen.com/_next/static/... | grep -i content-encoding
# expect: content-encoding: br
```

## 3. (While you're in there) serve `/_next/static` directly

Confirm `/_next/static/`, `/videos/`, `/assets/` are served by nginx from disk with
the immutable cache headers, **not** proxied through the Node/pm2 process — static
files through Node add latency and CPU. If they currently fall through to the Next
`proxy_pass`, add a `location /_next/static/ { root /path/to/.next/...; ... }` (or an
alias) so nginx serves them. The app already sets `Cache-Control: immutable` on hashed
chunks, so nginx just needs to pass them through.
