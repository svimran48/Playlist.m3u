// Merges the Tapmad live matches (tapmad.m3u) into channels.json.
// Tapmad entries are recognised by their stream host, so each run replaces
// the previous matches and leaves every other channel exactly as it was.
import { readFileSync, writeFileSync } from "node:fs";

const isTapmad = (url) => /(^|\.)tapmad\.com$/i.test(new URL(url).hostname);

const m3u = readFileSync("tapmad.m3u", "utf8").split(/\r?\n/);
const matches = [];
for (let i = 0; i < m3u.length; i++) {
  if (!m3u[i].startsWith("#EXTINF")) continue;
  const info = m3u[i];
  const url = (m3u.slice(i + 1).find(l => l.trim() && !l.startsWith("#")) || "").trim();
  if (!/^https?:\/\//.test(url) || !isTapmad(url)) continue;
  const attr = (name) => (info.match(new RegExp(name + '="([^"]*)"')) || [])[1] || "";
  const name = info.slice(info.lastIndexOf(",") + 1).trim();
  matches.push({ name, logo: attr("tvg-logo"), genre: attr("group-title") || "Sports", url });
}

const src = readFileSync("channels.json", "utf8");
const start = src.indexOf("[");
const end = src.lastIndexOf("]");
const channels = JSON.parse(src.slice(start, end + 1));
const kept = channels.filter(c => !(c.url && isTapmad(c.url)));
const next = src.slice(0, start) + JSON.stringify([...kept, ...matches], null, 2) + src.slice(end + 1);
if (next !== src) writeFileSync("channels.json", next);
console.log(`channels.json: ${kept.length} channels + ${matches.length} Tapmad matches`);
