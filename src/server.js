#!/usr/bin/env node
'use strict';

/**
 * MiCompress MCP server (stdio).
 *
 * Exposes file compression to MCP-capable agents (Claude Desktop, Claude Code,
 * Cursor, …). The agent hands over a path; the file is compressed through the
 * MiCompress API and written back to disk. Only the summary goes back to the
 * model — never the file bytes, which would flood the context window for no
 * benefit.
 */

const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const { compressFile, CompressError, DEFAULT_BASE } = require('./api');
const { EXT_CATEGORY, categoryFor, extOf } = require('./categories');
const pkg = require('../package.json');

const PRESETS = ['lossless', 'recommended', 'extreme'];

function humanSize(n) {
  if (n == null) return '?';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)}${u[i]}`;
}

/** MCP tool errors are returned in-band so the model can read and react to them. */
function toolError(message) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

const server = new McpServer(
  { name: 'micompress', version: pkg.version },
  { instructions:
      'Compress images, PDFs, video, audio, documents and archives via micompress.com. ' +
      'Use compress_file when the user asks to shrink, compress or optimize a file they ' +
      'name by path. Call list_supported_formats first if unsure whether a format is supported.' },
);

server.registerTool(
  'compress_file',
  {
    title: 'Compress a file',
    description:
      'Compress an image, PDF, video, audio file, document or archive and write the ' +
      'smaller version to disk. Returns the size before and after. The file is uploaded ' +
      'to micompress.com over HTTPS to be compressed.',
    inputSchema: {
      path: z.string().describe('Absolute or relative path of the file to compress.'),
      output_path: z.string().optional()
        .describe('Where to write the result. Defaults to the input path with a "-min" suffix. Pass the input path to overwrite in place.'),
      preset: z.enum(PRESETS).optional()
        .describe('lossless keeps quality identical; recommended (default) balances size and quality; extreme prioritises the smallest file.'),
      max_width: z.number().int().positive().optional()
        .describe('Images only: resize down to this width in pixels.'),
    },
  },
  async ({ path: inputPath, output_path: outputPath, preset, max_width: maxWidth }) => {
    if (!fs.existsSync(inputPath)) return toolError(`File not found: ${inputPath}`);

    const stat = fs.statSync(inputPath);
    if (!stat.isFile()) return toolError(`Not a file: ${inputPath}`);
    if (stat.size === 0) return toolError(`File is empty: ${inputPath}`);

    if (!categoryFor(inputPath)) {
      return toolError(
        `Unsupported file type ".${extOf(inputPath) || '?'}". ` +
        'Call list_supported_formats to see what can be compressed.',
      );
    }

    let result;
    try {
      result = await compressFile(inputPath, { preset, maxWidth });
    } catch (err) {
      const msg = err instanceof CompressError ? err.message : (err && err.message) || String(err);
      return toolError(`Compression failed: ${msg}`);
    }

    const { buffer, meta } = result;
    let dest = outputPath;
    if (!dest) {
      const ext = path.extname(inputPath);
      dest = path.join(
        path.dirname(inputPath),
        `${path.basename(inputPath, ext)}-min${ext}`,
      );
    }

    try {
      fs.mkdirSync(path.dirname(path.resolve(dest)), { recursive: true });
      fs.writeFileSync(dest, buffer);
    } catch (err) {
      return toolError(`Compressed successfully but could not write to ${dest}: ${err.message}`);
    }

    // Text only — returning the compressed bytes would blow up the context window.
    return {
      content: [{
        type: 'text',
        text:
          `Compressed ${path.basename(inputPath)} → ${dest}\n` +
          `${humanSize(meta.inputSize)} → ${humanSize(meta.outputSize)} ` +
          `(${meta.savedPercent}% smaller, saved ${humanSize(meta.savedBytes)})` +
          (meta.note ? `\nNote: ${meta.note}` : ''),
      }],
      structuredContent: {
        output_path: dest,
        input_size: meta.inputSize,
        output_size: meta.outputSize,
        saved_bytes: meta.savedBytes,
        saved_percent: meta.savedPercent,
        format: meta.format,
      },
    };
  },
);

server.registerTool(
  'list_supported_formats',
  {
    title: 'List supported formats',
    description: 'List the file extensions that compress_file accepts, grouped by category.',
    inputSchema: {},
  },
  async () => {
    const byCategory = {};
    for (const [ext, category] of Object.entries(EXT_CATEGORY)) {
      (byCategory[category] ||= []).push(ext);
    }
    const lines = Object.entries(byCategory)
      .map(([category, exts]) => `${category}: ${exts.sort().join(', ')}`);
    return {
      content: [{ type: 'text', text: lines.join('\n') }],
      structuredContent: { categories: byCategory },
    };
  },
);

async function main() {
  await server.connect(new StdioServerTransport());
  // stdout is the MCP transport — anything written there corrupts the protocol.
  process.stderr.write(`micompress-mcp ${pkg.version} ready (API: ${DEFAULT_BASE})\n`);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});
