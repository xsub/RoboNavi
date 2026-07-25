(function () {
  "use strict";

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var storageKey = "robonavi-sound-enabled-v1";
  var voiceLibraryStorageKey = "robonavi-voice-library-enabled-v1";
  var context = null;
  var masterGain = null;
  var whistleTimer = null;
  var driveSound = null;
  var noiseBuffer = null;
  var speech = window.speechSynthesis || null;
  var enabled = loadEnabled();
  var voiceLibraryEnabled = loadVoiceLibraryEnabled();
  var voiceSampleVersion = "20260725-voice4";
  var voiceSampleGainMultiplier = 3;
  var voiceSampleBase = "assets/audio/robot-voice/";
  var voiceSampleDefinitions = {
    "idle-melody": { file: "idle-melody.m4a", gain: 0.68, rate: 1.04, detune: 45 },
    "ack-chirp": { file: "ack-chirp.m4a", gain: 0.64, rate: 1.08, detune: 80 },
    "curious-gliss": { file: "curious-gliss.m4a", gain: 0.62, rate: 1.03, detune: 70 },
    "happy-chuckle": { file: "happy-chuckle.m4a", gain: 0.64, rate: 1.08, detune: 95 },
    "confused-grumble": {
      file: "confused-grumble.m4a",
      gain: 0.58,
      rate: 0.96,
      detune: -75
    },
    "success-cackle": {
      file: "success-cackle.m4a",
      gain: 0.62,
      rate: 1.06,
      detune: 55
    },
    "fault-snort": { file: "fault-snort.m4a", gain: 0.58, rate: 0.94, detune: -110 },
    "robot-phrase": { file: "robot-phrase.m4a", gain: 0.58, rate: 1.08, detune: 90 },
    "scan-warble": { file: "scan-warble.m4a", gain: 0.54, rate: 1, detune: 45 },
    "disappointed-whimper": {
      file: "disappointed-whimper.m4a",
      gain: 0.58,
      rate: 0.92,
      detune: -120
    }
  };
  var voiceSampleGroups = {
    idle: ["idle-melody", "happy-chuckle", "scan-warble"],
    acknowledge: ["ack-chirp", "robot-phrase"],
    curious: ["curious-gliss", "scan-warble"],
    failure: ["confused-grumble", "fault-snort"],
    success: ["success-cackle", "happy-chuckle"]
  };
  var voiceSampleBuffers = Object.create(null);
  var voiceSampleLoads = Object.create(null);
  var voiceSampleFailures = Object.create(null);
  var activeVoiceSample = null;
  var previousVoiceSample = null;

  function loadEnabled() {
    try {
      return localStorage.getItem(storageKey) !== "false";
    } catch (error) {
      return true;
    }
  }

  function loadVoiceLibraryEnabled() {
    try {
      return localStorage.getItem(voiceLibraryStorageKey) === "true";
    } catch (error) {
      return false;
    }
  }

  function saveVoiceLibraryEnabled() {
    try {
      localStorage.setItem(
        voiceLibraryStorageKey,
        voiceLibraryEnabled ? "true" : "false"
      );
    } catch (error) {
      // The setting still works for the current session.
    }
  }

  function isPolishLanguage(language) {
    return String(language || "").toLowerCase().indexOf("pl") === 0;
  }

  function findSpeechVoice(language) {
    if (!speech || typeof speech.getVoices !== "function") return null;
    var languagePrefix = isPolishLanguage(language) ? "pl" : "en";
    var preferredNames =
      languagePrefix === "pl"
        ? ["zosia", "krzysztof", "ewa"]
        : ["samantha", "daniel", "alex"];
    var matchingVoices = speech.getVoices().filter(function (voice) {
      return (
        String(voice.lang || "").toLowerCase().indexOf(languagePrefix) === 0
      );
    });
    if (matchingVoices.length === 0) return null;
    var preferredVoice = matchingVoices.find(function (voice) {
      var voiceName = String(voice.name || "").toLowerCase();
      return preferredNames.some(function (preferredName) {
        return voiceName.indexOf(preferredName) !== -1;
      });
    });
    return preferredVoice || matchingVoices[0];
  }

  function createLocalizedUtterance(language, polishText, englishText) {
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") {
      return null;
    }
    if (speech) speech.cancel();
    var isPolish = isPolishLanguage(language);
    var selectedVoice = findSpeechVoice(isPolish ? "pl" : "en");
    if (isPolish && !selectedVoice) return null;
    var utterance = new window.SpeechSynthesisUtterance(
      isPolish ? polishText : englishText
    );
    utterance.lang = isPolish ? "pl-PL" : "en-US";
    if (selectedVoice) utterance.voice = selectedVoice;
    return utterance;
  }

  function saveEnabled() {
    try {
      localStorage.setItem(storageKey, enabled ? "true" : "false");
    } catch (error) {
      // Sound still works for the current session when storage is unavailable.
    }
  }

  function ensureContext() {
    if (!AudioContextClass) return false;
    if (context) return true;

    context = new AudioContextClass();
    masterGain = context.createGain();
    masterGain.gain.value = 0;

    var compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.22;
    masterGain.connect(compressor);
    compressor.connect(context.destination);
    if (voiceLibraryEnabled) preloadVoiceSamples();
    return true;
  }

  function canPlay() {
    return Boolean(
      enabled &&
      context &&
      masterGain &&
      context.state === "running"
    );
  }

  function decodeVoiceSample(arrayBuffer) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      function finish(callback, value) {
        if (settled) return;
        settled = true;
        callback(value);
      }
      var result = context.decodeAudioData(
        arrayBuffer.slice(0),
        function (buffer) {
          finish(resolve, buffer);
        },
        function (error) {
          finish(reject, error);
        }
      );
      if (result && typeof result.then === "function") {
        result.then(
          function (buffer) {
            finish(resolve, buffer);
          },
          function (error) {
            finish(reject, error);
          }
        );
      }
    });
  }

  function loadVoiceSample(name) {
    var definition = voiceSampleDefinitions[name];
    if (!voiceLibraryEnabled || !context || !definition || !window.fetch) {
      return Promise.resolve(null);
    }
    if (voiceSampleBuffers[name]) {
      return Promise.resolve(voiceSampleBuffers[name]);
    }
    if (voiceSampleLoads[name]) return voiceSampleLoads[name];

    var url =
      voiceSampleBase +
      definition.file +
      "?v=" +
      voiceSampleVersion;
    voiceSampleLoads[name] = window.fetch(url, { cache: "force-cache" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Voice sample request failed: " + response.status);
        }
        return response.arrayBuffer();
      })
      .then(decodeVoiceSample)
      .then(function (buffer) {
        voiceSampleBuffers[name] = buffer;
        delete voiceSampleFailures[name];
        return buffer;
      })
      .catch(function () {
        voiceSampleFailures[name] = true;
        return null;
      });
    return voiceSampleLoads[name];
  }

  function preloadVoiceSamples() {
    if (!voiceLibraryEnabled || !context) return;
    Object.keys(voiceSampleDefinitions).forEach(function (name) {
      loadVoiceSample(name);
    });
  }

  function stopVoiceSample(release) {
    if (!activeVoiceSample || !context) return;
    var voice = activeVoiceSample;
    activeVoiceSample = null;
    var now = context.currentTime;
    var fade = Math.max(0.02, Number(release) || 0.055);
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, fade / 3);
    try {
      voice.source.stop(now + fade + 0.025);
    } catch (error) {
      // A completed sample cannot be stopped twice.
    }
    disconnectLater(voice.nodes, Math.ceil((fade + 0.12) * 1000));
  }

  function playVoiceSample(name, options) {
    options = options || {};
    if (!voiceLibraryEnabled || !enabled || !context) return false;
    var definition = voiceSampleDefinitions[name];
    if (!definition) return false;
    var buffer = voiceSampleBuffers[name];
    if (!buffer) {
      if (!voiceSampleFailures[name]) {
        loadVoiceSample(name).then(function (loaded) {
          if (loaded && enabled && context && context.state === "running") {
            playVoiceSample(name, options);
          }
        });
      }
      return false;
    }
    if (!canPlay()) return false;

    stopVoiceSample(0.035);
    var source = context.createBufferSource();
    var highpass = context.createBiquadFilter();
    var lowpass = context.createBiquadFilter();
    var gain = context.createGain();
    var now = context.currentTime + Math.max(0, Number(options.delay) || 0);
    var rate =
      (Number(options.rate) || definition.rate || 1) *
      (0.985 + Math.random() * 0.03);
    var detune =
      (Number.isFinite(Number(options.detune))
        ? Number(options.detune)
        : definition.detune || 0) +
      (Math.random() * 30 - 15);
    var peak =
      (Number(options.gain) || definition.gain || 0.58) *
      voiceSampleGainMultiplier;
    var duration = buffer.duration / rate;
    var end = now + duration;

    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.detune.value = detune;
    highpass.type = "highpass";
    highpass.frequency.value = 110;
    highpass.Q.value = 0.45;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 7200;
    lowpass.Q.value = 0.35;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.018);
    gain.gain.setValueAtTime(peak * 0.92, Math.max(now + 0.02, end - 0.07));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(masterGain);
    source.start(now);
    source.stop(end + 0.025);

    activeVoiceSample = {
      name: name,
      source: source,
      gain: gain,
      nodes: [source, highpass, lowpass, gain]
    };
    previousVoiceSample = name;
    source.onended = function () {
      if (activeVoiceSample && activeVoiceSample.source === source) {
        activeVoiceSample = null;
      }
      disconnectLater([source, highpass, lowpass, gain], 20);
    };
    return true;
  }

  function playVoiceGroup(groupName, options) {
    var choices = voiceSampleGroups[groupName] || [];
    if (choices.length === 0) return false;
    var available = choices.filter(function (name) {
      return name !== previousVoiceSample;
    });
    if (available.length === 0) available = choices;
    var name = available[Math.floor(Math.random() * available.length)];
    return playVoiceSample(name, options);
  }

  function ensureNoiseBuffer() {
    if (!context) return null;
    if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) {
      return noiseBuffer;
    }

    var length = Math.max(1, Math.floor(context.sampleRate * 0.5));
    noiseBuffer = context.createBuffer(1, length, context.sampleRate);
    var data = noiseBuffer.getChannelData(0);
    var previous = 0;
    for (var index = 0; index < length; index += 1) {
      var white = Math.random() * 2 - 1;
      previous = previous * 0.78 + white * 0.22;
      data[index] = previous;
    }
    return noiseBuffer;
  }

  function disconnectLater(nodes, delayMs) {
    window.setTimeout(function () {
      nodes.forEach(function (node) {
        if (!node || typeof node.disconnect !== "function") return;
        try {
          node.disconnect();
        } catch (error) {
          // Nodes may already have been released by the audio engine.
        }
      });
    }, delayMs);
  }

  function addNoiseBurst(destination, start, duration, frequency, peak) {
    var buffer = ensureNoiseBuffer();
    if (!buffer) return [];

    var source = context.createBufferSource();
    var filter = context.createBiquadFilter();
    var gain = context.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(start);
    source.stop(start + duration + 0.02);
    return [source, filter, gain];
  }

  function stopDrive(release) {
    if (!driveSound || !context) return;
    var sound = driveSound;
    driveSound = null;
    var now = context.currentTime;
    var fade = Math.max(0.025, Number(release) || 0.065);

    sound.bus.gain.cancelScheduledValues(now);
    sound.bus.gain.setTargetAtTime(0.0001, now, fade / 3);
    sound.sources.forEach(function (source) {
      try {
        source.stop(now + fade + 0.08);
      } catch (error) {
        // Oscillators cannot be stopped twice.
      }
    });
    disconnectLater(sound.nodes, Math.ceil((fade + 0.14) * 1000));
  }

  function startDrive(mode, speedPercent, terrain) {
    if (!canPlay()) return;
    var turning = mode === "turn";
    var strained = mode === "bump";
    var speed = Math.max(0.6, Math.min(1.6, Number(speedPercent) / 100 || 1));
    var terrainPitch = terrain === "ice" ? 1.16 : terrain === "sand" ? 0.78 : 1;
    var targetMotor = (strained ? 58 : turning ? 92 : 108) * speed * terrainPitch;
    var targetWheel = (turning ? 31 : 38) * speed * terrainPitch;

    if (driveSound) {
      driveSound.motor.frequency.setTargetAtTime(
        targetMotor,
        context.currentTime,
        0.035
      );
      driveSound.harmonic.frequency.setTargetAtTime(
        targetMotor * 2.35,
        context.currentTime,
        0.035
      );
      driveSound.wheel.frequency.setTargetAtTime(
        targetWheel,
        context.currentTime,
        0.035
      );
      driveSound.noiseFilter.frequency.setTargetAtTime(
        (turning ? 520 : terrain === "sand" ? 430 : 680) * speed,
        context.currentTime,
        0.04
      );
      return;
    }

    var now = context.currentTime;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var motor = context.createOscillator();
    var motorGain = context.createGain();
    var harmonic = context.createOscillator();
    var harmonicGain = context.createGain();
    var wheel = context.createOscillator();
    var wheelGain = context.createGain();
    var vibration = context.createOscillator();
    var vibrationDepth = context.createGain();
    var noise = context.createBufferSource();
    var noiseFilter = context.createBiquadFilter();
    var noiseGain = context.createGain();

    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(0.72, now + 0.045);
    filter.type = "lowpass";
    filter.frequency.value = 1500;
    filter.Q.value = 0.72;

    motor.type = "sawtooth";
    motor.frequency.setValueAtTime(targetMotor * 0.7, now);
    motor.frequency.exponentialRampToValueAtTime(targetMotor, now + 0.11);
    motorGain.gain.value = strained ? 0.2 : 0.14;

    harmonic.type = "triangle";
    harmonic.frequency.setValueAtTime(targetMotor * 1.75, now);
    harmonic.frequency.exponentialRampToValueAtTime(
      targetMotor * 2.35,
      now + 0.12
    );
    harmonicGain.gain.value = 0.085;

    wheel.type = "square";
    wheel.frequency.value = targetWheel;
    wheelGain.gain.value = strained ? 0.055 : 0.032;

    vibration.type = "sine";
    vibration.frequency.value = 18;
    vibrationDepth.gain.value = turning ? 5 : 8;
    vibration.connect(vibrationDepth);
    vibrationDepth.connect(motor.frequency);

    noise.buffer = ensureNoiseBuffer();
    noise.loop = true;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = (turning ? 520 : terrain === "sand" ? 430 : 680) * speed;
    noiseFilter.Q.value = 0.55;
    noiseGain.gain.value = strained ? 0.07 : 0.038;

    motor.connect(motorGain);
    harmonic.connect(harmonicGain);
    wheel.connect(wheelGain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    [motorGain, harmonicGain, wheelGain, noiseGain].forEach(function (node) {
      node.connect(filter);
    });
    filter.connect(bus);
    bus.connect(masterGain);

    [motor, harmonic, wheel, vibration, noise].forEach(function (source) {
      source.start(now);
    });
    driveSound = {
      bus: bus,
      motor: motor,
      harmonic: harmonic,
      wheel: wheel,
      noiseFilter: noiseFilter,
      sources: [motor, harmonic, wheel, vibration, noise],
      nodes: [
        bus,
        filter,
        motor,
        motorGain,
        harmonic,
        harmonicGain,
        wheel,
        wheelGain,
        vibration,
        vibrationDepth,
        noise,
        noiseFilter,
        noiseGain
      ]
    };
  }

  function playCollision() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.025;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var nodes = [bus, filter];

    filter.type = "highpass";
    filter.frequency.value = 980;
    filter.Q.value = 0.72;
    filter.connect(bus);
    bus.connect(masterGain);
    bus.gain.value = 0.48;

    [
      { frequency: 5400, offset: 0, duration: 0.16 },
      { frequency: 3900, offset: 0.025, duration: 0.23 },
      { frequency: 7100, offset: 0.055, duration: 0.19 },
      { frequency: 2850, offset: 0.09, duration: 0.3 },
      { frequency: 4750, offset: 0.14, duration: 0.27 }
    ].forEach(function (shard, index) {
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      var start = now + shard.offset;
      var end = start + shard.duration;
      oscillator.type = index % 2 === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(shard.frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        shard.frequency * 0.36,
        end
      );
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16 / (1 + index * 0.12), start + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(start);
      oscillator.stop(end + 0.02);
      nodes.push(oscillator, gain);
    });

    nodes = nodes.concat(addNoiseBurst(filter, now, 0.09, 7200, 0.23));
    nodes = nodes.concat(addNoiseBurst(filter, now + 0.07, 0.31, 3300, 0.15));
    disconnectLater(nodes, 920);
  }

  function playBatteryInstall() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.012;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var nodes = [bus, filter];
    var frequencies = [760, 1170, 1760, 2490];

    bus.gain.value = 0.56;
    filter.type = "highpass";
    filter.frequency.value = 520;
    filter.Q.value = 0.72;
    filter.connect(bus);
    bus.connect(masterGain);

    frequencies.forEach(function (frequency, index) {
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      var start = now + index * 0.009;
      var duration = 0.18 + index * 0.055;
      oscillator.type = index % 2 === 0 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency * 1.08, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 0.94,
        start + duration
      );
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        0.24 / (1 + index * 0.22),
        start + 0.006
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
      nodes.push(oscillator, gain);
    });
    nodes = nodes.concat(addNoiseBurst(filter, now, 0.09, 3100, 0.2));
    playVoiceSample("robot-phrase", {
      delay: 0.12,
      gain: 0.42,
      rate: 1.12
    });
    disconnectLater(nodes, 620);
  }

  function playInduct(amount) {
    if (!canPlay()) return;
    var power = Math.max(1, Math.min(4, Number(amount) || 1));
    var now = context.currentTime + 0.01;
    var duration = 0.56;
    var sourceBus = context.createGain();
    var filter = context.createBiquadFilter();
    var output = context.createGain();
    var delay = context.createDelay(0.3);
    var feedback = context.createGain();
    var pulse = context.createOscillator();
    var pulseDepth = context.createGain();
    var nodes = [sourceBus, filter, output, delay, feedback, pulse, pulseDepth];

    sourceBus.connect(filter);
    filter.connect(output);
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(output);
    output.connect(masterGain);
    delay.delayTime.value = 0.075 + power * 0.009;
    feedback.gain.value = 0.28;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(250 + power * 45, now);
    filter.frequency.exponentialRampToValueAtTime(
      1250 + power * 170,
      now + duration
    );
    filter.Q.value = 1.3;
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.42, now + 0.07);
    output.gain.setValueAtTime(0.42, now + duration * 0.58);
    output.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    pulse.type = "sine";
    pulse.frequency.value = 6.5 + power * 0.7;
    pulseDepth.gain.value = 0.16;
    pulse.connect(pulseDepth);
    pulseDepth.connect(output.gain);
    pulse.start(now);
    pulse.stop(now + duration + 0.04);

    [
      { start: 105 + power * 13, end: 248 + power * 24, type: "sine", gain: 0.16 },
      { start: 310 + power * 21, end: 690 + power * 42, type: "triangle", gain: 0.08 },
      { start: 920 + power * 30, end: 430 + power * 20, type: "sine", gain: 0.045 }
    ].forEach(function (voice) {
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(voice.start, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        voice.end,
        now + duration
      );
      gain.gain.value = voice.gain;
      oscillator.connect(gain);
      gain.connect(sourceBus);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
      nodes.push(oscillator, gain);
    });

    playVoiceSample(power >= 3 ? "scan-warble" : "ack-chirp", {
      delay: 0.14,
      gain: power >= 3 ? 0.34 : 0.38,
      rate: power >= 3 ? 1.2 : 1.08
    });
    disconnectLater(nodes, 1050);
  }

  function playExecutionChime() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.01;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var nodes = [bus, filter];
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.8;
    filter.connect(bus);
    bus.connect(masterGain);
    bus.gain.value = 0.38;

    [196, 261.63, 392].forEach(function (frequency, index) {
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      var start = now + index * 0.055;
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.075, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
      nodes.push(oscillator, gain);
    });
    disconnectLater(nodes, 450);
  }

  function speakExecution(language) {
    if (!enabled) return;
    if (ensureContext()) {
      context.resume().then(function () {
        playExecutionChime();
        playVoiceSample("ack-chirp", {
          delay: 0.06,
          gain: 0.34,
          rate: 1.16
        });
      }).catch(function () {
        // Speech can still play when Web Audio remains locked.
      });
    }
    var isPolish = isPolishLanguage(language);
    var utterance = createLocalizedUtterance(
      language,
      "Wykonuję",
      "Executing"
    );
    if (!utterance) return;
    utterance.rate = isPolish ? 0.86 : 0.9;
    utterance.pitch = 0.68;
    utterance.volume = 0.72;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 55);
  }

  function playDepletedGroan() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.015;
    var duration = 0.92;
    var sourceBus = context.createGain();
    var lowFormant = context.createBiquadFilter();
    var highFormant = context.createBiquadFilter();
    var formantMix = context.createGain();
    var output = context.createGain();
    var delay = context.createDelay(0.25);
    var feedback = context.createGain();
    var vibrato = context.createOscillator();
    var vibratoDepth = context.createGain();
    var nodes = [
      sourceBus,
      lowFormant,
      highFormant,
      formantMix,
      output,
      delay,
      feedback,
      vibrato,
      vibratoDepth
    ];

    lowFormant.type = "bandpass";
    lowFormant.frequency.setValueAtTime(620, now);
    lowFormant.frequency.exponentialRampToValueAtTime(390, now + duration);
    lowFormant.Q.value = 1.15;
    highFormant.type = "bandpass";
    highFormant.frequency.setValueAtTime(1180, now);
    highFormant.frequency.exponentialRampToValueAtTime(720, now + duration);
    highFormant.Q.value = 1.5;
    sourceBus.connect(lowFormant);
    sourceBus.connect(highFormant);
    lowFormant.connect(formantMix);
    highFormant.connect(formantMix);
    formantMix.connect(output);
    formantMix.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(output);
    output.connect(masterGain);
    delay.delayTime.value = 0.115;
    feedback.gain.value = 0.18;
    formantMix.gain.value = 0.72;
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.46, now + 0.055);
    output.gain.setValueAtTime(0.42, now + duration * 0.45);
    output.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    vibrato.type = "sine";
    vibrato.frequency.value = 5.2;
    vibratoDepth.gain.setValueAtTime(3, now);
    vibratoDepth.gain.linearRampToValueAtTime(13, now + duration);
    vibrato.connect(vibratoDepth);
    vibrato.start(now);
    vibrato.stop(now + duration + 0.04);

    [
      { start: 205, end: 72, type: "sawtooth", gain: 0.2 },
      { start: 315, end: 108, type: "triangle", gain: 0.13 }
    ].forEach(function (voice) {
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(voice.start, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        voice.end,
        now + duration
      );
      gain.gain.value = voice.gain;
      vibratoDepth.connect(oscillator.frequency);
      oscillator.connect(gain);
      gain.connect(sourceBus);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
      nodes.push(oscillator, gain);
    });
    disconnectLater(nodes, 1450);
  }

  function playDepleted(language) {
    if (!enabled) return;
    if (speech) speech.cancel();
    if (ensureContext()) {
      context.resume().then(function () {
        playDepletedGroan();
        playVoiceSample("disappointed-whimper", {
          delay: 0.14,
          gain: 0.5,
          rate: 0.94
        });
      }).catch(function () {
        // The voice fallback can still play when Web Audio stays locked.
      });
    }
    var utterance = createLocalizedUtterance(
      language,
      "Aaaach...",
      "Aaaah..."
    );
    if (!utterance) return;
    utterance.rate = 0.56;
    utterance.pitch = 0.34;
    utterance.volume = 0.42;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 980);
  }

  function playSuccessFanfare() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.02;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var delay = context.createDelay(0.3);
    var feedback = context.createGain();
    var nodes = [bus, filter, delay, feedback];

    filter.type = "lowpass";
    filter.frequency.value = 2800;
    filter.Q.value = 0.5;
    filter.connect(bus);
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(bus);
    bus.connect(masterGain);
    bus.gain.value = 0.5;
    delay.delayTime.value = 0.13;
    feedback.gain.value = 0.2;

    [
      { frequency: 587.33, start: 0, duration: 0.44 },
      { frequency: 739.99, start: 0, duration: 0.44 },
      { frequency: 783.99, start: 0.5, duration: 0.72 },
      { frequency: 987.77, start: 0.5, duration: 0.72 },
      { frequency: 1174.66, start: 0.5, duration: 0.72 }
    ].forEach(function (note, index) {
      ["triangle", "sine"].forEach(function (type, layer) {
        var oscillator = context.createOscillator();
        var gain = context.createGain();
        var start = now + note.start;
        var end = start + note.duration;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
          note.frequency * (layer === 0 ? 1 : 2),
          start
        );
        if (index >= 2) {
          oscillator.frequency.linearRampToValueAtTime(
            note.frequency * (layer === 0 ? 1.015 : 2.03),
            end
          );
        }
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
          layer === 0 ? 0.15 : 0.045,
          start + 0.018
        );
        gain.gain.setValueAtTime(
          layer === 0 ? 0.13 : 0.038,
          Math.max(start + 0.02, end - 0.12)
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(gain);
        gain.connect(filter);
        oscillator.start(start);
        oscillator.stop(end + 0.03);
        nodes.push(oscillator, gain);
      });
    });
    disconnectLater(nodes, 1900);
  }

  function playSuccess(language) {
    if (!enabled) return;
    if (speech) speech.cancel();
    if (ensureContext()) {
      context.resume().then(function () {
        playSuccessFanfare();
        playVoiceSample("success-cackle", {
          delay: 0.08,
          gain: 0.5,
          rate: 1.08
        });
      }).catch(function () {
        // The spoken flourish can still play if Web Audio stays locked.
      });
    }
    var utterance = createLocalizedUtterance(
      language,
      "Taaaa... daaaam!",
      "Taaaa... daaaam!"
    );
    if (!utterance) return;
    utterance.rate = 0.5;
    utterance.pitch = 0.96;
    utterance.volume = 0.68;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 1180);
  }

  function playFailureTone() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.015;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var nodes = [bus, filter];
    filter.type = "lowpass";
    filter.frequency.value = 1350;
    filter.Q.value = 0.8;
    filter.connect(bus);
    bus.connect(masterGain);
    bus.gain.value = 0.48;

    [
      { start: 392, end: 294, offset: 0, duration: 0.24 },
      { start: 311.13, end: 220, offset: 0.2, duration: 0.3 },
      { start: 246.94, end: 146.83, offset: 0.44, duration: 0.42 }
    ].forEach(function (note, index) {
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      var start = now + note.offset;
      var end = start + note.duration;
      oscillator.type = index === 2 ? "sawtooth" : "triangle";
      oscillator.frequency.setValueAtTime(note.start, start);
      oscillator.frequency.exponentialRampToValueAtTime(note.end, end);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        index === 2 ? 0.085 : 0.12,
        start + 0.025
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(start);
      oscillator.stop(end + 0.03);
      nodes.push(oscillator, gain);
    });
    disconnectLater(nodes, 1250);
  }

  function playFailure(language) {
    if (!enabled) return;
    if (speech) speech.cancel();
    if (ensureContext()) {
      context.resume().then(function () {
        playFailureTone();
        playVoiceGroup("failure", {
          delay: 0.16,
          gain: 0.46
        });
      }).catch(function () {
        // The spoken reaction can still play when Web Audio stays locked.
      });
    }
    var isPolish = isPolishLanguage(language);
    var utterance = createLocalizedUtterance(
      language,
      "O nie...",
      "Oh no..."
    );
    if (!utterance) return;
    utterance.rate = 0.66;
    utterance.pitch = 0.46;
    utterance.volume = 0.46;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 820);
  }

  function playShadowWhistleTone() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.01;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var nodes = [bus, filter];
    filter.type = "highpass";
    filter.frequency.value = 540;
    filter.Q.value = 0.5;
    filter.connect(bus);
    bus.connect(masterGain);
    bus.gain.value = 0.48;

    [
      { start: 760, end: 1240, offset: 0, duration: 0.2 },
      { start: 1180, end: 720, offset: 0.27, duration: 0.23 }
    ].forEach(function (note) {
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      var vibrato = context.createOscillator();
      var vibratoDepth = context.createGain();
      var start = now + note.offset;
      var end = start + note.duration;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(note.start, start);
      oscillator.frequency.exponentialRampToValueAtTime(note.end, end);
      vibrato.type = "sine";
      vibrato.frequency.value = 18;
      vibratoDepth.gain.value = 18;
      vibrato.connect(vibratoDepth);
      vibratoDepth.connect(oscillator.frequency);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.17, start + 0.018);
      gain.gain.setValueAtTime(0.14, end - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(start);
      vibrato.start(start);
      oscillator.stop(end + 0.03);
      vibrato.stop(end + 0.03);
      nodes.push(oscillator, gain, vibrato, vibratoDepth);
    });
    disconnectLater(nodes, 900);
  }

  function playShadowEnabled(language) {
    if (!enabled) return;
    if (speech) speech.cancel();
    if (ensureContext()) {
      context.resume().then(function () {
        playShadowWhistleTone();
        playVoiceGroup("curious", {
          delay: 0.1,
          gain: 0.4,
          rate: 1.12
        });
      }).catch(function () {
        // The whistles remain optional when Web Audio stays locked.
      });
    }
    var utterance = createLocalizedUtterance(
      language,
      "No proszę!",
      "No, no!"
    );
    if (!utterance) return;
    utterance.rate = 0.78;
    utterance.pitch = 0.76;
    utterance.volume = 0.58;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 840);
  }

  function playSparkCollision() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.008;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var buzz = context.createOscillator();
    var buzzGain = context.createGain();
    var overtone = context.createOscillator();
    var overtoneGain = context.createGain();
    var nodes = [bus, filter, buzz, buzzGain, overtone, overtoneGain];

    bus.gain.value = 0.34;
    filter.type = "bandpass";
    filter.frequency.value = 1550;
    filter.Q.value = 0.72;
    filter.connect(bus);
    bus.connect(masterGain);

    buzz.type = "sawtooth";
    buzz.frequency.setValueAtTime(132, now);
    buzz.frequency.exponentialRampToValueAtTime(72, now + 0.18);
    buzzGain.gain.setValueAtTime(0.0001, now);
    buzzGain.gain.exponentialRampToValueAtTime(0.15, now + 0.006);
    buzzGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    buzz.connect(buzzGain);
    buzzGain.connect(filter);

    overtone.type = "square";
    overtone.frequency.setValueAtTime(890, now);
    overtone.frequency.exponentialRampToValueAtTime(420, now + 0.15);
    overtoneGain.gain.setValueAtTime(0.0001, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.085, now + 0.004);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);

    buzz.start(now);
    overtone.start(now);
    buzz.stop(now + 0.22);
    overtone.stop(now + 0.19);
    nodes = nodes.concat(addNoiseBurst(filter, now, 0.16, 2600, 0.17));
    disconnectLater(nodes, 620);
  }

  function playWaterPump() {
    if (!canPlay()) return;
    var now = context.currentTime + 0.015;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var pump = context.createOscillator();
    var pumpGain = context.createGain();
    var bubble = context.createOscillator();
    var bubbleGain = context.createGain();
    var nodes = [bus, filter, pump, pumpGain, bubble, bubbleGain];

    bus.gain.value = 0.42;
    filter.type = "lowpass";
    filter.frequency.value = 1700;
    filter.Q.value = 0.82;
    filter.connect(bus);
    bus.connect(masterGain);

    pump.type = "sawtooth";
    pump.frequency.setValueAtTime(74, now);
    pump.frequency.linearRampToValueAtTime(112, now + 0.32);
    pump.frequency.setValueAtTime(104, now + 0.86);
    pump.frequency.exponentialRampToValueAtTime(58, now + 1.12);
    pumpGain.gain.setValueAtTime(0.0001, now);
    pumpGain.gain.exponentialRampToValueAtTime(0.13, now + 0.06);
    pumpGain.gain.setValueAtTime(0.11, now + 0.88);
    pumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.14);
    pump.connect(pumpGain);
    pumpGain.connect(filter);

    bubble.type = "sine";
    bubble.frequency.setValueAtTime(420, now + 0.38);
    bubble.frequency.exponentialRampToValueAtTime(980, now + 0.9);
    bubbleGain.gain.setValueAtTime(0.0001, now + 0.35);
    bubbleGain.gain.exponentialRampToValueAtTime(0.085, now + 0.43);
    bubbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.02);
    bubble.connect(bubbleGain);
    bubbleGain.connect(filter);

    pump.start(now);
    bubble.start(now + 0.35);
    pump.stop(now + 1.18);
    bubble.stop(now + 1.06);
    nodes = nodes.concat(addNoiseBurst(filter, now + 0.16, 0.84, 880, 0.12));
    nodes = nodes.concat(addNoiseBurst(filter, now + 0.78, 0.28, 2350, 0.1));
    disconnectLater(nodes, 1650);
  }

  function speakHeyYou(language) {
    if (!enabled) return;
    if (speech) speech.cancel();
    if (ensureContext()) {
      context.resume().then(function () {
        playWhistle();
        playVoiceSample("happy-chuckle", {
          delay: 0.18,
          gain: 0.4,
          rate: 1.12
        });
      }).catch(function () {
        // The spoken greeting can still play if Web Audio stays locked.
      });
    }
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") return;

    var isPolish = isPolishLanguage(language);
    var selectedVoice = findSpeechVoice(isPolish ? "pl" : "en");
    if (isPolish && !selectedVoice) {
      return;
    }
    var utterance = new window.SpeechSynthesisUtterance(
      isPolish ? "Hej ty." : "Hey, you!"
    );
    utterance.lang = isPolish ? "pl-PL" : "en-US";
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = isPolish ? 0.94 : 0.82;
    utterance.pitch = isPolish ? 0.98 : 1.08;
    utterance.volume = isPolish ? 0.68 : 0.62;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 620);
  }

  function stopAll() {
    stopDrive(0.035);
    stopVoiceSample(0.035);
    if (speech) speech.cancel();
  }

  function playWhistle() {
    if (!enabled || !context || context.state !== "running") return;

    var notes = [523.25, 659.25, 783.99, 880, 1046.5, 1174.66];
    var count = 3 + Math.floor(Math.random() * 3);
    var cursor = context.currentTime + 0.03;
    var whistleBus = context.createBiquadFilter();
    whistleBus.type = "highpass";
    whistleBus.frequency.value = 380;
    whistleBus.Q.value = 0.5;
    whistleBus.connect(masterGain);

    for (var index = 0; index < count; index += 1) {
      var duration = 0.1 + Math.random() * 0.12;
      var gap = 0.025 + Math.random() * 0.07;
      var frequency = notes[Math.floor(Math.random() * notes.length)];
      var direction = Math.random() > 0.45 ? 1 : -1;
      var oscillator = context.createOscillator();
      var noteGain = context.createGain();
      var vibrato = context.createOscillator();
      var vibratoDepth = context.createGain();

      oscillator.type = index % 3 === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(
        frequency * (direction > 0 ? 0.88 : 1.08),
        cursor
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * (direction > 0 ? 1.08 : 0.9),
        cursor + duration
      );
      vibrato.type = "sine";
      vibrato.frequency.value = 12 + Math.random() * 7;
      vibratoDepth.gain.value = 10 + Math.random() * 18;
      vibrato.connect(vibratoDepth);
      vibratoDepth.connect(oscillator.frequency);

      noteGain.gain.setValueAtTime(0.0001, cursor);
      noteGain.gain.exponentialRampToValueAtTime(0.16, cursor + 0.018);
      noteGain.gain.exponentialRampToValueAtTime(
        0.0001,
        cursor + duration
      );
      oscillator.connect(noteGain);
      noteGain.connect(whistleBus);
      oscillator.start(cursor);
      vibrato.start(cursor);
      oscillator.stop(cursor + duration + 0.03);
      vibrato.stop(cursor + duration + 0.03);
      cursor += duration + gap;
    }
  }

  function clearWhistleTimer() {
    if (whistleTimer !== null) {
      window.clearTimeout(whistleTimer);
      whistleTimer = null;
    }
  }

  function scheduleWhistle(isFirst) {
    clearWhistleTimer();
    if (!enabled) return;
    var delay = isFirst
      ? 5000 + Math.random() * 6000
      : 12000 + Math.random() * 16000;
    whistleTimer = window.setTimeout(function () {
      whistleTimer = null;
      if (!document.hidden) {
        if (voiceLibraryEnabled && Math.random() < 0.72) {
          playVoiceGroup("idle", {
            gain: 0.4,
            rate: 1.04
          });
        } else {
          playWhistle();
        }
      }
      scheduleWhistle(false);
    }, delay);
  }

  function setEnabled(nextEnabled) {
    enabled = Boolean(nextEnabled);
    saveEnabled();
    clearWhistleTimer();

    if (!enabled) {
      stopAll();
      if (context && masterGain) {
        masterGain.gain.setTargetAtTime(0, context.currentTime, 0.045);
      }
      return enabled;
    }

    if (!ensureContext()) return false;
    context.resume().then(function () {
      masterGain.gain.setTargetAtTime(0.2, context.currentTime, 0.12);
      scheduleWhistle(true);
    }).catch(function () {
      // A later user interaction can try to resume the context again.
    });
    return enabled;
  }

  function setVoiceLibraryEnabled(nextEnabled) {
    voiceLibraryEnabled = Boolean(nextEnabled);
    saveVoiceLibraryEnabled();
    if (!voiceLibraryEnabled) {
      stopVoiceSample(0.035);
      return voiceLibraryEnabled;
    }
    if (context) preloadVoiceSamples();
    return voiceLibraryEnabled;
  }

  function unlock() {
    if (!enabled) return false;
    return setEnabled(true);
  }

  document.addEventListener("visibilitychange", function () {
    if (!context) return;
    if (document.hidden) {
      stopAll();
      clearWhistleTimer();
      context.suspend().catch(function () {
        // The context may already be transitioning to a suspended state.
      });
    } else if (enabled) {
      context.resume().then(function () {
        scheduleWhistle(true);
      }).catch(function () {
        // Browsers may require another user interaction after returning.
      });
    }
  });

  window.RoboNaviSound = {
    isSupported: function () {
      return Boolean(AudioContextClass);
    },
    isEnabled: function () {
      return enabled;
    },
    isVoiceLibraryEnabled: function () {
      return voiceLibraryEnabled;
    },
    setEnabled: setEnabled,
    setVoiceLibraryEnabled: setVoiceLibraryEnabled,
    toggle: function () {
      return setEnabled(!enabled);
    },
    unlock: unlock,
    playRobotWhistle: playWhistle,
    startDrive: startDrive,
    stopDrive: stopDrive,
    playCollision: playCollision,
    playBatteryInstall: playBatteryInstall,
    playInduct: playInduct,
    speakExecution: speakExecution,
    playDepleted: playDepleted,
    playSuccess: playSuccess,
    playFailure: playFailure,
    playShadowEnabled: playShadowEnabled,
    playSparkCollision: playSparkCollision,
    playWaterPump: playWaterPump,
    speakHeyYou: speakHeyYou,
    playVoiceSample: playVoiceSample,
    getVoiceLibraryStatus: function () {
      return {
        enabled: voiceLibraryEnabled,
        total: Object.keys(voiceSampleDefinitions).length,
        loaded: Object.keys(voiceSampleBuffers).length,
        failed: Object.keys(voiceSampleFailures).length,
        clips: Object.keys(voiceSampleDefinitions)
      };
    },
    stopAll: stopAll
  };
})();
