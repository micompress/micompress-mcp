'use strict';
/**
 * Drives the server over a real stdio MCP session using the SDK's own client —
 * this exercises the actual protocol handshake, not just "the process starts".
 *
 * Hits the live API, so it needs network access. Run: node test/protocol.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SERVER = path.join(__dirname, '..', 'src', 'server.js');

// A 1x1 PNG — small enough to keep the test fast, real enough for the API.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

(async () => {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'micompress-mcp-'));
  const client = new Client({ name: 'micompress-test', version: '0.0.0' });

  await client.connect(new StdioClientTransport({ command: process.execPath, args: [SERVER] }));

  try {
    // --- handshake + tool discovery ---------------------------------------
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    assert.deepStrictEqual(names, ['compress_file', 'list_supported_formats'], names.join(','));

    const compress = tools.find((t) => t.name === 'compress_file');
    assert.ok(compress.description.length > 0, 'compress_file needs a description');
    assert.ok(compress.inputSchema.properties.path, 'compress_file must accept a path');
    assert.deepStrictEqual(compress.inputSchema.required, ['path'],
      'only path should be required');

    // --- list_supported_formats -------------------------------------------
    const formats = await client.callTool({ name: 'list_supported_formats', arguments: {} });
    assert.ok(!formats.isError);
    const cats = formats.structuredContent.categories;
    assert.ok(cats.image.includes('png'), 'png must be listed as an image format');
    assert.ok(cats.pdf.includes('pdf'));

    // --- unsupported extension is an in-band error, not a crash -----------
    const badPath = path.join(tmp, 'notes.xyz');
    fs.writeFileSync(badPath, 'hello');
    const unsupported = await client.callTool({ name: 'compress_file', arguments: { path: badPath } });
    assert.strictEqual(unsupported.isError, true, 'unsupported type must set isError');
    assert.match(unsupported.content[0].text, /Unsupported file type/);

    // --- missing file ------------------------------------------------------
    const missing = await client.callTool({
      name: 'compress_file',
      arguments: { path: path.join(tmp, 'does-not-exist.png') },
    });
    assert.strictEqual(missing.isError, true);
    assert.match(missing.content[0].text, /File not found/);

    // --- empty file --------------------------------------------------------
    const emptyPath = path.join(tmp, 'empty.png');
    fs.writeFileSync(emptyPath, Buffer.alloc(0));
    const empty = await client.callTool({ name: 'compress_file', arguments: { path: emptyPath } });
    assert.strictEqual(empty.isError, true);
    assert.match(empty.content[0].text, /empty/i);

    // --- happy path against the live API ----------------------------------
    const src = path.join(tmp, 'pixel.png');
    fs.writeFileSync(src, TINY_PNG);
    const ok = await client.callTool({
      name: 'compress_file',
      arguments: { path: src, preset: 'extreme' },
    });
    assert.ok(!ok.isError, `compress failed: ${ok.content?.[0]?.text}`);

    const out = ok.structuredContent.output_path;
    assert.strictEqual(out, path.join(tmp, 'pixel-min.png'), 'default suffix should be -min');
    assert.ok(fs.existsSync(out), 'output file must exist on disk');
    assert.ok(fs.statSync(out).size > 0, 'output file must not be empty');
    assert.strictEqual(ok.structuredContent.input_size, TINY_PNG.length);
    // The response must describe the result, not carry the bytes.
    assert.ok(!JSON.stringify(ok.content).includes('base64'),
      'file bytes must never be returned to the model');

    // --- explicit output_path ---------------------------------------------
    const dest = path.join(tmp, 'nested', 'custom.png');
    const custom = await client.callTool({
      name: 'compress_file',
      arguments: { path: src, output_path: dest },
    });
    assert.ok(!custom.isError, `explicit output_path failed: ${custom.content?.[0]?.text}`);
    assert.ok(fs.existsSync(dest), 'must create missing parent directories');

    console.log('ok — mcp-server: protocol, discovery, errors and compression all passed');
  } finally {
    await client.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
