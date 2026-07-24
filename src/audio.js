(function () {
  "use strict";

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var storageKey = "robonavi-sound-enabled-v1";
  var context = null;
  var masterGain = null;
  var whistleTimer = null;
  var driveSound = null;
  var noiseBuffer = null;
  var speech = window.speechSynthesis || null;
  var enabled = loadEnabled();

  function loadEnabled() {
    try {
      return localStorage.getItem(storageKey) !== "false";
    } catch (error) {
      return true;
    }
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

  function startDrive(mode) {
    if (!canPlay()) return;
    var turning = mode === "turn";
    var strained = mode === "bump";
    var targetMotor = strained ? 58 : turning ? 92 : 108;

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
    wheel.frequency.value = turning ? 31 : 38;
    wheelGain.gain.value = strained ? 0.055 : 0.032;

    vibration.type = "sine";
    vibration.frequency.value = 18;
    vibrationDepth.gain.value = turning ? 5 : 8;
    vibration.connect(vibrationDepth);
    vibrationDepth.connect(motor.frequency);

    noise.buffer = ensureNoiseBuffer();
    noise.loop = true;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = turning ? 520 : 680;
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
    var now = context.currentTime + 0.075;
    var duration = 0.28;
    var bus = context.createGain();
    var filter = context.createBiquadFilter();
    var whoop = context.createOscillator();
    var whoopGain = context.createGain();
    var impact = context.createOscillator();
    var impactGain = context.createGain();
    var nodes = [
      bus,
      filter,
      whoop,
      whoopGain,
      impact,
      impactGain
    ];

    filter.type = "lowpass";
    filter.frequency.value = 2400;
    filter.Q.value = 1.1;
    filter.connect(bus);
    bus.connect(masterGain);
    bus.gain.value = 0.62;

    whoop.type = "sine";
    whoop.frequency.setValueAtTime(180, now);
    whoop.frequency.exponentialRampToValueAtTime(920, now + 0.12);
    whoop.frequency.exponentialRampToValueAtTime(145, now + duration);
    whoopGain.gain.setValueAtTime(0.0001, now);
    whoopGain.gain.exponentialRampToValueAtTime(0.28, now + 0.025);
    whoopGain.gain.setValueAtTime(0.24, now + 0.12);
    whoopGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    whoop.connect(whoopGain);
    whoopGain.connect(filter);

    impact.type = "triangle";
    impact.frequency.setValueAtTime(105, now + 0.105);
    impact.frequency.exponentialRampToValueAtTime(48, now + 0.24);
    impactGain.gain.setValueAtTime(0.0001, now + 0.105);
    impactGain.gain.exponentialRampToValueAtTime(0.34, now + 0.118);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    impact.connect(impactGain);
    impactGain.connect(filter);

    whoop.start(now);
    whoop.stop(now + duration + 0.03);
    impact.start(now + 0.105);
    impact.stop(now + 0.28);
    nodes = nodes.concat(
      addNoiseBurst(filter, now + 0.105, 0.12, 1650, 0.19)
    );
    disconnectLater(nodes, 720);
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
      context.resume().then(playExecutionChime).catch(function () {
        // Speech can still play when Web Audio remains locked.
      });
    }
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") return;

    speech.cancel();
    var isPolish = language === "pl";
    var utterance = new window.SpeechSynthesisUtterance(
      isPolish ? "Wykonuję" : "Executing"
    );
    utterance.lang = isPolish ? "pl-PL" : "en-US";
    utterance.rate = isPolish ? 0.86 : 0.9;
    utterance.pitch = 0.68;
    utterance.volume = 0.72;
    var languagePrefix = isPolish ? "pl" : "en";
    var voices = speech.getVoices();
    var matchingVoice = voices.find(function (voice) {
      return String(voice.lang || "").toLowerCase().indexOf(languagePrefix) === 0;
    });
    if (matchingVoice) utterance.voice = matchingVoice;
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
      context.resume().then(playDepletedGroan).catch(function () {
        // The voice fallback can still play when Web Audio stays locked.
      });
    }
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") return;

    var utterance = new window.SpeechSynthesisUtterance("Aaaah...");
    utterance.lang = language === "pl" ? "pl-PL" : "en-US";
    utterance.rate = 0.56;
    utterance.pitch = 0.34;
    utterance.volume = 0.58;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 30);
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
      { frequency: 523.25, start: 0, duration: 0.16 },
      { frequency: 659.25, start: 0.12, duration: 0.17 },
      { frequency: 783.99, start: 0.24, duration: 0.2 },
      { frequency: 1046.5, start: 0.38, duration: 0.58 }
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
        if (index === 3) {
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
    disconnectLater(nodes, 1500);
  }

  function playSuccess(language) {
    if (!enabled) return;
    if (speech) speech.cancel();
    if (ensureContext()) {
      context.resume().then(playSuccessFanfare).catch(function () {
        // The spoken flourish can still play if Web Audio stays locked.
      });
    }
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") return;

    var utterance = new window.SpeechSynthesisUtterance("Ta-daaam!");
    utterance.lang = language === "pl" ? "pl-PL" : "en-US";
    utterance.rate = 0.68;
    utterance.pitch = 0.92;
    utterance.volume = 0.68;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 340);
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
      context.resume().then(playFailureTone).catch(function () {
        // The spoken reaction can still play when Web Audio stays locked.
      });
    }
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") return;

    var isPolish = language === "pl";
    var utterance = new window.SpeechSynthesisUtterance(
      isPolish ? "O nie..." : "Oh no..."
    );
    utterance.lang = isPolish ? "pl-PL" : "en-US";
    utterance.rate = 0.66;
    utterance.pitch = 0.46;
    utterance.volume = 0.58;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 105);
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
      context.resume().then(playShadowWhistleTone).catch(function () {
        // The whistles remain optional when Web Audio stays locked.
      });
    }
    if (!speech || typeof window.SpeechSynthesisUtterance !== "function") return;

    var utterance = new window.SpeechSynthesisUtterance("No, no!");
    utterance.lang = language === "pl" ? "pl-PL" : "en-US";
    utterance.rate = 0.78;
    utterance.pitch = 0.76;
    utterance.volume = 0.58;
    window.setTimeout(function () {
      if (enabled) speech.speak(utterance);
    }, 470);
  }

  function stopAll() {
    stopDrive(0.035);
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
      if (!document.hidden) playWhistle();
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
    setEnabled: setEnabled,
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
    stopAll: stopAll
  };
})();
