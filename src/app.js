(function () {
  "use strict";

  var core = window.RoboNaviCore;
  var generator = window.RoboNaviGenerator;
  var storageKey = "robonavi-progress-v1";
  var terrainColors = {
    floor: { top: "#bdd8e2", edge: "#789aa7", detail: "#f4fbfd", low: "#9ebfc9" },
    sand: { top: "#d9bd77", edge: "#a7884b", detail: "#fff0bd", low: "#bfa05f" },
    ice: { top: "#a9d5df", edge: "#6f9eab", detail: "#f4feff", low: "#89bbc7" },
    charger: { top: "#dfb5cb", edge: "#9f7189", detail: "#fff1f8", low: "#c28ea9" },
    wall: { top: "#b6cbb2", edge: "#667f72", detail: "#f2f8ef", low: "#8fa792" }
  };
  var floorPalettes = [
    { top: "#bdd8e2", edge: "#789aa7", detail: "#f4fbfd", low: "#9ebfc9" },
    { top: "#c5dfe7", edge: "#82a2ad", detail: "#f8fdfe", low: "#a7c6cf" }
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
      helpTitle: "Robot operator guide",
      helpObjectiveTitle: "Restore the beacon",
      helpObjectiveText: "Reach each beacon and install its battery with B before the 60-second timer expires.",
      helpProgramTitle: "Build a program",
      helpProgramText: "Add commands, then execute the sequence. Z undoes, C clears, and X resets the level.",
      helpEnergyTitle: "Plan before running",
      helpEnergyText: "Every run has a startup cost. Longer, correct programs save energy.",
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
      helpTitle: "Przewodnik operatora robota",
      helpObjectiveTitle: "Uruchom nadajnik",
      helpObjectiveText: "Dotrzyj do każdego nadajnika i zainstaluj baterię klawiszem B przed upływem 60 sekund.",
      helpProgramTitle: "Zbuduj program",
      helpProgramText: "Dodaj komendy i uruchom sekwencję. Z cofa, C czyści, a X resetuje poziom.",
      helpEnergyTitle: "Planuj przed startem",
      helpEnergyText: "Każde uruchomienie ma koszt startowy. Dłuższy poprawny program oszczędza energię.",
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
    canvas: document.getElementById("game-canvas"),
    miniMap: document.getElementById("mini-map"),
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
    previewToggle: document.getElementById("preview-toggle"),
    commandQueue: document.getElementById("command-queue"),
    undoCommand: document.getElementById("undo-command"),
    clearProgram: document.getElementById("clear-program"),
    executeProgram: document.getElementById("execute-program"),
    energyTarget: document.getElementById("energy-target"),
    runTarget: document.getElementById("run-target"),
    facingValue: document.getElementById("facing-value"),
    helpButton: document.getElementById("help-button"),
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

  var ctx = els.canvas.getContext("2d");
  var mapCtx = els.miniMap.getContext("2d");
  var confettiCtx = els.confettiCanvas.getContext("2d");
  var celebrationFrame = null;
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

  function activateLevel(level, index) {
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
    stopCelebration();
    resetBatteryTimer();
    state.robot = core.createInitialState(state.level);
    state.runCount = 0;
    state.highlightIndex = null;
    state.animating = false;
    state.animation = null;
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
    state.runCount += 1;
    var result = core.simulate(state.level, state.commands, state.robot);
    state.animation = {
      result: result,
      steps: buildAnimationSteps(result.events),
      index: 0,
      startedAt: 0,
      step: null
    };
    state.animating = true;
    state.highlightIndex = null;
    setMessage("executing");
    renderUi();
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
            duration: 230,
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
    return steps;
  }

  function tickAnimation(timestamp) {
    var animation = state.animation;
    if (!animation) return;

    if (!animation.step) {
      animation.step = animation.steps[animation.index];
      animation.startedAt = timestamp;
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
      state.displayPose.x = lerp(step.from.x, step.to.x, eased);
      state.displayPose.y = lerp(step.from.y, step.to.y, eased);
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
      animation.index += 1;
      animation.step = null;
      animation.stepProgress = 0;
    }

    window.requestAnimationFrame(tickAnimation);
  }

  function finishAnimation(result) {
    if (state.gameOver) return;
    state.robot = core.cloneState(result.finalState);
    syncDisplayPose();
    state.animating = false;
    state.animation = null;
    state.highlightIndex =
      result.events.length > 0 ? result.events[result.events.length - 1].commandIndex : null;

    if (result.completed) {
      stopBatteryCountdown();
      var stars = core.scoreCompletion(state.level, state.robot, state.runCount);
      state.progress[state.level.id] = Math.max(bestStarsFor(state.level), stars);
      saveProgress();
      setMessage("completed", starText(stars));
    } else if (result.stoppedReason === "collision") {
      setMessage("blocked", state.highlightIndex + 1);
    } else if (result.stoppedReason === "out-of-energy") {
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
    stopBatteryInterval();
    stopCelebration();
    state.batterySecondsRemaining = 0;
    state.gameOver = true;
    state.animating = false;
    state.animation = null;
    state.highlightIndex = null;
    syncDisplayPose();
    setMessage("batteryDied");
    renderAll();
  }

  function easeInOut(value) {
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
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

  function metrics(width, height, level) {
    var boardSpan = level.width + level.height;
    var isoRatio = 0.54;
    var tileW = Math.min(
      (width - 56) * 2 / boardSpan,
      (height - 84) * 2 / (boardSpan * isoRatio)
    );
    tileW = Math.max(20, Math.min(140, tileW));
    var tileH = tileW * isoRatio;
    return {
      tileW: tileW,
      tileH: tileH,
      originX: width / 2,
      originY: Math.max(26, (height - ((level.width + level.height) * tileH) / 2) / 2)
    };
  }

  function project(point, layout) {
    return {
      x: (point.x - point.y) * layout.tileW / 2 + layout.originX,
      y: (point.x + point.y) * layout.tileH / 2 + layout.originY
    };
  }

  function cellCenter(x, y, layout) {
    return project({ x: x + 0.5, y: y + 0.5 }, layout);
  }

  function drawAll() {
    if (!threeRenderer) {
      drawBoard();
    }
    drawMiniMap();
    if (threeRenderer) {
      try {
        threeRenderer.update(createThreeRenderSnapshot());
      } catch (error) {
        if (typeof threeRenderer.disable === "function") {
          threeRenderer.disable();
        }
        threeRenderer = null;
        els.canvas.parentElement.classList.remove("three-ready");
        drawBoard();
        console.warn("RoboNavi switched back to the Canvas renderer.", error);
      }
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
      var preview = core.simulate(state.level, state.commands, state.robot);
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
            progress: state.animation.stepProgress || 0
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
      batterySecondsRemaining: state.batterySecondsRemaining,
      gameOver: state.gameOver,
      complete: core.isComplete(state.level, state.robot)
    };
  }

  function drawBoard() {
    var size = ensureCanvasSize(els.canvas, ctx);
    var layout = metrics(size.width, size.height, state.level);
    ctx.clearRect(0, 0, size.width, size.height);
    drawBackdrop(size.width, size.height);
    drawPlatformBase(layout);

    var cells = [];
    for (var y = 0; y < state.level.height; y += 1) {
      for (var x = 0; x < state.level.width; x += 1) {
        cells.push({ x: x, y: y, depth: x + y });
      }
    }
    cells.sort(function (a, b) {
      return a.depth - b.depth || a.x - b.x;
    });
    cells.forEach(function (cell) {
      var terrain = core.terrainAt(state.level, cell.x, cell.y);
      if (terrain !== "wall") {
        drawTile(cell.x, cell.y, terrain, layout);
      }
    });

    if (state.animating && state.animation) {
      drawExecutionPath(layout);
    } else if (state.preview && state.commands.length > 0) {
      drawPreview(layout);
    }

    var actors = [];
    cells.forEach(function (cell) {
      if (core.terrainAt(state.level, cell.x, cell.y) === "wall") {
        actors.push({
          depth: cell.x + cell.y + 0.55,
          draw: function () {
            drawWall(cell.x, cell.y, layout);
          }
        });
      }
    });
    state.level.goals.forEach(function (goal, index) {
      actors.push({
        depth: goal.x + goal.y + 0.7,
        draw: function () {
          drawGoal(goal, index, layout);
        }
      });
    });
    actors.push({
      depth: state.displayPose.x + state.displayPose.y + 0.78,
      draw: function () {
        drawRobot(state.displayPose, layout);
      }
    });
    actors.sort(function (a, b) {
      return a.depth - b.depth;
    });
    actors.forEach(function (actor) {
      actor.draw();
    });
    if (state.batterySecondsRemaining !== null) {
      state.level.goals.forEach(function (goal, index) {
        drawBeaconCountdown(
          cellCenter(goal.x, goal.y, layout),
          (state.robot.collected & goalMask(index)) !== 0,
          layout
        );
      });
    }

    drawCanvasFinish(size.width, size.height);
  }

  function drawBackdrop(width, height) {
    var gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#deeff6");
    gradient.addColorStop(0.52, "#e8f5ef");
    gradient.addColorStop(1, "#f4e5ee");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = "rgba(65, 113, 126, 0.075)";
    ctx.lineWidth = 1;
    for (var i = -height; i < width + height; i += 72) {
      ctx.beginPath();
      ctx.moveTo(i, height);
      ctx.lineTo(i + height * 0.55, height * 0.45);
      ctx.stroke();
    }
    for (var row = 0; row < 6; row += 1) {
      var lineY = height - 28 - row * 52;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(77, 132, 142, 0.14)";
    for (var bolt = 0; bolt < 8; bolt += 1) {
      var boltX = 24 + bolt * Math.max(58, (width - 48) / 7);
      ctx.beginPath();
      ctx.arc(boltX, height - 22, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPlatformBase(layout) {
    var level = state.level;
    var back = project({ x: 0, y: 0 }, layout);
    var right = project({ x: level.width, y: 0 }, layout);
    var front = project({ x: level.width, y: level.height }, layout);
    var left = project({ x: 0, y: level.height }, layout);
    var depth = Math.max(10, layout.tileW * 0.18);

    ctx.save();
    ctx.shadowColor = "rgba(67, 106, 116, 0.24)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 14;
    drawPolygon(
      [
        { x: back.x, y: back.y + 8 },
        { x: right.x + 8, y: right.y + 12 },
        { x: front.x, y: front.y + depth + 14 },
        { x: left.x - 8, y: left.y + 12 }
      ],
      "rgba(72, 119, 128, 0.16)"
    );
    ctx.restore();

    var rightGradient = ctx.createLinearGradient(right.x, right.y, front.x, front.y + depth);
    rightGradient.addColorStop(0, "#9cbec1");
    rightGradient.addColorStop(0.16, "#769da3");
    rightGradient.addColorStop(0.82, "#688e95");
    rightGradient.addColorStop(1, "#a7c9c8");
    drawPolygon(
      [
        right,
        front,
        { x: front.x, y: front.y + depth },
        { x: right.x, y: right.y + depth }
      ],
      rightGradient,
      "#56777e",
      1.2
    );
    var leftGradient = ctx.createLinearGradient(left.x, left.y, front.x, front.y + depth);
    leftGradient.addColorStop(0, "#bdd6cf");
    leftGradient.addColorStop(0.2, "#8fb5ae");
    leftGradient.addColorStop(0.86, "#7ba29e");
    leftGradient.addColorStop(1, "#c6ded6");
    drawPolygon(
      [
        front,
        left,
        { x: left.x, y: left.y + depth },
        { x: front.x, y: front.y + depth }
      ],
      leftGradient,
      "#668984",
      1.2
    );
    var topGradient = ctx.createLinearGradient(back.x, back.y, front.x, front.y);
    topGradient.addColorStop(0, "#eef7f1");
    topGradient.addColorStop(0.15, "#c9ded5");
    topGradient.addColorStop(0.58, "#a9c7bf");
    topGradient.addColorStop(0.88, "#91b4ae");
    topGradient.addColorStop(1, "#d9e9e2");
    drawPolygon([back, right, front, left], topGradient, "#769b96", 1.4);

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y + 1);
    ctx.lineTo(front.x, front.y + 1);
    ctx.lineTo(right.x, right.y + 1);
    ctx.stroke();
    ctx.restore();
  }

  function tilePath(x, y, layout, lift) {
    var z = lift || 0;
    var top = project({ x: x, y: y }, layout);
    var right = project({ x: x + 1, y: y }, layout);
    var bottom = project({ x: x + 1, y: y + 1 }, layout);
    var left = project({ x: x, y: y + 1 }, layout);
    return [
      { x: top.x, y: top.y - z },
      { x: right.x, y: right.y - z },
      { x: bottom.x, y: bottom.y - z },
      { x: left.x, y: left.y - z }
    ];
  }

  function drawDiamond(points, fill, stroke) {
    drawPolygon(points, fill, stroke, 1);
  }

  function drawPolygon(points, fill, stroke, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth || 1;
      ctx.stroke();
    }
  }

  function insetPoints(points, amount) {
    var center = points.reduce(
      function (sum, point) {
        sum.x += point.x;
        sum.y += point.y;
        return sum;
      },
      { x: 0, y: 0 }
    );
    center.x /= points.length;
    center.y /= points.length;
    return points.map(function (point) {
      return {
        x: lerp(point.x, center.x, amount),
        y: lerp(point.y, center.y, amount)
      };
    });
  }

  function surfaceGradient(points, colors) {
    var gradient = ctx.createLinearGradient(
      points[0].x,
      points[0].y,
      points[2].x,
      points[2].y
    );
    gradient.addColorStop(0, colors.detail);
    gradient.addColorStop(0.08, colors.top);
    gradient.addColorStop(0.42, colors.top);
    gradient.addColorStop(0.55, colors.detail);
    gradient.addColorStop(0.61, colors.top);
    gradient.addColorStop(1, colors.low);
    return gradient;
  }

  function sideGradient(points, bright, dark) {
    var gradient = ctx.createLinearGradient(
      points[0].x,
      points[0].y,
      points[2].x,
      points[2].y
    );
    gradient.addColorStop(0, bright);
    gradient.addColorStop(0.18, bright);
    gradient.addColorStop(0.22, dark);
    gradient.addColorStop(0.82, dark);
    gradient.addColorStop(1, bright);
    return gradient;
  }

  function seededNoise(x, y, salt) {
    var value = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + salt * 37.719);
    return value - Math.floor(value);
  }

  function drawTile(x, y, terrain, layout) {
    var isInterest =
      terrain === "charger" ||
      state.level.goals.some(function (goal) {
        return goal.x === x && goal.y === y;
      });
    var colors = isInterest
      ? interestPalette
      : terrain === "floor"
        ? floorPalettes[(x + y * 2) % floorPalettes.length]
        : terrainColors[terrain];
    var points = tilePath(x, y, layout, 0);
    drawDiamond(points, colors.edge, "rgba(57, 78, 84, 0.42)");
    var face = insetPoints(points, 0.055);
    drawDiamond(face, surfaceGradient(face, colors), "rgba(255, 255, 255, 0.48)");
    var innerFace = insetPoints(face, 0.075);
    drawDiamond(innerFace, "rgba(255, 255, 255, 0.025)", "rgba(66, 91, 98, 0.13)");

    var center = cellCenter(x, y, layout);
    if (terrain === "floor") {
      drawFloorDetails(x, y, center, layout);
    }
    if (terrain === "sand") {
      drawSandDetails(x, y, center, layout);
    }
    if (terrain === "ice") {
      drawIceDetails(x, y, center, face, layout);
    }
    if (terrain === "charger") {
      drawChargerDetails(center, layout);
    }
  }

  function drawFloorDetails(x, y, center, layout) {
    ctx.save();
    ctx.strokeStyle = "rgba(61, 91, 99, 0.13)";
    ctx.lineWidth = Math.max(0.7, layout.tileW * 0.007);
    if ((x + y) % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(center.x - layout.tileW * 0.13, center.y + layout.tileH * 0.02);
      ctx.lineTo(center.x, center.y + layout.tileH * 0.14);
      ctx.lineTo(center.x + layout.tileW * 0.13, center.y + layout.tileH * 0.02);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.moveTo(center.x - layout.tileW * 0.3, center.y - layout.tileH * 0.08);
    ctx.lineTo(center.x + layout.tileW * 0.18, center.y - layout.tileH * 0.32);
    ctx.stroke();
    ctx.fillStyle = "rgba(65, 91, 98, 0.18)";
    [-1, 1].forEach(function (side) {
      ctx.beginPath();
      ctx.arc(
        center.x + side * layout.tileW * 0.25,
        center.y,
        Math.max(0.8, layout.tileW * 0.014),
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
    ctx.restore();
  }

  function drawSandDetails(x, y, center, layout) {
    ctx.save();
    ctx.strokeStyle = "rgba(103, 76, 33, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center.x - layout.tileW * 0.24, center.y - layout.tileH * 0.06);
    ctx.quadraticCurveTo(
      center.x - layout.tileW * 0.04,
      center.y - layout.tileH * 0.2,
      center.x + layout.tileW * 0.21,
      center.y - layout.tileH * 0.02
    );
    ctx.moveTo(center.x - layout.tileW * 0.12, center.y + layout.tileH * 0.14);
    ctx.quadraticCurveTo(
      center.x + layout.tileW * 0.04,
      center.y + layout.tileH * 0.02,
      center.x + layout.tileW * 0.22,
      center.y + layout.tileH * 0.12
    );
    ctx.stroke();
    ctx.fillStyle = "rgba(92, 66, 27, 0.34)";
    for (var i = 0; i < 7; i += 1) {
      var px = (seededNoise(x, y, i) - 0.5) * layout.tileW * 0.46;
      var py = (seededNoise(x, y, i + 9) - 0.5) * layout.tileH * 0.48;
      ctx.beginPath();
      ctx.arc(center.x + px, center.y + py, 0.75 + (i % 2) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawIceDetails(x, y, center, face, layout) {
    ctx.save();
    drawPolygon(
      insetPoints(face, 0.18),
      "rgba(216, 246, 247, 0.12)",
      "rgba(230, 255, 255, 0.35)"
    );
    ctx.strokeStyle = "rgba(239, 255, 255, 0.7)";
    ctx.lineWidth = Math.max(1.2, layout.tileW * 0.025);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(center.x - layout.tileW * 0.28, center.y + layout.tileH * 0.03);
    ctx.lineTo(center.x - layout.tileW * 0.04, center.y - layout.tileH * 0.18);
    ctx.lineTo(center.x + layout.tileW * 0.18, center.y - layout.tileH * 0.08);
    ctx.moveTo(center.x - layout.tileW * 0.02, center.y + layout.tileH * 0.18);
    ctx.lineTo(center.x + layout.tileW * 0.25, center.y - layout.tileH * 0.02);
    if ((x + y) % 2 === 0) {
      ctx.moveTo(center.x - layout.tileW * 0.09, center.y - layout.tileH * 0.08);
      ctx.lineTo(center.x + layout.tileW * 0.08, center.y + layout.tileH * 0.1);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawChargerDetails(center, layout) {
    var radiusX = layout.tileW * 0.25;
    var radiusY = layout.tileH * 0.28;
    ctx.save();
    ctx.shadowColor = "rgba(64, 184, 166, 0.55)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "rgba(23, 76, 67, 0.34)";
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#d8ffe8";
    ctx.lineWidth = Math.max(1.5, layout.tileW * 0.035);
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radiusX * 0.75, radiusY * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#effff4";
    ctx.beginPath();
    ctx.moveTo(center.x + 1, center.y - radiusY * 0.72);
    ctx.lineTo(center.x - radiusX * 0.22, center.y + 1);
    ctx.lineTo(center.x + radiusX * 0.02, center.y + 1);
    ctx.lineTo(center.x - 1, center.y + radiusY * 0.72);
    ctx.lineTo(center.x + radiusX * 0.25, center.y - 1);
    ctx.lineTo(center.x, center.y - 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawWall(x, y, layout) {
    var colors = wallPalettes[(x * 2 + y) % wallPalettes.length];
    var lift = Math.max(4, Math.min(26, layout.tileW * 0.19));
    var top = tilePath(x, y, layout, lift);
    var base = tilePath(x, y, layout, 0);
    var rightFace = [base[1], base[2], top[2], top[1]];
    var leftFace = [base[2], base[3], top[3], top[2]];
    var outlineColor = "rgba(34, 43, 42, 0.48)";
    var outlineWidth = Math.max(1, layout.tileW * 0.014);
    drawPolygon(
      rightFace,
      sideGradient(rightFace, colors.right, colors.edge),
      outlineColor,
      outlineWidth
    );
    drawPolygon(
      leftFace,
      sideGradient(leftFace, colors.left, colors.low),
      outlineColor,
      outlineWidth
    );
    drawPolygon(top, surfaceGradient(top, colors), outlineColor, outlineWidth);
    drawPolygon(
      insetPoints(top, 0.13),
      "rgba(255, 255, 255, 0.08)",
      "rgba(49, 62, 59, 0.22)",
      Math.max(0.8, layout.tileW * 0.01)
    );

    ctx.save();
    ctx.strokeStyle = "rgba(36, 47, 45, 0.3)";
    ctx.lineWidth = Math.max(0.8, layout.tileW * 0.009);
    ctx.beginPath();
    ctx.moveTo(lerp(base[1].x, base[2].x, 0.16), lerp(base[1].y, base[2].y, 0.16));
    ctx.lineTo(lerp(top[1].x, top[2].x, 0.16), lerp(top[1].y, top[2].y, 0.16));
    ctx.moveTo(lerp(base[3].x, base[2].x, 0.16), lerp(base[3].y, base[2].y, 0.16));
    ctx.lineTo(lerp(top[3].x, top[2].x, 0.16), lerp(top[3].y, top[2].y, 0.16));
    ctx.stroke();

    ctx.fillStyle = "rgba(244, 250, 244, 0.78)";
    ctx.strokeStyle = "rgba(48, 65, 60, 0.32)";
    ctx.lineWidth = 0.7;
    [0.18, 0.82].forEach(function (amount) {
      var boltRight = {
        x: lerp(top[1].x, top[2].x, amount),
        y: lerp(top[1].y, top[2].y, amount) + lift * 0.45
      };
      var boltLeft = {
        x: lerp(top[3].x, top[2].x, amount),
        y: lerp(top[3].y, top[2].y, amount) + lift * 0.45
      };
      ctx.beginPath();
      ctx.arc(boltRight.x, boltRight.y, 1.2, 0, Math.PI * 2);
      ctx.arc(boltLeft.x, boltLeft.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    if ((x + y) % 3 === 0) {
      ctx.strokeStyle = "#ed86b3";
      ctx.lineWidth = Math.max(1.5, layout.tileW * 0.035);
      ctx.beginPath();
      ctx.moveTo(lerp(base[1].x, base[2].x, 0.42), lerp(base[1].y, base[2].y, 0.42));
      ctx.lineTo(
        lerp(top[1].x, top[2].x, 0.42),
        lerp(top[1].y, top[2].y, 0.42) + lift * 0.18
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPreview(layout) {
    var preview = core.simulate(state.level, state.commands, state.robot);
    drawPathOverlay(
      layout,
      preview.events,
      state.robot,
      "rgba(80, 183, 202, 0.8)",
      "rgba(80, 183, 202, 0.34)"
    );
  }

  function drawExecutionPath(layout) {
    var events = state.animation.result.events;
    var start = events.length > 0 ? events[0].from : state.robot;
    drawPathOverlay(
      layout,
      events,
      start,
      "rgba(88, 211, 169, 0.96)",
      "rgba(88, 211, 169, 0.58)"
    );
  }

  function drawPathOverlay(layout, events, start, strokeColor, glowColor) {
    var points = [cellCenter(start.x, start.y, layout)];
    var collisionPoint = null;
    events.forEach(function (event) {
      event.path.forEach(function (point) {
        points.push(cellCenter(point.x, point.y, layout));
      });
      if (event.blockedAt) {
        collisionPoint = cellCenter(event.blockedAt.x, event.blockedAt.y, layout);
      }
    });

    if (points.length > 1) {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 7;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y - 10);
      for (var i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].x, points[i].y - 10);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (collisionPoint) {
      ctx.save();
      ctx.strokeStyle = "rgba(232, 111, 161, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(collisionPoint.x - 10, collisionPoint.y - 16);
      ctx.lineTo(collisionPoint.x + 10, collisionPoint.y + 4);
      ctx.moveTo(collisionPoint.x + 10, collisionPoint.y - 16);
      ctx.lineTo(collisionPoint.x - 10, collisionPoint.y + 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  function goalMask(index) {
    return 1 << index;
  }

  function drawGoal(goal, index, layout) {
    var center = cellCenter(goal.x, goal.y, layout);
    var collected = (state.robot.collected & goalMask(index)) !== 0;
    var baseAccent = collected ? "#58c9a3" : "#5aaec4";
    var signal = "#f4b83f";
    var signalBright = "#fff7b2";
    var scale = Math.max(0.42, Math.min(2.05, layout.tileW / 60));

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(31, 37, 40, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 19, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    drawPolygon(
      [
        { x: 0, y: -4 },
        { x: 17, y: 3 },
        { x: 0, y: 11 },
        { x: -17, y: 3 }
      ],
      "#547b88",
      "#345b68",
      1.6
    );
    drawPolygon(
      [
        { x: 0, y: -7 },
        { x: 14, y: -1 },
        { x: 0, y: 6 },
        { x: -14, y: -1 }
      ],
      baseAccent,
      "#426f7b",
      1.4
    );

    ctx.fillStyle = "#7aaeb4";
    ctx.strokeStyle = "#3f6974";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-4.5, -27);
    ctx.lineTo(4.5, -27);
    ctx.lineTo(6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = baseAccent;
    ctx.fillRect(-5, -18, 10, 4);
    ctx.fillStyle = "#406a75";
    ctx.fillRect(-3.8, -11, 7.6, 2.5);

    ctx.fillStyle = "#486d78";
    ctx.strokeStyle = "#315560";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-9, -27);
    ctx.lineTo(-6, -36);
    ctx.lineTo(6, -36);
    ctx.lineTo(9, -27);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = signal;
    ctx.shadowBlur = 20;
    ctx.fillStyle = signal;
    ctx.beginPath();
    ctx.arc(0, -32, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = signalBright;
    ctx.beginPath();
    ctx.arc(-2, -34, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(244, 184, 63, 0.72)";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-15, -32);
    ctx.lineTo(-11, -32);
    ctx.moveTo(11, -32);
    ctx.lineTo(15, -32);
    ctx.moveTo(0, -47);
    ctx.lineTo(0, -43);
    ctx.arc(0, -32, 15, -Math.PI * 0.72, -Math.PI * 0.28);
    ctx.arc(0, -32, 20, -Math.PI * 0.67, -Math.PI * 0.33);
    ctx.stroke();
    ctx.restore();

  }

  function drawBeaconCountdown(center, collected, layout) {
    var seconds = state.batterySecondsRemaining;
    var urgent = seconds <= 10;
    var width = Math.max(36, Math.min(48, layout.tileW * 0.72));
    var height = Math.max(17, Math.min(22, layout.tileW * 0.32));
    var x = center.x - width / 2;
    var y = center.y - Math.max(42, layout.tileW * 0.84);

    ctx.save();
    ctx.shadowColor = urgent ? "rgba(239, 92, 92, 0.62)" : "rgba(88, 211, 169, 0.48)";
    ctx.shadowBlur = urgent ? 12 : 8;
    ctx.fillStyle = "rgba(27, 34, 30, 0.94)";
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = urgent ? "#ff6f61" : collected ? "#58d3a9" : "#ffd166";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = urgent ? "#ffb0a8" : "#e5f7c6";
    ctx.font =
      "800 " +
      Math.max(10, Math.min(13, layout.tileW * 0.2)) +
      "px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(seconds) + "S", center.x, y + height / 2 + 0.5);
    ctx.restore();
  }

  function robotBasis(pose, layout) {
    var center = cellCenter(pose.x, pose.y, layout);
    var angle = typeof pose.angle === "number" ? pose.angle : directionAngle(pose.direction);
    var delta = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
    var rightDelta = {
      x: Math.cos(angle + Math.PI / 2),
      y: Math.sin(angle + Math.PI / 2)
    };
    var nose = cellCenter(pose.x + delta.x * 0.42, pose.y + delta.y * 0.42, layout);
    var sidePoint = cellCenter(
      pose.x + rightDelta.x * 0.42,
      pose.y + rightDelta.y * 0.42,
      layout
    );
    var dx = nose.x - center.x;
    var dy = nose.y - center.y;
    var sideDx = sidePoint.x - center.x;
    var sideDy = sidePoint.y - center.y;
    var length = Math.max(1, Math.hypot(dx, dy));
    var sideLength = Math.max(1, Math.hypot(sideDx, sideDy));
    return {
      center: center,
      ux: dx / length,
      uy: dy / length,
      px: sideDx / sideLength,
      py: sideDy / sideLength
    };
  }

  function robotPoint(basis, forward, side, height) {
    return {
      x: basis.ux * forward + basis.px * side,
      y: basis.uy * forward + basis.py * side - height
    };
  }

  function drawRobotPrism(basis, spec, palette) {
    var frontSign = basis.uy >= 0 ? 1 : -1;
    var sideSign = basis.py >= 0 ? 1 : -1;
    var front = spec.forward + frontSign * spec.halfForward;
    var side = spec.side + sideSign * spec.halfSide;
    var oppositeSide = spec.side - sideSign * spec.halfSide;
    var oppositeFront = spec.forward - frontSign * spec.halfForward;

    var forwardFace = [
      robotPoint(basis, front, oppositeSide, spec.bottom),
      robotPoint(basis, front, side, spec.bottom),
      robotPoint(basis, front, side, spec.top),
      robotPoint(basis, front, oppositeSide, spec.top)
    ];
    var sideFace = [
      robotPoint(basis, oppositeFront, side, spec.bottom),
      robotPoint(basis, front, side, spec.bottom),
      robotPoint(basis, front, side, spec.top),
      robotPoint(basis, oppositeFront, side, spec.top)
    ];
    drawPolygon(
      forwardFace,
      frontSign > 0 ? palette.front : palette.back,
      palette.stroke,
      1.2
    );
    drawPolygon(sideFace, palette.side, palette.stroke, 1.2);
    drawPolygon(
      [
        robotPoint(
          basis,
          spec.forward - spec.halfForward,
          spec.side - spec.halfSide,
          spec.top
        ),
        robotPoint(
          basis,
          spec.forward + spec.halfForward,
          spec.side - spec.halfSide,
          spec.top
        ),
        robotPoint(
          basis,
          spec.forward + spec.halfForward,
          spec.side + spec.halfSide,
          spec.top
        ),
        robotPoint(
          basis,
          spec.forward - spec.halfForward,
          spec.side + spec.halfSide,
          spec.top
        )
      ],
      palette.top,
      palette.stroke,
      1.2
    );
  }

  function drawRobotEllipse(
    basis,
    forward,
    side,
    height,
    radiusX,
    radiusY,
    topColor,
    bottomColor,
    strokeColor
  ) {
    var center = robotPoint(basis, forward, side, height);
    var gradient = ctx.createLinearGradient(
      center.x,
      center.y - radiusY,
      center.x,
      center.y + radiusY
    );
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return center;
  }

  function drawRobotTrack(basis, side) {
    drawRobotPrism(
      basis,
      {
        forward: -1,
        side: side,
        halfForward: 11.5,
        halfSide: 5,
        bottom: 2,
        top: 13
      },
      {
        top: "#4b4d4e",
        front: "#353738",
        back: "#3e4041",
        side: "#242728",
        stroke: "#17191a"
      }
    );

    var outsideSign = side > 0 ? 1 : -1;
    if (Math.sign(basis.py) === outsideSign) {
      [-6, 1, 7].forEach(function (forward, index) {
        var wheel = robotPoint(basis, forward, side + outsideSign * 5.1, 7);
        ctx.fillStyle = index === 1 ? "#818789" : "#aeb4b5";
        ctx.strokeStyle = "#25292a";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(wheel.x, wheel.y, index === 1 ? 3 : 3.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#464b4d";
        ctx.beginPath();
        ctx.arc(wheel.x, wheel.y, index === 1 ? 1.25 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = "rgba(216, 221, 218, 0.34)";
      ctx.lineWidth = 0.8;
      for (var tread = -9; tread <= 9; tread += 3) {
        var treadTop = robotPoint(
          basis,
          tread,
          side + outsideSign * 5.15,
          11.5
        );
        var treadBottom = robotPoint(
          basis,
          tread,
          side + outsideSign * 5.15,
          2.8
        );
        ctx.beginPath();
        ctx.moveTo(treadTop.x, treadTop.y);
        ctx.lineTo(treadBottom.x, treadBottom.y);
        ctx.stroke();
      }
    }
  }

  function drawRobotArm(basis, side) {
    var shoulder = robotPoint(basis, 0, side * 12, 29);
    var elbow = robotPoint(basis, 1, side * 17, 23);
    var hand = robotPoint(basis, 7, side * 18, 18);
    ctx.strokeStyle = "#773718";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(elbow.x, elbow.y);
    ctx.lineTo(hand.x, hand.y);
    ctx.stroke();
    ctx.strokeStyle = "#e27b32";
    ctx.lineWidth = 4.3;
    ctx.stroke();

    [shoulder, elbow].forEach(function (joint) {
      ctx.fillStyle = "#e7863e";
      ctx.strokeStyle = "#743717";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, 3.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.fillStyle = "#a8adae";
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#713718";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(hand.x, hand.y);
    ctx.lineTo(hand.x + basis.ux * 4 + basis.px * side * 2.5, hand.y + basis.uy * 4 + basis.py * side * 2.5);
    ctx.moveTo(hand.x, hand.y);
    ctx.lineTo(hand.x + basis.ux * 4 - basis.px * side * 2.5, hand.y + basis.uy * 4 - basis.py * side * 2.5);
    ctx.stroke();
  }

  function drawRobotFace(basis) {
    var actualFrontVisible = basis.uy > 0;
    var faceForward = actualFrontVisible ? 10.5 : -10.5;
    var face = [
      robotPoint(basis, faceForward, -8.5, 41),
      robotPoint(basis, faceForward, 8.5, 41),
      robotPoint(basis, faceForward, 8.5, 51),
      robotPoint(basis, faceForward, -8.5, 51)
    ];

    if (actualFrontVisible) {
      drawPolygon(face, "#17272c", "#0d171a", 1.35);
      [-4.1, 4.1].forEach(function (side) {
        var eye = robotPoint(basis, 10.85, side, 47);
        ctx.save();
        ctx.shadowColor = "#70f5f2";
        ctx.shadowBlur = 7;
        ctx.fillStyle = "#9dffff";
        ctx.beginPath();
        ctx.ellipse(eye.x, eye.y, 2, 2.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      var mouth = robotPoint(basis, 10.9, 0, 43.7);
      ctx.save();
      ctx.strokeStyle = "#8ffcf2";
      ctx.shadowColor = "#70f5f2";
      ctx.shadowBlur = 5;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(mouth.x, mouth.y - 1, 2.2, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.restore();
    } else {
      var rearPort = robotPoint(basis, -10.8, 0, 46.5);
      ctx.fillStyle = "#bd652b";
      ctx.strokeStyle = "#763718";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(rearPort.x, rearPort.y, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e9a15f";
      ctx.beginPath();
      ctx.arc(rearPort.x, rearPort.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRobot(pose, layout) {
    var basis = robotBasis(pose, layout);
    var scale = Math.max(0.45, Math.min(1.9, layout.tileW / 64));

    ctx.save();
    ctx.translate(basis.center.x, basis.center.y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(43, 54, 56, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    [-16, 16]
      .sort(function (a, b) {
        return robotPoint(basis, 0, a, 0).y - robotPoint(basis, 0, b, 0).y;
      })
      .forEach(function (side) {
        drawRobotTrack(basis, side);
      });

    drawRobotPrism(
      basis,
      { forward: 0, side: 0, halfForward: 13, halfSide: 15, bottom: 10, top: 18 },
      {
        top: "#f4a356",
        front: "#df7730",
        back: "#cb6325",
        side: "#ba5121",
        stroke: "#713516"
      }
    );

    [-1, 1]
      .sort(function (a, b) {
        return robotPoint(basis, 0, a * 17, 0).y - robotPoint(basis, 0, b * 17, 0).y;
      })
      .forEach(function (side) {
        drawRobotArm(basis, side);
      });

    drawRobotEllipse(
      basis,
      -1,
      0,
      28,
      14.5,
      15.5,
      "#ffad62",
      "#c95e24",
      "#743619"
    );

    var chestLight = robotPoint(basis, 10.5, 0, 28);
    if (basis.uy > 0) {
      ctx.fillStyle = "#b9bdbd";
      ctx.strokeStyle = "#6f7272";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(chestLight.x, chestLight.y, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    drawRobotEllipse(
      basis,
      0,
      0,
      37,
      6,
      3.2,
      "#d5d8d7",
      "#777d7e",
      "#4c5152"
    );
    drawRobotEllipse(
      basis,
      0,
      0,
      47,
      17,
      17.5,
      "#ffb567",
      "#ca5c23",
      "#743518"
    );

    var visibleSide = basis.py >= 0 ? 1 : -1;
    var sidePort = robotPoint(basis, 0, visibleSide * 15, 47);
    ctx.fillStyle = "#d76e2c";
    ctx.strokeStyle = "#743518";
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.arc(sidePort.x, sidePort.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawRobotFace(basis);
    ctx.restore();
  }

  function drawCanvasFinish(width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, 28);
    ctx.lineTo(16, 16);
    ctx.lineTo(28, 16);
    ctx.moveTo(width - 28, 16);
    ctx.lineTo(width - 16, 16);
    ctx.lineTo(width - 16, 28);
    ctx.moveTo(16, height - 28);
    ctx.lineTo(16, height - 16);
    ctx.lineTo(28, height - 16);
    ctx.moveTo(width - 28, height - 16);
    ctx.lineTo(width - 16, height - 16);
    ctx.lineTo(width - 16, height - 28);
    ctx.stroke();

    ctx.fillStyle = "rgba(35, 41, 45, 0.025)";
    for (var y = 1; y < height; y += 5) {
      ctx.fillRect(0, y, width, 1);
    }
    ctx.restore();
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
        mapCtx.fillStyle = terrainColors[terrain].top;
        mapCtx.fillRect(offsetX + x * cell, offsetY + y * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }

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
    els.energyValue.textContent =
      formatEnergy(state.robot.energyRemaining) + " / " + formatEnergy(level.energyMax);
    els.runCount.textContent = String(state.runCount);
    els.bestStars.textContent = starText(bestStarsFor(level));
    renderRunMessage();
    els.runMessage.parentElement.classList.toggle("is-game-over", state.gameOver);
    els.objectiveStatus.textContent =
      collectedCount(level, state.robot) + " / " + level.goals.length + " " + text("beacons");
    els.energyTarget.textContent = formatEnergy(level.parEnergy);
    els.runTarget.textContent = String(level.parRuns);
    els.facingValue.textContent =
      uppercase(copy().directions[state.robot.direction] || core.DIR_LABEL[state.robot.direction]);
    els.previewToggle.checked = state.preview;
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
    els.levelList.innerHTML = "";
    core.LEVELS.forEach(function (level, index) {
      var levelCopy = localizedLevel(level);
      var button = document.createElement("button");
      button.className = "level-button";
      if (index === state.levelIndex) {
        button.classList.add("is-active");
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
      chip.textContent = core.commandToken(command);
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
    els.canvas.setAttribute("aria-label", text("canvasLabel"));
    els.miniMap.setAttribute("aria-label", text("mapLabel"));
    els.controlPanel.setAttribute("aria-label", text("controlsLabel"));
    els.celebrationMessage.textContent = text("congratulations");
    els.inductLevels.setAttribute("aria-label", text("inductPower"));

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
    drawAll();
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
  function scheduleCanvasRedraw() {
    if (!state.robot || resizeFrame !== null) return;
    resizeFrame = window.requestAnimationFrame(function () {
      resizeFrame = null;
      drawAll();
    });
  }

  window.addEventListener("resize", scheduleCanvasRedraw);
  window.addEventListener("load", scheduleCanvasRedraw);
  if (typeof window.ResizeObserver === "function") {
    var canvasResizeObserver = new window.ResizeObserver(scheduleCanvasRedraw);
    canvasResizeObserver.observe(els.canvas);
    canvasResizeObserver.observe(els.miniMap);
  }

  window.RoboNaviRenderBridge = {
    attach: function (renderer) {
      if (!renderer || typeof renderer.update !== "function") return;
      threeRenderer = renderer;
      els.canvas.parentElement.classList.add("three-ready");
      renderer.update(createThreeRenderSnapshot());
    },
    detach: function (renderer) {
      if (renderer && threeRenderer !== renderer) return;
      threeRenderer = null;
      els.canvas.parentElement.classList.remove("three-ready");
      drawBoard();
    },
    snapshot: createThreeRenderSnapshot
  };

  applyLanguage(state.language, false);
  loadLevel(0);
})();
