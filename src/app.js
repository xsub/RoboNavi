(function () {
  "use strict";

  var core = window.RoboNaviCore;
  var generator = window.RoboNaviGenerator;
  var sound = window.RoboNaviSound;
  var storageKey = "robonavi-progress-v1";
  var lightStorageKey = "robonavi-global-light-v1";
  var floorHueStorageKey = "robonavi-floor-hue-v1";
  var backgroundHueStorageKey = "robonavi-background-hue-v1";
  var robotHueStorageKey = "robonavi-robot-hue-v1";
  var freeDriveStorageKey = "robonavi-free-drive-v1";
  var repositoryUrl = "https://github.com/xsub/RoboNavi";
  var repositoryApiUrl = "https://api.github.com/repos/xsub/RoboNavi/commits/main";
  var fallbackProgramVersion = "834f799";
  var terrainColors = {
    floor: { top: "#bdd8e2", edge: "#9bb8c2", detail: "#f4fbfd", low: "#9ebfc9" },
    sand: { top: "#d9bd77", edge: "#b89b5d", detail: "#fff0bd", low: "#bfa05f" },
    ice: { top: "#a9d5df", edge: "#82b4c0", detail: "#f4feff", low: "#89bbc7" },
    charger: { top: "#dfb5cb", edge: "#9f7189", detail: "#fff1f8", low: "#c28ea9" },
    wall: { top: "#b6cbb2", edge: "#667f72", detail: "#f2f8ef", low: "#8fa792" }
  };
  var floorPalettes = [
    { top: "#bdd8e2", edge: "#9bb8c2", detail: "#f4fbfd", low: "#9ebfc9" },
    { top: "#c5dfe7", edge: "#a7c1c9", detail: "#f8fdfe", low: "#a7c6cf" }
  ];
  var interestPalette = {
    top: "#dfb5cb",
    edge: "#9f7189",
    detail: "#fff1f8",
    low: "#c28ea9"
  };
  var wallPalettes = [
    {
      top: "#b6cbb2",
      detail: "#f2f8ef",
      low: "#8fa792",
      edge: "#667f72",
      right: "#789283",
      left: "#8fa995"
    }
  ];
  var languageStorageKey = "robonavi-language-v1";
  var translations = {
    en: {
      controlSystem: '3D "LOGO" PROGRAMMING',
      mission: "Mission",
      help: "Help",
      sound: "Sound",
      muteSound: "Mute sound",
      enableSound: "Enable sound",
      energy: "Energy",
      runs: "Runs",
      best: "Best",
      levels: "Levels",
      random: "Random",
      reset: "Reset",
      generatorTitle: "Random level generator",
      generatorSize: "Board size",
      generatorSolutions: "Minimum solutions",
      generatorDensity: "Wall density",
      generatorRelaxed: "Relaxed",
      generatorBalanced: "Balanced",
      generatorDense: "Dense",
      cancel: "Cancel",
      generate: "Generate",
      generating: "Generating and validating",
      generatorFailed: "Generation failed. Try different options.",
      generatedLevel: "Generated map",
      generatedSubtitle: "Dijkstra: {routes} routes | A*: {commands} commands",
      congratulations: "Congratulations!",
      inductPower: "Induct power",
      program: "Program",
      light: "Light",
      globalLight: "Global light",
      floorColor: "Floor color",
      backgroundColor: "Background color",
      robotColor: "Robot color",
      freeDrive: "Free drive",
      noLimit: "No limit",
      shadow: "Shadow",
      undo: "Undo",
      clear: "Clear",
      execute: "Execute",
      energyTarget: "Energy target",
      runTarget: "Run target",
      facing: "Facing",
      empty: "Empty",
      beacons: "beacons",
      loadLevel: "Load level",
      remove: "Remove",
      addCommand: "Add command",
      closeHelp: "Close help",
      language: "Language",
      boardLabel: "Game board",
      canvasLabel: "Isometric puzzle board",
      mapLabel: "Top-down map",
      controlsLabel: "Command controls",
      camera: "Camera",
      rotateCameraLeft: "Rotate camera left",
      rotateCameraRight: "Rotate camera right",
      zoomCameraOut: "Zoom out",
      zoomCameraIn: "Zoom in",
      helpTitle: "Robot operator guide",
      helpObjectiveTitle: "Restore the beacon",
      helpObjectiveText: "Reach each beacon and install its battery with B before the 60-second timer expires.",
      helpProgramTitle: "Build a program",
      helpProgramText: "Add commands, then execute the sequence. Z undoes, C clears, and X resets the level.",
      helpEnergyTitle: "Plan before running",
      helpEnergyText: "Every run has a startup cost. Enable Free drive to practice without energy costs.",
      helpTerrainTitle: "Read the terrain",
      helpTerrainText: "Use B on a beacon. Use I on a charging station; I1-I4 trade energy for a larger charge.",
      commands: {
        forward: "Forward",
        "turn-left": "Turn left",
        "turn-right": "Turn right",
        battery: "Install battery",
        induct: "Induct charge"
      },
      commandLabels: {
        forward: "^",
        "turn-left": "<",
        "turn-right": ">",
        battery: "B",
        induct: "I"
      },
      directions: { north: "N", east: "E", south: "S", west: "W" },
      messages: {
        ready: "Ready",
        executing: "Executing",
        completed: "Beacon network restored: {value}",
        freeDriveCompleted: "Free drive complete",
        blocked: "Blocked at command {value}",
        depleted: "Energy depleted",
        invalidBattery: "Battery requires a beacon",
        invalidInduct: "Induct requires a charging station",
        batteryDied: "Beacon battery died! ;(",
        ended: "Program ended"
      },
      levelData: {
        "wake-beacon": {
          name: "Wake Beacon",
          subtitle: "A straight path to the first signal."
        },
        "right-angle": {
          name: "Right Angle",
          subtitle: "One corner, one clean route."
        },
        "soft-shortcut": {
          name: "Soft Shortcut",
          subtitle: "Sand is predictable, but hungry."
        },
        "ice-slide": {
          name: "Ice Slide",
          subtitle: "A tile can move more than expected."
        },
        "outer-maze": {
          name: "Outer Maze",
          subtitle: "A wall keeps the simple path honest."
        },
        "long-corner": {
          name: "Long Corner",
          subtitle: "The same turn from a different heading."
        },
        "two-beacons": {
          name: "Two Beacons",
          subtitle: "A route can collect more than one signal."
        },
        "charge-crossing": {
          name: "Charge Crossing",
          subtitle: "The station turns a tight plan into a possible one."
        },
        "ice-rail": {
          name: "Ice Rail",
          subtitle: "A short command can cross a long strip."
        },
        "signal-run": {
          name: "Signal Run",
          subtitle: "A quiet perimeter route around rough ground."
        },
        "zigzag-relay": {
          name: "Zigzag Relay",
          subtitle: "Four signals trace a narrow switching route."
        },
        "sand-divide": {
          name: "Sand Divide",
          subtitle: "A long relay where every rough tile matters."
        },
        "ice-junction": {
          name: "Ice Junction",
          subtitle: "Chain three slides and stop on the right cells."
        },
        "charge-relay": {
          name: "Charge Relay",
          subtitle: "The route is longer than one battery can survive."
        },
        "final-network": {
          name: "Final Network",
          subtitle: "A full-system route through every known terrain."
        },
        "orbit-sweep": {
          name: "Orbit Sweep",
          subtitle: "Six signals form a wide route around obstacle islands."
        },
        "charge-chain": {
          name: "Charge Chain",
          subtitle: "Three stations keep a long seven-signal route alive."
        },
        "ice-weave": {
          name: "Ice Weave",
          subtitle: "Link three ice rails without losing the route."
        },
        "sand-matrix": {
          name: "Sand Matrix",
          subtitle: "Choose carefully across a field of costly shortcuts."
        },
        "grand-tour": {
          name: "Grand Tour",
          subtitle: "Eight beacons, three chargers, ice, and sand in one final system test."
        }
      }
    },
    pl: {
      controlSystem: '3D "LOGO" PROGRAMMING',
      mission: "Misja",
      help: "Pomoc",
      sound: "Dźwięk",
      muteSound: "Wycisz dźwięk",
      enableSound: "Włącz dźwięk",
      energy: "Energia",
      runs: "Uruchomienia",
      best: "Najlepiej",
      levels: "Poziomy",
      random: "Losowy",
      reset: "Resetuj",
      generatorTitle: "Generator losowego poziomu",
      generatorSize: "Rozmiar planszy",
      generatorSolutions: "Minimum rozwiązań",
      generatorDensity: "Gęstość ścian",
      generatorRelaxed: "Luźna",
      generatorBalanced: "Średnia",
      generatorDense: "Gęsta",
      cancel: "Anuluj",
      generate: "Generuj",
      generating: "Generowanie i walidacja",
      generatorFailed: "Generowanie nie powiodło się. Zmień opcje.",
      generatedLevel: "Plansza losowa",
      generatedSubtitle: "Dijkstra: {routes} tras | A*: {commands} komend",
      congratulations: "Gratulacje!",
      inductPower: "Moc indukcji",
      program: "Program",
      light: "Światło",
      globalLight: "Światło globalne",
      floorColor: "Kolor podłogi",
      backgroundColor: "Kolor tła",
      robotColor: "Kolor robota",
      freeDrive: "Swobodna jazda",
      noLimit: "No limit",
      shadow: "Podgląd",
      undo: "Cofnij",
      clear: "Wyczyść",
      execute: "Uruchom",
      energyTarget: "Cel energii",
      runTarget: "Cel uruchomień",
      facing: "Kierunek",
      empty: "Pusto",
      beacons: "nadajniki",
      loadLevel: "Wczytaj poziom",
      remove: "Usuń",
      addCommand: "Dodaj komendę",
      closeHelp: "Zamknij pomoc",
      language: "Język",
      boardLabel: "Plansza gry",
      canvasLabel: "Izometryczna plansza logiczna",
      mapLabel: "Mapa z góry",
      controlsLabel: "Panel komend",
      camera: "Kamera",
      rotateCameraLeft: "Obróć kamerę w lewo",
      rotateCameraRight: "Obróć kamerę w prawo",
      zoomCameraOut: "Oddal kamerę",
      zoomCameraIn: "Przybliż kamerę",
      helpTitle: "Przewodnik operatora robota",
      helpObjectiveTitle: "Uruchom nadajnik",
      helpObjectiveText: "Dotrzyj do każdego nadajnika i zainstaluj baterię klawiszem B przed upływem 60 sekund.",
      helpProgramTitle: "Zbuduj program",
      helpProgramText: "Dodaj komendy i uruchom sekwencję. Z cofa, C czyści, a X resetuje poziom.",
      helpEnergyTitle: "Planuj przed startem",
      helpEnergyText: "Każde uruchomienie ma koszt startowy. Włącz Swobodną jazdę, aby ćwiczyć bez kosztów energii.",
      helpTerrainTitle: "Czytaj teren",
      helpTerrainText: "Użyj B na nadajniku. Użyj I na stacji ładowania; I1-I4 wymienia energię na większy ładunek.",
      commands: {
        forward: "Naprzód",
        "turn-left": "Skręt w lewo",
        "turn-right": "Skręt w prawo",
        battery: "Zainstaluj baterię",
        induct: "Ładowanie indukcyjne"
      },
      commandLabels: {
        forward: "^",
        "turn-left": "<",
        "turn-right": ">",
        battery: "B",
        induct: "I"
      },
      directions: { north: "PŁN", east: "WSCH", south: "PŁD", west: "ZACH" },
      messages: {
        ready: "Gotowy",
        executing: "Wykonywanie",
        completed: "Sieć nadajników uruchomiona: {value}",
        freeDriveCompleted: "Swobodna jazda ukończona",
        blocked: "Blokada przy komendzie {value}",
        depleted: "Brak energii",
        invalidBattery: "Bateria wymaga pola nadajnika",
        invalidInduct: "Indukcja wymaga stacji ładowania",
        batteryDied: "Beacon battery died! ;(",
        ended: "Program zakończony"
      },
      levelData: {
        "wake-beacon": {
          name: "Uruchom nadajnik",
          subtitle: "Prosta droga do pierwszego sygnału."
        },
        "right-angle": {
          name: "Kąt prosty",
          subtitle: "Jeden zakręt, jedna czysta trasa."
        },
        "soft-shortcut": {
          name: "Miękki skrót",
          subtitle: "Piasek jest przewidywalny, ale zużywa energię."
        },
        "ice-slide": {
          name: "Ślizg po lodzie",
          subtitle: "Jedno pole może przesunąć robota dalej, niż oczekujesz."
        },
        "outer-maze": {
          name: "Zewnętrzny labirynt",
          subtitle: "Ściana wymusza uważne planowanie trasy."
        },
        "long-corner": {
          name: "Długi zakręt",
          subtitle: "Ten sam skręt z innego kierunku."
        },
        "two-beacons": {
          name: "Dwa nadajniki",
          subtitle: "Jedna trasa może zebrać więcej niż jeden sygnał."
        },
        "charge-crossing": {
          name: "Przez ładowarkę",
          subtitle: "Stacja ładowania umożliwia wykonanie ciasnego planu."
        },
        "ice-rail": {
          name: "Lodowy tor",
          subtitle: "Krótka komenda może pokonać długi odcinek."
        },
        "signal-run": {
          name: "Bieg po sygnał",
          subtitle: "Spokojna trasa obrzeżem, omijająca trudny teren."
        },
        "zigzag-relay": {
          name: "Przekaźnikowy zygzak",
          subtitle: "Cztery sygnały wyznaczają wąską trasę pełną zakrętów."
        },
        "sand-divide": {
          name: "Piaskowy podział",
          subtitle: "Długa sztafeta, w której liczy się każde trudne pole."
        },
        "ice-junction": {
          name: "Lodowy węzeł",
          subtitle: "Połącz trzy ślizgi i zatrzymaj się na właściwych polach."
        },
        "charge-relay": {
          name: "Sztafeta ładowania",
          subtitle: "Trasa jest dłuższa, niż wytrzyma pojedyncza bateria."
        },
        "final-network": {
          name: "Pełna sieć",
          subtitle: "Trasa przez wszystkie poznane rodzaje terenu."
        },
        "orbit-sweep": {
          name: "Okrążenie sygnałów",
          subtitle: "Sześć sygnałów prowadzi szeroką trasą wokół wysp przeszkód."
        },
        "charge-chain": {
          name: "Łańcuch ładowania",
          subtitle: "Trzy stacje podtrzymują długą trasę przez siedem sygnałów."
        },
        "ice-weave": {
          name: "Lodowy splot",
          subtitle: "Połącz trzy lodowe tory i nie zgub właściwej trasy."
        },
        "sand-matrix": {
          name: "Piaskowa matryca",
          subtitle: "Wybieraj uważnie między kosztownymi skrótami."
        },
        "grand-tour": {
          name: "Wielka trasa",
          subtitle: "Osiem nadajników, trzy ładowarki, lód i piasek w teście końcowym."
        }
      }
    }
  };

  var els = {
    stage: document.getElementById("three-stage"),
    miniMap: document.getElementById("mini-map"),
    cameraControls: document.getElementById("camera-controls"),
    cameraRotateLeft: document.getElementById("camera-rotate-left"),
    cameraRotateRight: document.getElementById("camera-rotate-right"),
    cameraZoomOut: document.getElementById("camera-zoom-out"),
    cameraZoomIn: document.getElementById("camera-zoom-in"),
    programVersion: document.getElementById("program-version"),
    levelName: document.getElementById("level-name"),
    levelSubtitle: document.getElementById("level-subtitle"),
    energyValue: document.getElementById("energy-value"),
    runCount: document.getElementById("run-count"),
    bestStars: document.getElementById("best-stars"),
    runMessage: document.getElementById("run-message"),
    objectiveStatus: document.getElementById("objective-status"),
    levelList: document.getElementById("level-list"),
    randomLevel: document.getElementById("random-level"),
    resetLevel: document.getElementById("reset-level"),
    lightLevel: document.getElementById("light-level"),
    lightValue: document.getElementById("light-value"),
    floorHue: document.getElementById("floor-hue"),
    floorColorSwatch: document.getElementById("floor-color-swatch"),
    backgroundHue: document.getElementById("background-hue"),
    backgroundColorSwatch: document.getElementById("background-color-swatch"),
    robotHue: document.getElementById("robot-hue"),
    robotColorSwatch: document.getElementById("robot-color-swatch"),
    freeDriveToggle: document.getElementById("free-drive-toggle"),
    previewToggle: document.getElementById("preview-toggle"),
    commandQueue: document.getElementById("command-queue"),
    undoCommand: document.getElementById("undo-command"),
    clearProgram: document.getElementById("clear-program"),
    executeProgram: document.getElementById("execute-program"),
    energyTarget: document.getElementById("energy-target"),
    runTarget: document.getElementById("run-target"),
    facingValue: document.getElementById("facing-value"),
    helpButton: document.getElementById("help-button"),
    soundToggle: document.getElementById("sound-toggle"),
    soundIcon: document.getElementById("sound-icon"),
    helpDialog: document.getElementById("help-dialog"),
    closeHelp: document.getElementById("close-help"),
    generatorDialog: document.getElementById("generator-dialog"),
    generatorForm: document.getElementById("generator-form"),
    closeGenerator: document.getElementById("close-generator"),
    cancelGenerator: document.getElementById("cancel-generator"),
    generateLevel: document.getElementById("generate-level"),
    generatorSize: document.getElementById("generator-size"),
    generatorSolutions: document.getElementById("generator-solutions"),
    generatorDensity: document.getElementById("generator-density"),
    generatorStatus: document.getElementById("generator-status"),
    celebration: document.getElementById("celebration"),
    confettiCanvas: document.getElementById("confetti-canvas"),
    celebrationMessage: document.getElementById("celebration-message"),
    inductLevels: document.getElementById("induct-levels"),
    languageSwitch: document.querySelector(".language-switch"),
    boardPanel: document.querySelector(".board-panel"),
    controlPanel: document.querySelector(".control-panel")
  };

  var mapCtx = els.miniMap.getContext("2d");
  var confettiCtx = els.confettiCanvas.getContext("2d");
  var celebrationFrame = null;
  var centerActiveLevel = true;

  function setProgramVersion(sha) {
    if (!els.programVersion || !/^[0-9a-f]{7,40}$/i.test(sha)) return;
    var shortSha = sha.slice(0, 7).toUpperCase();
    els.programVersion.textContent = "V" + shortSha;
    els.programVersion.href = repositoryUrl + "/commit/" + sha;
    els.programVersion.setAttribute(
      "aria-label",
      "Program version V" + shortSha + "; open commit on GitHub"
    );
  }

  function loadProgramVersion() {
    setProgramVersion(fallbackProgramVersion);
    if (!window.fetch) return;
    window.fetch(repositoryApiUrl, {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Version lookup failed");
        return response.json();
      })
      .then(function (commit) {
        if (commit && commit.sha) {
          setProgramVersion(commit.sha);
        }
      })
      .catch(function () {
        setProgramVersion(fallbackProgramVersion);
      });
  }
  var celebrationTimer = null;
  var confettiParticles = [];
  var batteryTimerId = null;
  var threeRenderer = null;
  var state = {
    levelIndex: 0,
    level: core.LEVELS[0],
    robot: null,
    displayPose: null,
    commands: [],
    preview: false,
    freeDrive: loadFreeDrive(),
    globalLight: loadGlobalLight(),
    floorHue: loadFloorHue(),
    backgroundHue: loadBackgroundHue(),
    robotHue: loadRobotHue(),
    cameraQuarterTurns: 0,
    cameraSnapKey: 0,
    runCount: 0,
    highlightIndex: null,
    animating: false,
    animation: null,
    gameOver: false,
    batteryDeadline: null,
    batterySecondsRemaining: null,
    language: loadLanguage(),
    messageKey: "ready",
    messageValue: null,
    progress: loadProgress()
  };

  function loadLanguage() {
    try {
      var saved = localStorage.getItem(languageStorageKey);
      return saved === "pl" ? "pl" : "en";
    } catch (error) {
      return "en";
    }
  }

  function clampGlobalLight(value) {
    return Math.max(0, Math.min(200, Number(value) || 0));
  }

  function loadGlobalLight() {
    try {
      var saved = localStorage.getItem(lightStorageKey);
      return saved === null ? 45 : clampGlobalLight(saved);
    } catch (error) {
      return 45;
    }
  }

  function saveGlobalLight() {
    try {
      localStorage.setItem(lightStorageKey, String(state.globalLight));
    } catch (error) {
      // The live control still works when storage is unavailable.
    }
  }

  function clampFloorHue(value) {
    return Math.max(0, Math.min(360, Number(value) || 0));
  }

  function loadFloorHue() {
    try {
      var saved = localStorage.getItem(floorHueStorageKey);
      return saved === null ? 196 : clampFloorHue(saved);
    } catch (error) {
      return 196;
    }
  }

  function saveFloorHue() {
    try {
      localStorage.setItem(floorHueStorageKey, String(state.floorHue));
    } catch (error) {
      // The live floor color control still works without storage.
    }
  }

  function loadBackgroundHue() {
    try {
      var saved = localStorage.getItem(backgroundHueStorageKey);
      return saved === null ? 195 : clampFloorHue(saved);
    } catch (error) {
      return 195;
    }
  }

  function saveBackgroundHue() {
    try {
      localStorage.setItem(backgroundHueStorageKey, String(state.backgroundHue));
    } catch (error) {
      // The live background color control still works without storage.
    }
  }

  function loadRobotHue() {
    try {
      var saved = localStorage.getItem(robotHueStorageKey);
      return saved === null ? 30 : clampFloorHue(saved);
    } catch (error) {
      return 30;
    }
  }

  function saveRobotHue() {
    try {
      localStorage.setItem(robotHueStorageKey, String(state.robotHue));
    } catch (error) {
      // The live robot color control still works without storage.
    }
  }

  function loadFreeDrive() {
    try {
      return localStorage.getItem(freeDriveStorageKey) === "true";
    } catch (error) {
      return false;
    }
  }

  function saveFreeDrive() {
    try {
      localStorage.setItem(freeDriveStorageKey, state.freeDrive ? "true" : "false");
    } catch (error) {
      // The current free-drive setting still works without storage.
    }
  }

  function simulationOptions() {
    return { unlimitedEnergy: state.freeDrive };
  }

  function floorHueColor(value) {
    return "hsl(" + Math.round(clampFloorHue(value)) + " 48% 74%)";
  }

  function backgroundHueColor(value) {
    return "hsl(" + Math.round(clampFloorHue(value)) + " 42% 40%)";
  }

  function robotHueColor(value) {
    return "hsl(" + Math.round(clampFloorHue(value)) + " 88% 58%)";
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveProgress() {
    localStorage.setItem(storageKey, JSON.stringify(state.progress));
  }

  function copy() {
    return translations[state.language];
  }

  function uppercase(value) {
    return String(value).toLocaleUpperCase(state.language === "pl" ? "pl-PL" : "en-US");
  }

  function text(key) {
    return uppercase(copy()[key] || translations.en[key] || key);
  }

  function renderSoundControl() {
    var supported = Boolean(sound && sound.isSupported());
    var active = supported && sound.isEnabled();
    var actionKey = active ? "muteSound" : "enableSound";
    els.soundToggle.disabled = !supported;
    els.soundToggle.setAttribute("aria-pressed", active ? "true" : "false");
    els.soundToggle.title = text(actionKey);
    els.soundToggle.setAttribute("aria-label", text(actionKey));
    els.soundIcon.textContent = active ? "\ud83d\udd0a" : "\ud83d\udd07";
  }

  function setMessage(key, value) {
    state.messageKey = key;
    state.messageValue = value == null ? null : String(value);
  }

  function messageText() {
    var template = copy().messages[state.messageKey] || state.messageKey;
    return uppercase(template.replace("{value}", state.messageValue || ""));
  }

  function localizedLevel(level) {
    if (level.generated && level.generation) {
      var routeCount =
        level.generation.routeCount >= level.generation.routeLimit
          ? level.generation.routeCount + "+"
          : String(level.generation.routeCount);
      return {
        name: text("generatedLevel"),
        subtitle: uppercase(
          copy().generatedSubtitle
            .replace("{routes}", routeCount)
            .replace("{commands}", String(level.generation.optimalCommands))
        )
      };
    }
    var levelCopy = copy().levelData[level.id] || {
      name: level.name,
      subtitle: level.subtitle
    };
    return {
      name: uppercase(levelCopy.name),
      subtitle: uppercase(levelCopy.subtitle)
    };
  }

  function bestStarsFor(level) {
    return state.progress[level.id] || 0;
  }

  function starText(stars) {
    return "★".repeat(stars) + "☆".repeat(3 - stars);
  }

  function renderRunMessage() {
    var template = copy().messages[state.messageKey] || state.messageKey;
    if (state.messageKey !== "completed" || template.indexOf("{value}") === -1) {
      els.runMessage.textContent = messageText();
      return;
    }

    var parts = template.split("{value}");
    var stars = document.createElement("span");
    stars.className = "message-stars";
    stars.textContent = state.messageValue || "";
    els.runMessage.textContent = uppercase(parts[0]);
    els.runMessage.appendChild(stars);
    if (parts[1]) {
      els.runMessage.appendChild(document.createTextNode(uppercase(parts[1])));
    }
  }

  function syncDisplayPose() {
    state.displayPose = {
      x: state.robot.x,
      y: state.robot.y,
      direction: state.robot.direction,
      angle: directionAngle(state.robot.direction)
    };
  }

  function initialCameraTurns(direction) {
    return {
      north: -1,
      east: 0,
      south: 1,
      west: 2
    }[direction] || 0;
  }

  function activateLevel(level, index) {
    if (sound) sound.stopAll();
    stopCelebration();
    resetBatteryTimer();
    state.levelIndex = index;
    state.level = level;
    state.robot = core.createInitialState(state.level);
    state.commands = [];
    state.runCount = 0;
    state.highlightIndex = null;
    state.animating = false;
    state.animation = null;
    state.cameraQuarterTurns = initialCameraTurns(state.robot.direction);
    state.cameraSnapKey += 1;
    centerActiveLevel = true;
    setMessage("ready");
    syncDisplayPose();
    renderAll();
  }

  function loadLevel(index) {
    activateLevel(core.LEVELS[index], index);
  }

  function loadGeneratedLevel(level) {
    activateLevel(level, -1);
  }

  function resetLevel(keepProgram) {
    if (sound) sound.stopAll();
    stopCelebration();
    resetBatteryTimer();
    state.robot = core.createInitialState(state.level);
    state.runCount = 0;
    state.highlightIndex = null;
    state.animating = false;
    state.animation = null;
    state.cameraQuarterTurns = initialCameraTurns(state.robot.direction);
    state.cameraSnapKey += 1;
    setMessage("ready");
    if (!keepProgram) {
      state.commands = [];
    }
    syncDisplayPose();
    renderAll();
  }

  function addCommand(command) {
    if (state.animating || state.gameOver) return;
    state.commands.push(core.normalizeCommand(command));
    state.highlightIndex = null;
    setMessage("ready");
    renderAll();
  }

  function setLastInductAmount(amount) {
    if (state.animating || state.gameOver || state.commands.length === 0) return;
    var lastIndex = state.commands.length - 1;
    if (core.commandType(state.commands[lastIndex]) !== "induct") return;
    state.commands[lastIndex] = {
      type: "induct",
      amount: Math.max(1, Math.min(4, Number(amount) || 1))
    };
    state.highlightIndex = null;
    renderAll();
  }

  function removeCommand(index) {
    if (state.animating || state.gameOver) return;
    state.commands.splice(index, 1);
    state.highlightIndex = null;
    renderAll();
  }

  function clearProgram() {
    if (state.animating || state.gameOver) return;
    state.commands = [];
    state.highlightIndex = null;
    renderAll();
  }

  function executeProgram() {
    if (
      state.animating ||
      state.gameOver ||
      state.commands.length === 0 ||
      core.isComplete(state.level, state.robot)
    ) {
      return;
    }
    if (sound) sound.speakExecution(state.language);
    state.runCount += 1;
    var result = core.simulate(
      state.level,
      state.commands,
      state.robot,
      simulationOptions()
    );
    state.animation = {
      result: result,
      steps: buildAnimationSteps(result.events),
      index: 0,
      startedAt: 0,
      step: null,
      preparing: true,
      prepareStartedAt: 0,
      prepareDuration: 360
    };
    state.animating = true;
    state.highlightIndex = null;
    setMessage("executing");
    renderAll();
    window.requestAnimationFrame(tickAnimation);
  }

  function buildAnimationSteps(events) {
    var steps = [];
    events.forEach(function (event) {
      if (event.command === "forward" && event.path.length > 0) {
        var from = { x: event.from.x, y: event.from.y };
        event.path.forEach(function (point, pathIndex) {
          var isLast = pathIndex === event.path.length - 1;
          steps.push({
            type: "move",
            commandIndex: event.commandIndex,
            event: event,
            from: from,
            to: { x: point.x, y: point.y },
            duration: 400,
            endsCommand: isLast
          });
          from = { x: point.x, y: point.y };
        });
      } else if (event.command === "forward" && event.blockedAt) {
        steps.push({
          type: "bump",
          commandIndex: event.commandIndex,
          event: event,
          from: { x: event.from.x, y: event.from.y },
          to: event.blockedAt,
          duration: 260,
          endsCommand: true
        });
      } else if (event.command === "turn-left" || event.command === "turn-right") {
        var turnAmount = event.command === "turn-left" ? -Math.PI / 2 : Math.PI / 2;
        steps.push({
          type: "turn",
          commandIndex: event.commandIndex,
          event: event,
          from: { direction: event.from.direction },
          to: { direction: event.after.direction },
          fromAngle: directionAngle(event.from.direction),
          toAngle: directionAngle(event.from.direction) + turnAmount,
          duration: 280,
          endsCommand: true
        });
      } else {
        steps.push({
          type: "action",
          commandIndex: event.commandIndex,
          event: event,
          from: {
            x: event.from.x,
            y: event.from.y,
            direction: event.from.direction
          },
          duration: event.command === "induct" ? 480 : 380,
          endsCommand: true
        });
      }
    });
    steps.forEach(function (step, index) {
      if (step.type !== "move") return;
      step.continuesFromMove = connectedMoveSteps(steps[index - 1], step);
      step.continuesToMove = connectedMoveSteps(step, steps[index + 1]);
    });
    return steps;
  }

  function connectedMoveSteps(first, second) {
    return Boolean(
      first &&
      second &&
      first.type === "move" &&
      second.type === "move" &&
      first.to.x === second.from.x &&
      first.to.y === second.from.y &&
      first.event.from.direction === second.event.from.direction
    );
  }

  function smoothMoveProgress(progress, continuesFromMove, continuesToMove) {
    var squared = progress * progress;
    var cubed = squared * progress;
    var incomingSpeed = continuesFromMove ? 1 : 0;
    var outgoingSpeed = continuesToMove ? 1 : 0;
    return (
      (cubed - 2 * squared + progress) * incomingSpeed +
      (-2 * cubed + 3 * squared) +
      (cubed - squared) * outgoingSpeed
    );
  }

  function isDriveStep(step) {
    return Boolean(
      step &&
      (step.type === "move" || step.type === "turn" || step.type === "bump")
    );
  }

  function startAnimationStepSound(step) {
    if (!sound || !step) return;
    if (isDriveStep(step)) {
      sound.startDrive(step.type);
      if (step.type === "bump") {
        sound.playCollision();
      }
      return;
    }
    if (
      step.event.command === "battery" &&
      step.event.collected &&
      step.event.collected.length > 0
    ) {
      sound.playBatteryInstall();
    } else if (
      step.event.command === "induct" &&
      !step.event.invalidReason
    ) {
      sound.playInduct(step.event.inductAmount);
    }
  }

  function finishAnimationStepSound(step, nextStep) {
    if (!sound || !isDriveStep(step) || isDriveStep(nextStep)) return;
    sound.stopDrive();
  }

  function tickAnimation(timestamp) {
    var animation = state.animation;
    if (!animation) return;

    if (animation.preparing) {
      if (!animation.prepareStartedAt) {
        animation.prepareStartedAt = timestamp;
      }
      drawAll();
      if (timestamp - animation.prepareStartedAt < animation.prepareDuration) {
        window.requestAnimationFrame(tickAnimation);
        return;
      }
      animation.preparing = false;
    }

    if (!animation.step) {
      animation.step = animation.steps[animation.index];
      animation.startedAt = timestamp;
      startAnimationStepSound(animation.step);
    }

    if (!animation.step) {
      finishAnimation(animation.result);
      return;
    }

    var step = animation.step;
    var progress = Math.min(1, (timestamp - animation.startedAt) / step.duration);
    var eased = easeInOut(progress);
    animation.stepProgress = progress;
    state.highlightIndex = step.commandIndex;

    if (step.type === "move") {
      var moveProgress = smoothMoveProgress(
        progress,
        step.continuesFromMove,
        step.continuesToMove
      );
      state.displayPose.x = lerp(step.from.x, step.to.x, moveProgress);
      state.displayPose.y = lerp(step.from.y, step.to.y, moveProgress);
      state.displayPose.direction = step.event.from.direction;
      state.displayPose.angle = directionAngle(step.event.from.direction);
    } else if (step.type === "bump") {
      var bump = Math.sin(progress * Math.PI) * 0.18;
      state.displayPose.x = lerp(step.from.x, step.to.x, bump);
      state.displayPose.y = lerp(step.from.y, step.to.y, bump);
      state.displayPose.direction = step.event.from.direction;
      state.displayPose.angle = directionAngle(step.event.from.direction);
    } else if (step.type === "turn") {
      state.displayPose.x = step.event.from.x;
      state.displayPose.y = step.event.from.y;
      state.displayPose.direction = step.from.direction;
      state.displayPose.angle = lerp(step.fromAngle, step.toAngle, eased);
    } else {
      state.displayPose.x = step.from.x;
      state.displayPose.y = step.from.y;
      state.displayPose.direction = step.from.direction;
      state.displayPose.angle = directionAngle(step.from.direction);
    }

    drawAll();

    if (progress >= 1) {
      if (step.endsCommand) {
        state.robot = core.cloneState(step.event.after);
        syncDisplayPose();
        handleExecutionEvent(step.event);
        renderUi();
      }
      finishAnimationStepSound(
        step,
        animation.steps[animation.index + 1]
      );
      animation.index += 1;
      animation.step = animation.steps[animation.index] || null;
      animation.startedAt += step.duration;
      animation.stepProgress = 0;
      if (animation.step) {
        startAnimationStepSound(animation.step);
      }
    }

    window.requestAnimationFrame(tickAnimation);
  }

  function finishAnimation(result) {
    if (state.gameOver) return;
    if (sound) sound.stopDrive();
    state.robot = core.cloneState(result.finalState);
    syncDisplayPose();
    state.animating = false;
    state.animation = null;
    state.highlightIndex =
      result.events.length > 0 ? result.events[result.events.length - 1].commandIndex : null;

    if (
      !result.completed &&
      result.stoppedReason !== "out-of-energy" &&
      sound
    ) {
      sound.playFailure(state.language);
    }

    if (result.completed) {
      stopBatteryCountdown();
      if (sound) sound.playSuccess(state.language);
      if (state.freeDrive) {
        setMessage("freeDriveCompleted");
      } else {
        var stars = core.scoreCompletion(state.level, state.robot, state.runCount);
        state.progress[state.level.id] = Math.max(bestStarsFor(state.level), stars);
        saveProgress();
        setMessage("completed", starText(stars));
      }
    } else if (result.stoppedReason === "collision") {
      setMessage("blocked", state.highlightIndex + 1);
    } else if (result.stoppedReason === "out-of-energy") {
      if (sound) sound.playDepleted(state.language);
      setMessage("depleted");
    } else if (result.stoppedReason === "invalid-action") {
      var lastEvent = result.events[result.events.length - 1];
      setMessage(lastEvent.invalidReason === "battery" ? "invalidBattery" : "invalidInduct");
    } else {
      setMessage("ended");
    }
    renderAll();
    if (result.completed) {
      startCelebration();
    }
  }

  function handleExecutionEvent(event) {
    if (event.command !== "battery" || event.collected.length === 0) return;
    if (core.isComplete(state.level, state.robot)) {
      stopBatteryCountdown();
      return;
    }
    if (event.before.collected === 0 && state.batteryDeadline === null) {
      startBatteryCountdown();
    }
  }

  function stopBatteryInterval() {
    if (batteryTimerId !== null) {
      window.clearInterval(batteryTimerId);
      batteryTimerId = null;
    }
  }

  function stopBatteryCountdown() {
    stopBatteryInterval();
    state.batteryDeadline = null;
    state.batterySecondsRemaining = null;
  }

  function resetBatteryTimer() {
    stopBatteryCountdown();
    state.gameOver = false;
  }

  function startBatteryCountdown() {
    var duration = Number(state.level.batterySeconds) || 60;
    state.batteryDeadline = Date.now() + duration * 1000;
    state.batterySecondsRemaining = duration;
    stopBatteryInterval();
    batteryTimerId = window.setInterval(updateBatteryCountdown, 200);
    drawAll();
  }

  function updateBatteryCountdown() {
    if (state.batteryDeadline === null || state.gameOver) return;
    if (core.isComplete(state.level, state.robot)) {
      stopBatteryCountdown();
      return;
    }

    var remaining = Math.max(
      0,
      Math.ceil((state.batteryDeadline - Date.now()) / 1000)
    );
    if (remaining !== state.batterySecondsRemaining) {
      state.batterySecondsRemaining = remaining;
      drawAll();
    }
    if (remaining <= 0) {
      triggerBatteryGameOver();
    }
  }

  function triggerBatteryGameOver() {
    if (sound) sound.stopAll();
    stopBatteryInterval();
    stopCelebration();
    state.batterySecondsRemaining = 0;
    state.gameOver = true;
    state.animating = false;
    state.animation = null;
    state.highlightIndex = null;
    syncDisplayPose();
    setMessage("batteryDied");
    if (sound) sound.playFailure(state.language);
    renderAll();
  }

  function easeInOut(value) {
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function goalMask(index) {
    return 1 << index;
  }

  function stopCelebration() {
    if (celebrationFrame !== null) {
      window.cancelAnimationFrame(celebrationFrame);
      celebrationFrame = null;
    }
    if (celebrationTimer !== null) {
      window.clearTimeout(celebrationTimer);
      celebrationTimer = null;
    }
    confettiParticles = [];
    els.celebration.classList.remove("is-active");
    els.celebration.hidden = true;
    confettiCtx.clearRect(
      0,
      0,
      els.confettiCanvas.width,
      els.confettiCanvas.height
    );
  }

  function resizeConfettiCanvas() {
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var width = window.innerWidth;
    var height = window.innerHeight;
    els.confettiCanvas.width = Math.round(width * ratio);
    els.confettiCanvas.height = Math.round(height * ratio);
    els.confettiCanvas.style.width = width + "px";
    els.confettiCanvas.style.height = height + "px";
    confettiCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width: width, height: height };
  }

  function createConfettiParticle(index, size, colors) {
    var launcher = index % 3;
    var originX = [size.width * 0.08, size.width * 0.5, size.width * 0.92][launcher];
    var angle;
    if (launcher === 0) {
      angle = -1.34 + Math.random() * 0.62;
    } else if (launcher === 1) {
      angle = -2.22 + Math.random() * 1.3;
    } else {
      angle = -2.42 + Math.random() * 0.62;
    }
    var speed = 560 + Math.random() * 390;

    return {
      x: originX + (Math.random() - 0.5) * 34,
      y: size.height + 16 + Math.random() * 24,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      width: 5 + Math.random() * 7,
      height: 8 + Math.random() * 11,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 12,
      color: colors[index % colors.length],
      delay: Math.random() * 0.36
    };
  }

  function startCelebration() {
    stopCelebration();
    els.celebrationMessage.textContent = text("congratulations");
    els.celebration.hidden = false;
    void els.celebration.offsetWidth;
    els.celebration.classList.add("is-active");

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      celebrationTimer = window.setTimeout(stopCelebration, 2200);
      return;
    }

    var size = resizeConfettiCanvas();
    var colors = [
      "#58d3a9",
      "#7bc8ee",
      "#ef8ab8",
      "#ffd166",
      "#ff6f61",
      "#c8ef91",
      "#a996df"
    ];
    confettiParticles = [];
    for (var index = 0; index < 210; index += 1) {
      confettiParticles.push(createConfettiParticle(index, size, colors));
    }

    var startedAt = null;
    var previousAt = null;
    function animateCelebration(timestamp) {
      if (startedAt === null) {
        startedAt = timestamp;
        previousAt = timestamp;
      }
      var elapsed = (timestamp - startedAt) / 1000;
      var delta = Math.min(0.034, (timestamp - previousAt) / 1000);
      previousAt = timestamp;
      confettiCtx.clearRect(0, 0, size.width, size.height);

      confettiParticles.forEach(function (particle) {
        if (elapsed < particle.delay) return;
        particle.vx *= Math.pow(0.985, delta * 60);
        particle.vy += 680 * delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.rotationSpeed * delta;

        var alpha = elapsed > 2.8 ? Math.max(0, 1 - (elapsed - 2.8) / 0.8) : 1;
        confettiCtx.save();
        confettiCtx.globalAlpha = alpha;
        confettiCtx.translate(particle.x, particle.y);
        confettiCtx.rotate(particle.rotation);
        confettiCtx.fillStyle = particle.color;
        confettiCtx.fillRect(
          -particle.width / 2,
          -particle.height / 2,
          particle.width,
          particle.height
        );
        confettiCtx.restore();
      });

      if (elapsed < 3.6) {
        celebrationFrame = window.requestAnimationFrame(animateCelebration);
      } else {
        stopCelebration();
      }
    }

    celebrationFrame = window.requestAnimationFrame(animateCelebration);
  }

  function directionAngle(direction) {
    return {
      north: -Math.PI / 2,
      east: 0,
      south: Math.PI / 2,
      west: Math.PI
    }[direction];
  }

  function ensureCanvasSize(canvas, context) {
    var rect = canvas.getBoundingClientRect();
    var ratio = window.devicePixelRatio || 1;
    var width = Math.max(1, Math.round(rect.width * ratio));
    var height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  function drawAll() {
    drawMiniMap();
    if (!threeRenderer) return;
    try {
      threeRenderer.update(createThreeRenderSnapshot());
    } catch (error) {
      if (typeof threeRenderer.disable === "function") {
        threeRenderer.disable();
      }
      threeRenderer = null;
      els.stage.dataset.renderer = "failed";
      els.cameraRotateLeft.disabled = true;
      els.cameraRotateRight.disabled = true;
      console.error("RoboNavi Three.js renderer stopped.", error);
    }
  }

  function createThreeRenderPath() {
    var events = null;
    var start = null;
    var mode = null;
    if (state.animating && state.animation) {
      events = state.animation.result.events;
      start = events.length > 0 ? events[0].from : state.robot;
      mode = "execute";
    } else if (state.preview && state.commands.length > 0) {
      var preview = core.simulate(
        state.level,
        state.commands,
        state.robot,
        simulationOptions()
      );
      events = preview.events;
      start = state.robot;
      mode = "preview";
    }
    if (!events || !start) return null;

    var points = [{ x: start.x, y: start.y }];
    var collision = null;
    events.forEach(function (event) {
      (event.path || []).forEach(function (point) {
        points.push({ x: point.x, y: point.y });
      });
      if (event.blockedAt) {
        collision = { x: event.blockedAt.x, y: event.blockedAt.y };
      }
    });
    return {
      mode: mode,
      points: points,
      collision: collision
    };
  }

  function createThreeRenderSnapshot() {
    var activeStep =
      state.animation && state.animation.step
        ? {
            type: state.animation.step.type,
            command: state.animation.step.event.command,
            progress: state.animation.stepProgress || 0,
            continuesFromMove: Boolean(state.animation.step.continuesFromMove),
            continuesToMove: Boolean(state.animation.step.continuesToMove)
          }
        : null;
    return {
      level: state.level,
      robot: state.robot,
      displayPose: {
        x: state.displayPose.x,
        y: state.displayPose.y,
        direction: state.displayPose.direction,
        angle: state.displayPose.angle
      },
      path: createThreeRenderPath(),
      activeStep: activeStep,
      programRunning: state.animating,
      globalLight: state.globalLight,
      floorHue: state.floorHue,
      backgroundHue: state.backgroundHue,
      robotHue: state.robotHue,
      cameraQuarterTurns: state.cameraQuarterTurns,
      cameraSnapKey: state.cameraSnapKey,
      batterySecondsRemaining: state.batterySecondsRemaining,
      gameOver: state.gameOver,
      complete: core.isComplete(state.level, state.robot)
    };
  }

  function drawMiniMap() {
    var size = ensureCanvasSize(els.miniMap, mapCtx);
    var level = state.level;
    mapCtx.clearRect(0, 0, size.width, size.height);
    mapCtx.fillStyle = "rgba(246, 247, 250, 0.94)";
    mapCtx.fillRect(0, 0, size.width, size.height);

    var pad = 10;
    var cell = Math.min((size.width - pad * 2) / level.width, (size.height - pad * 2) / level.height);
    var offsetX = (size.width - cell * level.width) / 2;
    var offsetY = (size.height - cell * level.height) / 2;
    for (var y = 0; y < level.height; y += 1) {
      for (var x = 0; x < level.width; x += 1) {
        var terrain = core.terrainAt(level, x, y);
        mapCtx.fillStyle =
          terrain === "floor" ? floorHueColor(state.floorHue) : terrainColors[terrain].top;
        mapCtx.fillRect(offsetX + x * cell, offsetY + y * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }

    mapCtx.save();
    mapCtx.strokeStyle = "rgba(53, 84, 72, 0.82)";
    mapCtx.lineWidth = Math.max(1, cell * 0.11);
    mapCtx.beginPath();
    core.wallSegments(level).forEach(function (wall) {
      var startX = offsetX + wall.x * cell;
      var startY = offsetY + wall.y * cell;
      mapCtx.moveTo(startX, startY);
      if (wall.axis === "horizontal") {
        mapCtx.lineTo(startX + cell, startY);
      } else {
        mapCtx.lineTo(startX, startY + cell);
      }
    });
    mapCtx.stroke();
    mapCtx.restore();

    level.goals.forEach(function (goal, index) {
      var collected = (state.robot.collected & goalMask(index)) !== 0;
      mapCtx.fillStyle = collected ? "#58c9a3" : "#f4b83f";
      mapCtx.beginPath();
      mapCtx.arc(offsetX + (goal.x + 0.5) * cell, offsetY + (goal.y + 0.5) * cell, cell * 0.28, 0, Math.PI * 2);
      mapCtx.fill();
    });

    var robotX = offsetX + (state.displayPose.x + 0.5) * cell;
    var robotY = offsetY + (state.displayPose.y + 0.5) * cell;
    var robotAngle =
      typeof state.displayPose.angle === "number"
        ? state.displayPose.angle
        : directionAngle(state.displayPose.direction);
    var delta = {
      x: Math.cos(robotAngle),
      y: Math.sin(robotAngle)
    };
    mapCtx.fillStyle = "#c96f38";
    mapCtx.beginPath();
    mapCtx.moveTo(robotX + delta.x * cell * 0.42, robotY + delta.y * cell * 0.42);
    mapCtx.lineTo(robotX - delta.y * cell * 0.3 - delta.x * cell * 0.25, robotY + delta.x * cell * 0.3 - delta.y * cell * 0.25);
    mapCtx.lineTo(robotX + delta.y * cell * 0.3 - delta.x * cell * 0.25, robotY - delta.x * cell * 0.3 - delta.y * cell * 0.25);
    mapCtx.closePath();
    mapCtx.fill();
  }

  function renderAll() {
    renderUi();
    drawAll();
  }

  function renderUi() {
    var level = state.level;
    var levelCopy = localizedLevel(level);
    els.levelName.textContent =
      (level.generated ? "RND" : String(state.levelIndex + 1).padStart(2, "0")) +
      " " +
      levelCopy.name;
    els.levelSubtitle.textContent = levelCopy.subtitle;
    els.energyValue.textContent = state.freeDrive
      ? text("noLimit")
      : formatEnergy(state.robot.energyRemaining) + " / " + formatEnergy(level.energyMax);
    els.energyValue.parentElement.classList.toggle("is-unlimited", state.freeDrive);
    els.runCount.textContent = String(state.runCount);
    els.bestStars.textContent = starText(bestStarsFor(level));
    renderRunMessage();
    els.runMessage.parentElement.classList.toggle("is-game-over", state.gameOver);
    els.objectiveStatus.textContent =
      collectedCount(level, state.robot) + " / " + level.goals.length + " " + text("beacons");
    els.energyTarget.textContent = state.freeDrive
      ? text("noLimit")
      : formatEnergy(level.parEnergy);
    els.energyTarget.parentElement.classList.toggle("is-unlimited", state.freeDrive);
    els.runTarget.textContent = String(level.parRuns);
    els.facingValue.textContent =
      uppercase(copy().directions[state.robot.direction] || core.DIR_LABEL[state.robot.direction]);
    els.lightLevel.value = String(state.globalLight);
    els.lightValue.textContent = String(Math.round(state.globalLight)) + "%";
    els.floorHue.value = String(state.floorHue);
    els.floorHue.style.setProperty("--floor-hue-color", floorHueColor(state.floorHue));
    els.floorColorSwatch.style.background = floorHueColor(state.floorHue);
    els.backgroundHue.value = String(state.backgroundHue);
    els.backgroundHue.style.setProperty(
      "--background-hue-color",
      backgroundHueColor(state.backgroundHue)
    );
    els.backgroundColorSwatch.style.background = backgroundHueColor(state.backgroundHue);
    els.robotHue.value = String(state.robotHue);
    els.robotHue.style.setProperty("--robot-hue-color", robotHueColor(state.robotHue));
    els.robotColorSwatch.style.background = robotHueColor(state.robotHue);
    els.previewToggle.checked = state.preview;
    els.freeDriveToggle.checked = state.freeDrive;
    els.freeDriveToggle.disabled = state.animating;
    els.executeProgram.disabled =
      state.animating ||
      state.gameOver ||
      state.commands.length === 0 ||
      core.isComplete(level, state.robot);
    els.undoCommand.disabled =
      state.animating || state.gameOver || state.commands.length === 0;
    els.clearProgram.disabled =
      state.animating || state.gameOver || state.commands.length === 0;
    els.resetLevel.disabled = state.animating;
    els.randomLevel.disabled = state.animating;
    document.querySelectorAll("[data-command], [data-induct-amount]").forEach(function (button) {
      button.disabled = state.animating || state.gameOver;
    });

    renderLevels();
    renderQueue();
    renderInductLevels();
  }

  function renderLevels() {
    var previousScroll = els.levelList.scrollLeft;
    var activeButton = null;
    els.levelList.innerHTML = "";
    core.LEVELS.forEach(function (level, index) {
      var levelCopy = localizedLevel(level);
      var button = document.createElement("button");
      button.className = "level-button";
      if (index === state.levelIndex) {
        button.classList.add("is-active");
        activeButton = button;
      }
      button.type = "button";
      button.dataset.levelIndex = String(index);
      button.setAttribute(
        "aria-label",
        text("loadLevel") + " " + (index + 1) + ": " + levelCopy.name
      );
      button.innerHTML =
        "<span>" +
        String(index + 1) +
        "</span><small>" +
        starText(bestStarsFor(level)) +
        "</small>";
      button.disabled = state.animating;
      els.levelList.appendChild(button);
    });
    if (!centerActiveLevel || !activeButton) {
      els.levelList.scrollLeft = previousScroll;
      return;
    }
    centerActiveLevel = false;
    window.requestAnimationFrame(function () {
      var listRect = els.levelList.getBoundingClientRect();
      var buttonRect = activeButton.getBoundingClientRect();
      var centeredLeft =
        els.levelList.scrollLeft +
        buttonRect.left -
        listRect.left -
        (listRect.width - buttonRect.width) / 2;
      els.levelList.scrollTo({
        left: Math.max(0, centeredLeft),
        behavior: "smooth"
      });
    });
  }

  function renderQueue() {
    els.commandQueue.innerHTML = "";
    if (state.commands.length === 0) {
      var empty = document.createElement("div");
      empty.className = "queue-empty";
      empty.textContent = text("empty");
      els.commandQueue.appendChild(empty);
      return;
    }
    state.commands.forEach(function (command, index) {
      var type = core.commandType(command);
      var chip = document.createElement("button");
      chip.className = "queue-chip";
      if (index === state.highlightIndex) {
        chip.classList.add("is-active");
      }
      chip.type = "button";
      chip.dataset.commandIndex = String(index);
      chip.textContent =
        type === "forward" || type === "turn-left" || type === "turn-right"
          ? copy().commandLabels[type]
          : core.commandToken(command);
      chip.title = text("remove") + ": " + uppercase(copy().commands[type]);
      chip.setAttribute(
        "aria-label",
        text("remove") + " " + (index + 1) + ": " + uppercase(copy().commands[type])
      );
      chip.disabled = state.animating || state.gameOver;
      els.commandQueue.appendChild(chip);
    });
  }

  function renderInductLevels() {
    if (!els.inductLevels) return;
    var last = state.commands[state.commands.length - 1];
    var activeAmount =
      core.commandType(last) === "induct" ? core.normalizeCommand(last).amount : null;
    els.inductLevels.querySelectorAll("[data-induct-amount]").forEach(function (button) {
      button.classList.toggle(
        "is-active",
        Number(button.dataset.inductAmount) === activeAmount
      );
    });
  }

  function collectedCount(level, robot) {
    var total = 0;
    level.goals.forEach(function (_goal, index) {
      if ((robot.collected & goalMask(index)) !== 0) total += 1;
    });
    return total;
  }

  function formatEnergy(value) {
    if (Math.abs(value - Math.round(value)) < 0.001) {
      return String(Math.round(value));
    }
    return value.toFixed(2).replace(/0$/, "");
  }

  function applyLanguage(language, shouldRender) {
    state.language = translations[language] ? language : "en";
    document.documentElement.lang = state.language;
    try {
      localStorage.setItem(languageStorageKey, state.language);
    } catch (error) {
      // Language still works for the current session when storage is unavailable.
    }

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = text(element.dataset.i18n);
    });
    document.querySelectorAll("[data-language]").forEach(function (button) {
      button.setAttribute(
        "aria-pressed",
        button.dataset.language === state.language ? "true" : "false"
      );
    });

    els.languageSwitch.setAttribute("aria-label", text("language"));
    els.closeHelp.setAttribute("aria-label", text("closeHelp"));
    els.closeGenerator.setAttribute("aria-label", text("cancel"));
    els.boardPanel.setAttribute("aria-label", text("boardLabel"));
    els.stage.setAttribute("aria-label", text("canvasLabel"));
    els.miniMap.setAttribute("aria-label", text("mapLabel"));
    els.controlPanel.setAttribute("aria-label", text("controlsLabel"));
    els.cameraControls.setAttribute("aria-label", text("camera"));
    els.cameraRotateLeft.title = text("rotateCameraLeft");
    els.cameraRotateLeft.setAttribute("aria-label", text("rotateCameraLeft"));
    els.cameraRotateRight.title = text("rotateCameraRight");
    els.cameraRotateRight.setAttribute("aria-label", text("rotateCameraRight"));
    els.cameraZoomOut.title = text("zoomCameraOut");
    els.cameraZoomOut.setAttribute("aria-label", text("zoomCameraOut"));
    els.cameraZoomIn.title = text("zoomCameraIn");
    els.cameraZoomIn.setAttribute("aria-label", text("zoomCameraIn"));
    renderSoundControl();
    els.celebrationMessage.textContent = text("congratulations");
    els.inductLevels.setAttribute("aria-label", text("inductPower"));
    els.lightLevel.setAttribute("aria-label", text("globalLight"));
    els.floorHue.setAttribute("aria-label", text("floorColor"));
    els.backgroundHue.setAttribute("aria-label", text("backgroundColor"));
    els.robotHue.setAttribute("aria-label", text("robotColor"));

    document.querySelectorAll("[data-command]").forEach(function (button) {
      var commandName = uppercase(copy().commands[button.dataset.command]);
      var commandLabel = uppercase(
        copy().commandLabels[button.dataset.command] || copy().commands[button.dataset.command]
      );
      button.querySelector("span").textContent = commandLabel;
      button.title = commandName;
      button.setAttribute("aria-label", text("addCommand") + ": " + commandName);
    });

    if (els.generatorStatus.dataset.messageKey) {
      els.generatorStatus.textContent = text(els.generatorStatus.dataset.messageKey);
    }

    if (state.robot && shouldRender !== false) {
      renderAll();
    }
  }

  function setGeneratorStatus(key) {
    els.generatorStatus.dataset.messageKey = key || "";
    els.generatorStatus.textContent = key ? text(key) : "";
  }

  function openGeneratorDialog() {
    if (state.animating) return;
    setGeneratorStatus("");
    if (typeof els.generatorDialog.showModal === "function") {
      els.generatorDialog.showModal();
    } else {
      els.generatorDialog.setAttribute("open", "");
    }
  }

  function closeGeneratorDialog() {
    if (typeof els.generatorDialog.close === "function") {
      els.generatorDialog.close();
    } else {
      els.generatorDialog.removeAttribute("open");
    }
  }

  function createGeneratedLevel() {
    setGeneratorStatus("generating");
    els.generateLevel.disabled = true;

    window.setTimeout(function () {
      try {
        var level = generator.generateLevel({
          size: Number(els.generatorSize.value),
          minSolutions: Number(els.generatorSolutions.value),
          density: els.generatorDensity.value
        });
        loadGeneratedLevel(level);
        closeGeneratorDialog();
      } catch (error) {
        setGeneratorStatus("generatorFailed");
      } finally {
        els.generateLevel.disabled = false;
      }
    }, 20);
  }

  els.levelList.addEventListener("click", function (event) {
    var button = event.target.closest("[data-level-index]");
    if (!button || state.animating) return;
    loadLevel(Number(button.dataset.levelIndex));
  });

  els.commandQueue.addEventListener("click", function (event) {
    var button = event.target.closest("[data-command-index]");
    if (!button || state.animating) return;
    removeCommand(Number(button.dataset.commandIndex));
  });

  document.querySelectorAll("[data-command]").forEach(function (button) {
    button.addEventListener("click", function () {
      addCommand(button.dataset.command);
    });
  });

  els.inductLevels.addEventListener("click", function (event) {
    var button = event.target.closest("[data-induct-amount]");
    if (!button) return;
    setLastInductAmount(button.dataset.inductAmount);
  });

  els.undoCommand.addEventListener("click", function () {
    if (!state.animating && !state.gameOver && state.commands.length > 0) {
      state.commands.pop();
      state.highlightIndex = null;
      renderAll();
    }
  });

  els.clearProgram.addEventListener("click", clearProgram);

  els.executeProgram.addEventListener("click", executeProgram);

  els.randomLevel.addEventListener("click", openGeneratorDialog);

  els.resetLevel.addEventListener("click", function () {
    resetLevel(false);
  });

  els.previewToggle.addEventListener("change", function () {
    state.preview = els.previewToggle.checked;
    if (state.preview && sound) {
      sound.playShadowEnabled(state.language);
    }
    drawAll();
  });

  els.freeDriveToggle.addEventListener("change", function () {
    if (state.animating) {
      els.freeDriveToggle.checked = state.freeDrive;
      return;
    }
    state.freeDrive = els.freeDriveToggle.checked;
    saveFreeDrive();
    setMessage("ready");
    renderAll();
  });

  els.lightLevel.addEventListener("input", function () {
    state.globalLight = clampGlobalLight(els.lightLevel.value);
    els.lightValue.textContent = String(Math.round(state.globalLight)) + "%";
    saveGlobalLight();
    drawAll();
  });

  els.floorHue.addEventListener("input", function () {
    state.floorHue = clampFloorHue(els.floorHue.value);
    els.floorHue.style.setProperty("--floor-hue-color", floorHueColor(state.floorHue));
    els.floorColorSwatch.style.background = floorHueColor(state.floorHue);
    saveFloorHue();
    drawAll();
  });

  els.backgroundHue.addEventListener("input", function () {
    state.backgroundHue = clampFloorHue(els.backgroundHue.value);
    els.backgroundHue.style.setProperty(
      "--background-hue-color",
      backgroundHueColor(state.backgroundHue)
    );
    els.backgroundColorSwatch.style.background = backgroundHueColor(state.backgroundHue);
    saveBackgroundHue();
    drawAll();
  });

  els.robotHue.addEventListener("input", function () {
    state.robotHue = clampFloorHue(els.robotHue.value);
    els.robotHue.style.setProperty("--robot-hue-color", robotHueColor(state.robotHue));
    els.robotColorSwatch.style.background = robotHueColor(state.robotHue);
    saveRobotHue();
    drawAll();
  });

  els.cameraRotateLeft.addEventListener("click", function () {
    state.cameraQuarterTurns -= 1;
    drawAll();
  });

  els.cameraRotateRight.addEventListener("click", function () {
    state.cameraQuarterTurns += 1;
    drawAll();
  });

  els.cameraZoomOut.addEventListener("click", function () {
    if (threeRenderer && typeof threeRenderer.zoomBy === "function") {
      threeRenderer.zoomBy(-1);
    }
  });

  els.cameraZoomIn.addEventListener("click", function () {
    if (threeRenderer && typeof threeRenderer.zoomBy === "function") {
      threeRenderer.zoomBy(1);
    }
  });

  els.soundToggle.addEventListener("click", function () {
    if (!sound || !sound.isSupported()) return;
    sound.toggle();
    renderSoundControl();
  });

  els.languageSwitch.addEventListener("click", function (event) {
    var button = event.target.closest("[data-language]");
    if (!button) return;
    applyLanguage(button.dataset.language, true);
  });

  els.helpButton.addEventListener("click", function () {
    if (typeof els.helpDialog.showModal === "function") {
      els.helpDialog.showModal();
    } else {
      els.helpDialog.setAttribute("open", "");
    }
  });

  els.closeHelp.addEventListener("click", function () {
    if (typeof els.helpDialog.close === "function") {
      els.helpDialog.close();
    } else {
      els.helpDialog.removeAttribute("open");
    }
  });

  els.helpDialog.addEventListener("click", function (event) {
    if (event.target === els.helpDialog) {
      els.helpDialog.close();
    }
  });

  els.generatorForm.addEventListener("submit", function (event) {
    event.preventDefault();
    createGeneratedLevel();
  });

  els.closeGenerator.addEventListener("click", closeGeneratorDialog);
  els.cancelGenerator.addEventListener("click", closeGeneratorDialog);

  els.generatorDialog.addEventListener("click", function (event) {
    if (event.target === els.generatorDialog) {
      closeGeneratorDialog();
    }
  });

  window.addEventListener("keydown", function (event) {
    if (els.helpDialog.open || els.generatorDialog.open) return;
    if (event.target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].indexOf(event.target.tagName) !== -1) {
      return;
    }
    var key = event.key.toLowerCase();
    if (state.gameOver && key !== "x") return;
    if (event.key === "ArrowUp" || key === "w" || key === "f") {
      event.preventDefault();
      addCommand("forward");
    } else if (event.key === "ArrowLeft" || key === "a" || key === "l") {
      event.preventDefault();
      addCommand("turn-left");
    } else if (event.key === "ArrowRight" || key === "d" || key === "r") {
      event.preventDefault();
      addCommand("turn-right");
    } else if (key === "b") {
      event.preventDefault();
      addCommand("battery");
    } else if (key === "i") {
      event.preventDefault();
      addCommand({ type: "induct", amount: 1 });
    } else if (["1", "2", "3", "4"].indexOf(key) !== -1) {
      event.preventDefault();
      setLastInductAmount(Number(key));
    } else if (event.key === "Backspace" || key === "z") {
      event.preventDefault();
      if (state.commands.length > 0) {
        state.commands.pop();
        renderAll();
      }
    } else if (key === "c") {
      event.preventDefault();
      clearProgram();
    } else if (key === "x") {
      event.preventDefault();
      resetLevel(false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      executeProgram();
    }
  });

  var resizeFrame = null;
  function scheduleBoardRedraw() {
    if (!state.robot || resizeFrame !== null) return;
    resizeFrame = window.requestAnimationFrame(function () {
      resizeFrame = null;
      drawAll();
    });
  }

  window.addEventListener("resize", scheduleBoardRedraw);
  window.addEventListener("load", scheduleBoardRedraw);
  document.addEventListener("pointerdown", function () {
    if (sound) sound.unlock();
  }, { capture: true, once: true });
  document.addEventListener("keydown", function () {
    if (sound) sound.unlock();
  }, { capture: true, once: true });
  if (typeof window.ResizeObserver === "function") {
    var miniMapResizeObserver = new window.ResizeObserver(scheduleBoardRedraw);
    miniMapResizeObserver.observe(els.miniMap);
  }

  window.RoboNaviRenderBridge = {
    attach: function (renderer) {
      if (!renderer || typeof renderer.update !== "function") return;
      threeRenderer = renderer;
      els.stage.dataset.renderer = "three";
      els.cameraRotateLeft.disabled = false;
      els.cameraRotateRight.disabled = false;
      els.cameraZoomOut.disabled = false;
      els.cameraZoomIn.disabled = false;
      renderer.update(createThreeRenderSnapshot());
    },
    detach: function (renderer) {
      if (renderer && threeRenderer !== renderer) return;
      threeRenderer = null;
      els.stage.dataset.renderer = "failed";
      els.cameraRotateLeft.disabled = true;
      els.cameraRotateRight.disabled = true;
      els.cameraZoomOut.disabled = true;
      els.cameraZoomIn.disabled = true;
    },
    snapshot: createThreeRenderSnapshot
  };

  loadProgramVersion();
  applyLanguage(state.language, false);
  loadLevel(0);
})();
