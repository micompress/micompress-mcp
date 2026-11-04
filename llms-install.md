# Installing the MiCompress MCP server (for AI agents)

MiCompress compresses images, PDFs, video, audio, Office documents and archives.
There are two ways to connect it. Pick based on where the user's files are.

## Option A — local server (files on this computer) — recommended for Cline

Requires Node.js 18+. Nothing to clone or build; `npx` fetches the package.

Add this entry to the MCP settings file (for Cline: `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "micompress": {
      "command": "npx",
      "args": ["-y", "micompress-mcp"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Tools: `compress_file` (path, optional `output_path`, `preset`, `max_width`) writes the
compressed copy next to the original with a `-min` suffix; `list_supported_formats`.

## Option B — hosted server (files reachable by URL)

No installation. Add a remote server:

```json
{
  "mcpServers": {
    "micompress-remote": {
      "type": "streamableHttp",
      "url": "https://micompress.com/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Tools: `compress_file_from_url` (public `url`, optional `filename`, `preset`, `max_width`)
returns a download link valid for 24 hours; `get_compression_result` (`job_id`) for long
jobs; `list_supported_formats`.

## API key (optional)

Works anonymously within per-format size limits. For larger files the user can create a
free key at https://micompress.com/account and set it as:

- Option A: `"env": { "MICOMPRESS_API_KEY": "mc_..." }` in the server entry
- Option B: `"headers": { "X-API-Key": "mc_..." }` in the server entry

Never ask the user to paste the key into the chat; have them edit the settings file.

## Verify

Ask the server to `list_supported_formats`. For a quick end-to-end test with Option B,
compress `https://micompress.com/samples/photo.jpg`.
