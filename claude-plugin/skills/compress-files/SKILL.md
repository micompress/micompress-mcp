---
name: compress-files
description: Shrink images, PDFs, videos, audio recordings, Office documents and archives with MiCompress — for email attachment limits, faster web pages, or sharing. Use when the user asks to compress, shrink, optimize or reduce the size of a file.
---

# Compress files with MiCompress

Two MiCompress servers come with this plugin. Pick by where the file is:

- **File on this computer** (a path such as `./assets/photo.png`): use the local server's
  `compress_file`. It writes the smaller copy next to the original with a `-min` suffix, or to
  `output_path` if the user names one. Only overwrite the original when the user asks for it.
- **File at a public link** (a direct download link, or a Google Drive or Dropbox share link):
  use `compress_file_from_url`. It returns a download link valid for 24 hours. If the result says
  the job is still processing, call `get_compression_result` with its job ID after a short wait.

Choosing a preset:

| Goal | Preset |
| --- | --- |
| Keep quality identical (print, archives, legal documents) | `lossless` |
| Everyday use — the default | `recommended` |
| Smallest possible file, e.g. to get under an email limit | `extreme` |

For images headed to a web page, also pass `max_width` (for example 1600 for full-width
images, 800 for thumbnails).

After compressing, tell the user the size before and after and where the result is. If a format
is rejected, call `list_supported_formats` and say which formats are supported.
