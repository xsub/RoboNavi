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
const appSource = fs.readFileSync(path.join(root, "src", "app.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const rendererSource = fs.readFileSync(
  path.join(root, "src", "three-renderer.mjs"),
  "utf8"
);

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

const scanWarble = library.clips.find((clip) => clip.id === "scan-warble");
assert.deepStrictEqual(
  scanWarble.sourceRange,
  [27.7, 29.22],
  "scan warble should use the tightened source range"
);
assert(
  scanWarble.mood.includes("modulated-pseudo-speech"),
  "scan warble should retain its modulated pseudo-speech role"
);

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
  "Polish speech should not fall back to an English voice"
);
assert(
  (audioSource.match(/createLocalizedUtterance\(/g) || []).length >= 6,
  "spoken game messages should use the centralized language-safe helper"
);
assert(
  audioSource.includes('"No proszę!"') &&
    !audioSource.includes('SpeechSynthesisUtterance("No, no!")'),
  "Polish preview feedback should not speak the English phrase"
);
assert(
  audioSource.includes("voiceSampleGainMultiplier = 3"),
  "sampled robot voices should use the requested 3x gain"
);
assert(
  audioSource.includes(
    'localStorage.getItem(voiceLibraryStorageKey) === "true"'
  ),
  "sampled robot voices should be disabled by default"
);
assert(
  audioSource.includes("if (!voiceLibraryEnabled || !context"),
  "disabled sampled voices should not be loaded"
);
assert(
  audioSource.includes("setVoiceLibraryEnabled: setVoiceLibraryEnabled"),
  "the audio engine should expose the library preference"
);
assert(
  htmlSource.includes('id="options-button"') &&
    htmlSource.includes('id="voice-library-toggle"'),
  "the options dialog should expose the sampled voice preference"
);
assert(
  appSource.includes("sound.setVoiceLibraryEnabled"),
  "the options checkbox should control the audio engine"
);
assert(
  htmlSource.includes('id="max-spark-objects"'),
  "the options dialog should expose the maximum spark object count"
);
assert(
  appSource.includes("maxSparkObjectsStorageKey") &&
    appSource.includes("els.sparkCount.max = String(state.maxSparkObjects)"),
  "the spark maximum should persist and control the mission slider"
);
assert(
  rendererSource.includes("ensureSignalSpriteCapacity(requestedCount)"),
  "the Three.js renderer should create spark sprites up to the selected count"
);
assert(
  htmlSource.includes('id="loop-program"'),
  "free drive should expose a loop program control"
);
assert(
  appSource.includes("options.ignoreCompletion = state.looping") &&
    appSource.includes("requestLoopStop()") &&
    appSource.includes('event.key === "Enter" && state.looping'),
  "free-drive loops should repeat past completion and support an explicit stop"
);

console.log(`Validated ${library.clips.length} robot voice samples.`);
