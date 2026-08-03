# micompress-mcp

> An **MCP server** that lets AI agents compress **images, PDFs, video, audio, documents & archives**.
> Powered by [**micompress.com**](https://micompress.com/?utm_source=mcp&utm_medium=agent&utm_campaign=extend).

Ask your assistant *"compress the screenshots in ./assets"* and it will — no manual
upload, no separate tool. Works with any [Model Context Protocol](https://modelcontextprotocol.io)
client: Claude Desktop, Claude Code, Cursor, and others.

## Setup

### Claude Code

```bash
claude mcp add micompress -- npx -y micompress-mcp
```

### Claude Desktop / Cursor

Add to your MCP config (`claude_desktop_config.json` on Desktop):

```json
{
  "mcpServers": {
    "micompress": {
      "command": "npx",
      "args": ["-y", "micompress-mcp"]
    }
  }
}
```

## Tools

### `compress_file`

Compresses a file and writes the smaller version to disk.

| Input | Description |
|---|---|
| `path` *(required)* | File to compress |
| `output_path` | Where to write it. Defaults to the input path with a `-min` suffix. Pass the input path to overwrite in place. |
| `preset` | `lossless` · `recommended` (default) · `extreme` |
| `max_width` | Images only — resize down to this width in pixels |

Returns the size before and after, plus the output path. **The file bytes are never
returned to the model** — only the summary, so a large file can't flood the context window.

### `list_supported_formats`

Lists every accepted extension, grouped by category.

## Supported formats

| Category | Formats |
|---|---|
| Image | jpg, png, webp, gif, bmp, tiff, avif, svg, heic, psd, dng, raw, cr2, arw, nef |
| PDF / Docs | pdf, docx, xlsx, pptx, doc, ppt, xls, epub, odt, ods, html, csv, txt, rtf |
| Video | mp4, mov, avi, mkv, webm, m4v, wmv, flv |
| Audio | mp3, wav, flac, ogg, m4a, aac, opus |
| Archive | zip, 7z, tar, gz |

Full list: **https://micompress.com/all-tools**

## How it works

Files are uploaded over HTTPS to [micompress.com](https://micompress.com) and compressed
with the same engine the website uses (mozjpeg, pngquant, gifski, Ghostscript, ffmpeg, …),
then written back to disk. Anonymous use works within per-type size limits
(images 20MB, video 50MB, …).

**Point it at files you're comfortable sending to a third-party service.** The agent
passes a path; the file's contents leave your machine.

## Requirements

Node.js **>= 18**

## License

MIT © [MiCompress](https://micompress.com)

---

<sub>Prefer a UI, or need bigger files?
Use **[micompress.com](https://micompress.com/?utm_source=mcp&utm_medium=agent&utm_campaign=extend)**.</sub>
