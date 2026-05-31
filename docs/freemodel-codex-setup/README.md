# Freemodel + Codex CLI Local Setup (for Claude Code / Codex)

This folder contains the exact files you need for your local Windows machine.

## Step 1: Create the directory
```
C:\Users\<your-username>\.codex
```

## Step 2: auth.json
Delete any existing `auth.json`, then create a new one at:

`C:\Users\<your-username>\.codex\auth.json`

Paste exactly:

```json
{
  "OPENAI_API_KEY": "fe_oa_9cc5fb650ab86697b9992265f4774bc1d0a03ff85f496008"
}
```

## Step 3: config.toml
Delete any existing `config.toml`, then create a new one at:

`C:\Users\<your-username>\.codex\config.toml`

Paste exactly:

```toml
model_provider = "freemodel"
model = "gpt-5.4"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.freemodel]
name = "freemodel"
base_url = "https://api.freemodel.dev/v1"
wire_api = "responses"
```

## Notes
- This key + config is intended for the local Codex / Claude Code tool.
- The Lumina floating assistant (server-side) uses direct calls to https://api.freemodel.dev/v1/chat/completions with model `gpt-5.4`.
- Available models on this key: `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex`.
- The Lumina production env vars are set separately via Vercel (FREEMODEL_API_KEY, FREEMODEL_BASE_URL, FREEMODEL_MODEL).
