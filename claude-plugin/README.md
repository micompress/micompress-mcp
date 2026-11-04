# MiCompress plugin for Claude

Compress images, PDFs, videos, audio recordings, Office documents, EPUB books and archives
without leaving Claude. Ask Claude to "shrink this PDF so I can email it" or "optimize the
screenshots in ./assets for the web", and it picks the right tool and compression preset.

## Install

In Claude Code:

```
/plugin install micompress --marketplace micompress/micompress-mcp
```

## What it includes

- **`compress-files` skill** — tells Claude when to compress, which preset to use
  (`lossless`, `recommended`, `extreme`) and how to report the result.
- **`micompress-local` MCP server** — runs `npx -y micompress-mcp@0.1.0` on your machine
  (Node.js 18+). It reads the file at the path you give, uploads it to micompress.com over HTTPS,
  and writes the compressed copy next to the original.
- **`micompress` MCP server** — the hosted server at `https://micompress.com/mcp`. It downloads a
  file from a public link you give and returns a download link to the smaller copy.

## What is sent where

Every compression sends the file — read from the path you give, or downloaded from the link
you give — to micompress.com, the service operated by the plugin's author, and nowhere else.
Downloaded originals are deleted within about 10 minutes and compressed results within 24
hours. MiCompress does not receive your conversation. Details:
[privacy policy](https://micompress.com/privacy#mcp). No account is needed; limits for
anonymous use are listed at [micompress.com/mcp-server](https://micompress.com/mcp-server).

## Supported formats

JPG, PNG, WebP, GIF, HEIC, AVIF, TIFF, camera RAW, PSD, PDF, MP4, MOV, MKV, WebM, MP3, WAV, FLAC,
M4A, DOCX, XLSX, PPTX, EPUB, ZIP, 7Z, RAR and more.

## Support

support@micompress.com · [issues](https://github.com/micompress/micompress-mcp/issues)

## License

MIT
