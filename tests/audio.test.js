const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const libraryPath = path.join(
  root,
  "assets",
  "audio",
  "robot-voice",
  "library.json"
);
const library = JSON.parse(fs.readFileSync(libraryPath, "utf8"));
const audioSource = fs.readFileSync(path.join(root, "src", "audio.js"), "utf8");

assert.strictEqual(library.version, 1);
assert.strictEqual(library.clips.length, 10);
assert.strictEqual(
  new Set(library.clips.map((clip) => clip.id)).size,
  library.clips.length,
  "robot voice clip IDs should be unique"
);

library.clips.forEach((clip) => {
  const clipPath = path.join(path.dirname(libraryPath), clip.file);
  assert(fs.existsSync(clipPath), `${clip.id} should have an audio file`);
  assert(fs.statSync(clipPath).size > 4096, `${clip.id} should not be empty`);
  assert(
    audioSource.includes(`"${clip.id}"`),
    `${clip.id} should be registered in the Web Audio library`
  );
});

[
  "disappointed-whimper",
  "success-cackle",
  "failure",
  "curious",
  "idle"
].forEach((mapping) => {
  assert(
    audioSource.includes(`"${mapping}"`),
    `${mapping} should be mapped to a game reaction`
  );
});

assert(
  audioSource.includes('"zosia"'),
  "Polish attention speech should prefer the native Zosia voice"
);
assert(
  audioSource.includes('"Hej ty."'),
  "Polish attention speech should use the tuned Polish phrase"
);
assert(
  audioSource.includes("if (isPolish && !selectedVoice)"),
  "Polish attention speech should not fall back to an English voice"
);

console.log(`Validated ${library.clips.length} robot voice samples.`);
