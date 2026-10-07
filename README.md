# TalentLink Codespaces startup

This setup is designed so the repository can be opened from another computer and the whole TalentLink stack can be started with one command.

## One-time setup

Put these files into the repository:

```text
talent-link-ai/
├── start-talentlink.sh
└── .devcontainer/
    └── devcontainer.json
```

Then commit and push them.

In the Codespace, rebuild once:

```bash
Ctrl+Shift+P
Dev Containers: Rebuild Container
```

## Normal startup

From the repository root:

```bash
bash start-talentlink.sh
```

The script starts:

```text
Django  →  0.0.0.0:8000
React   →  0.0.0.0:3000
```

The devcontainer configuration automatically forwards both ports and is configured so port 3000 opens the application in a browser when it is first auto-forwarded.

## Important portability fix

The existing project used a browser API base pointing at `127.0.0.1:8000`. That works only when the browser can reach the local forwarded backend exactly that way.

The startup script makes the existing CRA client Codespaces-safe by:

1. changing known hard-coded `127.0.0.1:8000/api/` or `localhost:8000/api/` references in `axiosInstance.js` to `/api/`
2. adding the CRA development proxy:
   `http://127.0.0.1:8000`

The browser therefore calls:

```text
https://<codespace>-3000.<forwarding-domain>/api/...
```

and React forwards `/api/...` internally to Django.

This avoids hard-coding a Codespace-specific hostname and avoids browser-side localhost problems.

A backup is created as:

```text
client/src/utils/axiosInstance.js.bak
```

when the script changes that file.

## OTP during development

The project currently uses Django's console email backend. OTP output therefore appears in the Django/backend terminal when registration succeeds. It is not sent to Gmail until a real SMTP/email provider is configured.
