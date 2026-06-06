const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlFiles = ["index.html", "menu.html", "policy.html"];
const jsFiles = ["js/main.js", "js/menu.js", "js/accessibility.js"];
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => failures.push(message);

for (const file of htmlFiles) {
  const html = read(file);
  if (!html.includes('http-equiv="Content-Security-Policy"')) {
    fail(`${file}: missing Content-Security-Policy meta tag`);
  }
  if (!html.includes('http-equiv="X-Content-Type-Options"')) {
    fail(`${file}: missing X-Content-Type-Options meta tag`);
  }
  if (!html.includes('name="referrer" content="strict-origin-when-cross-origin"')) {
    fail(`${file}: missing strict referrer policy`);
  }
  if (/<[^>]+\son[a-z]+\s*=/i.test(html)) {
    fail(`${file}: inline event handlers are not allowed`);
  }
  if (/href\s*=\s*["']\s*javascript:/i.test(html)) {
    fail(`${file}: javascript: URLs are not allowed`);
  }
  const blankLinks = [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)];
  for (const match of blankLinks) {
    const tag = match[0];
    if (!/rel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b/i.test(tag)) {
      fail(`${file}: target=_blank link must include rel="noopener noreferrer"`);
    }
  }
}

for (const file of jsFiles) {
  const js = read(file);
  if (/\beval\s*\(/.test(js) || /\bnew\s+Function\s*\(/.test(js)) {
    fail(`${file}: eval/new Function are not allowed`);
  }
  if (/innerHTML/.test(js) && !/escapeHTML|safeLocalAsset/.test(js)) {
    fail(`${file}: innerHTML usage must be paired with escaping/safe asset validation`);
  }
}

const mainJs = read("js/main.js");
const menuJs = read("js/menu.js");

if (!mainJs.includes("safeExternalUrl") || !mainJs.includes("safeLocalAsset")) {
  fail("js/main.js: missing URL or asset validation helpers");
}

if (!menuJs.includes("safeWhatsAppNumber") || !menuJs.includes("safeLocalAsset")) {
  fail("js/menu.js: missing WhatsApp or asset validation helpers");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Security smoke checks passed.");
