/**
 * Copy newTag (and optionally newName) from one overlay kustomization to another
 * for matching Kustomize image `name:` entries — same artifact tags on dev → prod.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function usage() {
  console.error(
    "Usage: node sync-overlay-tags.mjs --from <dev/kustomization.yaml> --to <prod/kustomization.yaml>",
  );
  process.exit(1);
}

function parseArgs(argv) {
  const fromIdx = argv.indexOf("--from");
  const toIdx = argv.indexOf("--to");
  if (fromIdx === -1 || toIdx === -1) usage();
  const fromFile = argv[fromIdx + 1];
  const toFile = argv[toIdx + 1];
  if (!fromFile || !toFile) usage();
  return { fromFile: path.resolve(fromFile), toFile: path.resolve(toFile) };
}

function stripYamlString(value) {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

/** @returns {Map<string, { newName: string | null, newTag: string | null }>} */
function extractImageMap(content) {
  const lines = content.split(/\r?\n/);
  let imagesStart = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^images:\s*$/.test(lines[i] ?? "")) {
      imagesStart = i;
      break;
    }
  }
  const map = new Map();
  if (imagesStart === -1) return map;

  let imagesEnd = lines.length;
  for (let i = imagesStart + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (line.trim() === "") continue;
    if (/^[A-Za-z0-9_-]+:\s*$/.test(line)) {
      imagesEnd = i;
      break;
    }
  }

  const entryStarts = [];
  for (let i = imagesStart + 1; i < imagesEnd; i += 1) {
    if (/^-\s*name:\s*/.test(lines[i] ?? "")) entryStarts.push(i);
  }
  entryStarts.push(imagesEnd);

  for (let e = 0; e < entryStarts.length - 1; e += 1) {
    const start = entryStarts[e];
    const end = entryStarts[e + 1];
    let imageName = null;
    let newName = null;
    let newTag = null;
    for (let i = start; i < end; i += 1) {
      const line = lines[i] ?? "";
      const nm = line.match(/^-\s*name:\s*(.+)\s*$/);
      if (nm) imageName = stripYamlString(nm[1] ?? "");
      const nn = line.match(/^\s*newName:\s*(.+)\s*$/);
      if (nn) newName = stripYamlString(nn[1] ?? "");
      const nt = line.match(/^\s*newTag:\s*(.+)\s*$/);
      if (nt) newTag = stripYamlString(nt[1] ?? "");
    }
    if (imageName) {
      map.set(imageName, { newName, newTag });
    }
  }
  return map;
}

function applyMapToOverlay(content, sourceMap) {
  const lines = content.split(/\r?\n/);
  let imagesStart = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^images:\s*$/.test(lines[i] ?? "")) {
      imagesStart = i;
      break;
    }
  }
  if (imagesStart === -1) return { output: content, updated: 0 };

  let imagesEnd = lines.length;
  for (let i = imagesStart + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (line.trim() === "") continue;
    if (/^[A-Za-z0-9_-]+:\s*$/.test(line)) {
      imagesEnd = i;
      break;
    }
  }

  const entryStarts = [];
  for (let i = imagesStart + 1; i < imagesEnd; i += 1) {
    if (/^-\s*name:\s*/.test(lines[i] ?? "")) entryStarts.push(i);
  }
  entryStarts.push(imagesEnd);

  let updated = 0;
  // Walk bottom-to-top so optional `splice` inserts do not shift earlier entries.
  for (let e = entryStarts.length - 2; e >= 0; e -= 1) {
    const start = entryStarts[e];
    const end = entryStarts[e + 1];
    let imageName = null;
    let newNameLineIdx = null;
    let newTagLineIdx = null;
    for (let i = start; i < end; i += 1) {
      const line = lines[i] ?? "";
      const nm = line.match(/^-\s*name:\s*(.+)\s*$/);
      if (nm) imageName = stripYamlString(nm[1] ?? "");
      if (/^\s*newName:\s*/.test(line)) newNameLineIdx = i;
      if (/^\s*newTag:\s*/.test(line)) newTagLineIdx = i;
    }
    if (!imageName) continue;
    const src = sourceMap.get(imageName);
    if (!src) continue;

    if (src.newName && newNameLineIdx !== null) {
      const line = lines[newNameLineIdx] ?? "";
      const prefix = line.replace(/(\s*newName:\s*).*/, "$1");
      lines[newNameLineIdx] = `${prefix}${src.newName}`;
      updated += 1;
    }
    if (src.newTag) {
      if (newTagLineIdx !== null) {
        const line = lines[newTagLineIdx] ?? "";
        const prefix = line.replace(/(\s*newTag:\s*).*/, "$1");
        lines[newTagLineIdx] = `${prefix}${src.newTag}`;
        updated += 1;
      } else if (newNameLineIdx !== null) {
        const insertAfter = newNameLineIdx;
        lines.splice(insertAfter + 1, 0, `    newTag: ${src.newTag}`);
        updated += 1;
      }
    }
  }

  return { output: lines.join("\n"), updated };
}

const { fromFile, toFile } = parseArgs(process.argv.slice(2));
const fromRaw = fs.readFileSync(fromFile, "utf8");
const toRaw = fs.readFileSync(toFile, "utf8");
const map = extractImageMap(fromRaw);
const { output, updated } = applyMapToOverlay(toRaw, map);
fs.writeFileSync(toFile, output, "utf8");
console.log(`Synced ${updated} field(s) from ${fromFile} → ${toFile}`);
