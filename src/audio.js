(function () {
  "use strict";

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var storageKey = "robonavi-sound-enabled-v1";
  var context = null;
  var masterGain = null;
  var whistleTimer = null;
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
    playRobotWhistle: playWhistle
  };
})();
