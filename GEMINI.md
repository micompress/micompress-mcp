# MiCompress

The `micompress` MCP server compresses files on this machine through micompress.com.

- `compress_file` takes a file path and writes the smaller copy next to it with a `-min`
  suffix (or to `output_path`). Presets: `lossless` keeps quality identical,
  `recommended` (default) balances size and quality, `extreme` gives the smallest file.
  `max_width` resizes images.
- `list_supported_formats` lists the extensions it accepts: images (JPG, PNG, WebP, GIF,
  HEIC, RAW, PSD…), PDF, video, audio, Office documents, EPUB and archives.

The file is uploaded to micompress.com over HTTPS to be compressed; originals are deleted
within minutes and results within 24 hours (https://micompress.com/privacy#mcp).
