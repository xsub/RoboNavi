(function () {
  "use strict";

  var core = window.RoboNaviCore;
  var storageKey = "robonavi-progress-v1";
  var terrainColors = {
    floor: { top: "#bfe3de", edge: "#8bbeb8", detail: "#effcf8", low: "#a8d3cd" },
    sand: { top: "#f1d78f", edge: "#d1ae62", detail: "#fff3c5", low: "#dfc276" },
    ice: { top: "#a7dded", edge: "#72b8ce", detail: "#effcff", low: "#8bcedf" },
    charger: { top: "#9fe0bf", edge: "#65b28c", detail: "#edfff4", low: "#82cda6" },
    wall: { top: "#b8d8ee", edge: "#7ea6c4", detail: "#eef8ff", low: "#99bdd7" }
  };
  var floorPalettes = [
    { top: "#b9dfe9", edge: "#86b8c5", detail: "#eefbff", low: "#a2cfd9" },
    { top: "#bce5d1", edge: "#89bfa3", detail: "#f1fff7", low: "#a6d4bb" },
    { top: "#ecc9dc", edge: "#c394ad", detail: "#fff1f8", low: "#d9b2c8" }
  ];
  var wallPalettes = [
    {
      top: "#b8d8ee",
      detail: "#eff8ff",
      low: "#9ebfd8",
      edge: "#799dbc",
      right: "#7fa6c5",
      left: "#98bad2"
    },
    {
      top: "#edc5d9",
      detail: "#fff2f8",
      low: "#d8abc3",
      edge: "#b67f9f",
      right: "#b7809f",
      left: "#cf9fba"
    },
    {
      top: "#bde5d0",
      detail: "#f0fff7",
      low: "#9fcdb4",
      edge: "#78aa8e",
      right: "#78aa8f",
      left: "#91bca4"
    }
  ];
  var commandNames = {
    forward: "Forward",
    "turn-left": "Left",
    "turn-right": "Right"
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
    resetLevel: document.getElementById("reset-level"),
    previewToggle: document.getElementById("preview-toggle"),
    commandQueue: document.getElementById("command-queue"),
    undoCommand: document.getElementById("undo-command"),
    clearProgram: document.getElementById("clear-program"),
    executeProgram: document.getElementById("execute-program"),
    energyTarget: document.getElementById("energy-target"),
    runTarget: document.getElementById("run-target"),
    facingValue: document.getElementById("facing-value")
  };

  var ctx = els.canvas.getContext("2d");
  var mapCtx = els.miniMap.getContext("2d");
  var state = {
    levelIndex: 0,
    level: core.LEVELS[0],
    robot: null,
    displayPose: null,
    commands: [],
    preview: true,
    runCount: 0,
    highlightIndex: null,
    animating: false,
    animation: null,
    message: "Ready",
    progress: loadProgress()
  };

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

  function bestStarsFor(level) {
    return state.progress[level.id] || 0;
  }

  function starText(stars) {
    return "*".repeat(stars) + "-".repeat(3 - stars);
  }

  function syncDisplayPose() {
    state.displayPose = {
      x: state.robot.x,
      y: state.robot.y,
      direction: state.robot.direction
    };
  }

  function loadLevel(index) {
    state.levelIndex = index;
    state.level = core.LEVELS[index];
    state.robot = core.createInitialState(state.level);
    state.commands = [];
    state.runCount = 0;
    state.highlightIndex = null;
    state.animating = false;
    state.animation = null;
    state.message = "Ready";
    syncDisplayPose();
    renderAll();
  }

  function resetLevel(keepProgram) {
    state.robot = core.createInitialState(state.level);
    state.runCount = 0;
    state.highlightIndex = null;
    state.animating = false;
    state.animation = null;
    state.message = "Ready";
    if (!keepProgram) {
      state.commands = [];
    }
    syncDisplayPose();
    renderAll();
  }

  function addCommand(command) {
    if (state.animating) return;
    state.commands.push(command);
    state.highlightIndex = null;
    state.message = "Ready";
    renderAll();
  }

  function removeCommand(index) {
    if (state.animating) return;
    state.commands.splice(index, 1);
    state.highlightIndex = null;
    renderAll();
  }

  function executeProgram() {
    if (state.animating || state.commands.length === 0 || core.isComplete(state.level, state.robot)) {
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
    state.message = "Executing";
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
      } else {
        steps.push({
          type: "turn",
          commandIndex: event.commandIndex,
          event: event,
          from: { direction: event.from.direction },
          to: { direction: event.after.direction },
          duration: 220,
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
    state.highlightIndex = step.commandIndex;

    if (step.type === "move") {
      state.displayPose.x = lerp(step.from.x, step.to.x, eased);
      state.displayPose.y = lerp(step.from.y, step.to.y, eased);
      state.displayPose.direction = step.event.from.direction;
    } else if (step.type === "bump") {
      var bump = Math.sin(progress * Math.PI) * 0.18;
      state.displayPose.x = lerp(step.from.x, step.to.x, bump);
      state.displayPose.y = lerp(step.from.y, step.to.y, bump);
      state.displayPose.direction = step.event.from.direction;
    } else if (step.type === "turn") {
      state.displayPose.x = step.event.from.x;
      state.displayPose.y = step.event.from.y;
      state.displayPose.direction = progress < 0.5 ? step.from.direction : step.to.direction;
    }

    drawAll();

    if (progress >= 1) {
      if (step.endsCommand) {
        state.robot = core.cloneState(step.event.after);
        syncDisplayPose();
        renderUi();
      }
      animation.index += 1;
      animation.step = null;
    }

    window.requestAnimationFrame(tickAnimation);
  }

  function finishAnimation(result) {
    state.robot = core.cloneState(result.finalState);
    syncDisplayPose();
    state.animating = false;
    state.animation = null;
    state.highlightIndex =
      result.events.length > 0 ? result.events[result.events.length - 1].commandIndex : null;

    if (result.completed) {
      var stars = core.scoreCompletion(state.level, state.robot, state.runCount);
      state.progress[state.level.id] = Math.max(bestStarsFor(state.level), stars);
      saveProgress();
      state.message = "Beacon network restored: " + starText(stars);
    } else if (result.stoppedReason === "collision") {
      state.message = "Blocked at command " + (state.highlightIndex + 1);
    } else if (result.stoppedReason === "out-of-energy") {
      state.message = "Energy depleted";
    } else {
      state.message = "Program ended";
    }
    renderAll();
  }

  function easeInOut(value) {
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
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
    var tileW = Math.min(
      (width - 72) * 2 / (level.width + level.height),
      (height - 108) * 2 / (level.width + level.height)
    );
    tileW = Math.max(28, Math.min(72, tileW));
    var tileH = tileW * 0.54;
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
    drawBoard();
    drawMiniMap();
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

    if (state.preview && !state.animating && state.commands.length > 0) {
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

    drawPolygon(
      [
        right,
        front,
        { x: front.x, y: front.y + depth },
        { x: right.x, y: right.y + depth }
      ],
      "#7daeb6",
      "#5c8c96",
      1.2
    );
    drawPolygon(
      [
        front,
        left,
        { x: left.x, y: left.y + depth },
        { x: front.x, y: front.y + depth }
      ],
      "#94c5bd",
      "#6c9e98",
      1.2
    );
    drawPolygon([back, right, front, left], "#cae9df", "#83b8b2", 1.4);

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
    var top = project({ x: x + 0.5, y: y }, layout);
    var right = project({ x: x + 1, y: y + 0.5 }, layout);
    var bottom = project({ x: x + 0.5, y: y + 1 }, layout);
    var left = project({ x: x, y: y + 0.5 }, layout);
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
    gradient.addColorStop(0.2, colors.top);
    gradient.addColorStop(1, colors.low);
    return gradient;
  }

  function seededNoise(x, y, salt) {
    var value = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + salt * 37.719);
    return value - Math.floor(value);
  }

  function drawTile(x, y, terrain, layout) {
    var colors =
      terrain === "floor" ? floorPalettes[(x + y * 2) % floorPalettes.length] : terrainColors[terrain];
    var points = tilePath(x, y, layout, 0);
    drawDiamond(points, colors.edge, "rgba(77, 119, 126, 0.46)");
    var face = insetPoints(points, 0.055);
    drawDiamond(face, surfaceGradient(face, colors), "rgba(255, 255, 255, 0.2)");

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
    ctx.strokeStyle = "rgba(73, 115, 124, 0.17)";
    ctx.lineWidth = 1;
    if ((x + y) % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(center.x - layout.tileW * 0.18, center.y);
      ctx.lineTo(center.x, center.y + layout.tileH * 0.18);
      ctx.lineTo(center.x + layout.tileW * 0.18, center.y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(72, 114, 122, 0.2)";
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
    var lift = Math.max(8, Math.min(14, layout.tileW * 0.19));
    var top = tilePath(x, y, layout, lift);
    var base = tilePath(x, y, layout, 0);
    var rightFace = [base[1], base[2], top[2], top[1]];
    var leftFace = [base[2], base[3], top[3], top[2]];
    drawPolygon(rightFace, colors.right, colors.edge, 1);
    drawPolygon(leftFace, colors.left, colors.edge, 1);
    drawDiamond(top, surfaceGradient(top, colors), colors.edge);
    drawDiamond(
      insetPoints(top, 0.13),
      "rgba(255, 255, 255, 0.15)",
      "rgba(255, 255, 255, 0.38)"
    );

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lerp(base[1].x, base[2].x, 0.16), lerp(base[1].y, base[2].y, 0.16));
    ctx.lineTo(lerp(top[1].x, top[2].x, 0.16), lerp(top[1].y, top[2].y, 0.16));
    ctx.moveTo(lerp(base[3].x, base[2].x, 0.16), lerp(base[3].y, base[2].y, 0.16));
    ctx.lineTo(lerp(top[3].x, top[2].x, 0.16), lerp(top[3].y, top[2].y, 0.16));
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
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
    var points = [cellCenter(state.robot.x, state.robot.y, layout)];
    var collisionPoint = null;
    preview.events.forEach(function (event) {
      event.path.forEach(function (point) {
        points.push(cellCenter(point.x, point.y, layout));
      });
      if (event.blockedAt) {
        collisionPoint = cellCenter(event.blockedAt.x, event.blockedAt.y, layout);
      }
    });

    if (points.length > 1) {
      ctx.save();
      ctx.strokeStyle = "rgba(80, 183, 202, 0.8)";
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

    var ghost = preview.finalState;
    if (!core.isComplete(state.level, state.robot)) {
      drawGhostRobot({ x: ghost.x, y: ghost.y, direction: ghost.direction }, layout);
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
    var signal = collected ? "#58c9a3" : "#ea8bb6";
    var signalBright = collected ? "#e8fff4" : "#ffe8f3";
    var scale = Math.max(0.72, Math.min(1.05, layout.tileW / 66));

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(31, 37, 40, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 5, 17, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    drawPolygon(
      [
        { x: 0, y: -4 },
        { x: 15, y: 2 },
        { x: 0, y: 9 },
        { x: -15, y: 2 }
      ],
      "#729aaa",
      "#4f7887",
      1.4
    );
    drawPolygon(
      [
        { x: 0, y: -6 },
        { x: 12, y: -1 },
        { x: 0, y: 5 },
        { x: -12, y: -1 }
      ],
      "#b8dfea",
      "#6f9eac",
      1.2
    );

    ctx.fillStyle = "#79aaa9";
    ctx.strokeStyle = "#4f7f83";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-3.5, -26);
    ctx.lineTo(3.5, -26);
    ctx.lineTo(5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = signal;
    ctx.fillRect(-4.2, -17, 8.4, 3);
    ctx.fillStyle = "#527d84";
    ctx.fillRect(-3.1, -11, 6.2, 2);

    ctx.save();
    ctx.shadowColor = signal;
    ctx.shadowBlur = collected ? 16 : 12;
    ctx.fillStyle = signal;
    ctx.beginPath();
    ctx.arc(0, -29, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = signalBright;
    ctx.beginPath();
    ctx.arc(-1.5, -31, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = collected ? "rgba(88, 201, 163, 0.55)" : "rgba(234, 139, 182, 0.56)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -29, 13, -Math.PI * 0.72, -Math.PI * 0.28);
    ctx.arc(0, -29, 18, -Math.PI * 0.68, -Math.PI * 0.32);
    ctx.stroke();
    ctx.restore();
  }

  function robotBasis(pose, layout) {
    var center = cellCenter(pose.x, pose.y, layout);
    var delta = core.DIR_DELTA[pose.direction];
    var rightDirection = {
      north: "east",
      east: "south",
      south: "west",
      west: "north"
    }[pose.direction];
    var rightDelta = core.DIR_DELTA[rightDirection];
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

  function drawRobotTrack(basis, side) {
    drawRobotPrism(
      basis,
      {
        forward: -1,
        side: side,
        halfForward: 11,
        halfSide: 4,
        bottom: 2,
        top: 12
      },
      {
        top: "#6d9eaa",
        front: "#527f89",
        back: "#5c8993",
        side: "#426d77",
        stroke: "#315760"
      }
    );

    var outsideSign = side > 0 ? 1 : -1;
    if (Math.sign(basis.py) === outsideSign) {
      [-6, 1, 7].forEach(function (forward, index) {
        var wheel = robotPoint(basis, forward, side + outsideSign * 4.15, 6.7);
        ctx.fillStyle = index === 1 ? "#385f68" : "#456f78";
        ctx.strokeStyle = "#a9d3d8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wheel.x, wheel.y, index === 1 ? 3.2 : 2.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  }

  function drawRobotArm(basis, side) {
    var shoulder = robotPoint(basis, 0, side * 12, 29);
    var elbow = robotPoint(basis, 1, side * 17, 23);
    var hand = robotPoint(basis, 7, side * 18, 18);
    ctx.strokeStyle = "#4f7e87";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(shoulder.x, shoulder.y);
    ctx.lineTo(elbow.x, elbow.y);
    ctx.lineTo(hand.x, hand.y);
    ctx.stroke();
    ctx.strokeStyle = "#a9d9d1";
    ctx.lineWidth = 3;
    ctx.stroke();

    [shoulder, elbow].forEach(function (joint) {
      ctx.fillStyle = "#ed8db7";
      ctx.strokeStyle = "#5f8590";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.strokeStyle = "#547d87";
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
    var faceForward = actualFrontVisible ? 7.25 : -7.25;
    var face = [
      robotPoint(basis, faceForward, -6.5, 42),
      robotPoint(basis, faceForward, 6.5, 42),
      robotPoint(basis, faceForward, 6.5, 50),
      robotPoint(basis, faceForward, -6.5, 50)
    ];

    if (actualFrontVisible) {
      drawPolygon(face, "#315e69", "#244b55", 1.2);
      [-3.1, 3.1].forEach(function (side) {
        var eye = robotPoint(basis, 7.55, side, 46.4);
        ctx.save();
        ctx.shadowColor = "#a8ffe2";
        ctx.shadowBlur = 5;
        ctx.fillStyle = "#d9fff0";
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 1.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    } else {
      drawPolygon(face, "#86acb7", "#5f8791", 1.1);
      ctx.strokeStyle = "#d6f2f1";
      ctx.lineWidth = 1.2;
      [-2, 1.5].forEach(function (height) {
        var ventA = robotPoint(basis, -7.55, -4, 46 + height);
        var ventB = robotPoint(basis, -7.55, 4, 46 + height);
        ctx.beginPath();
        ctx.moveTo(ventA.x, ventA.y);
        ctx.lineTo(ventB.x, ventB.y);
        ctx.stroke();
      });
    }
  }

  function drawRobot(pose, layout) {
    var basis = robotBasis(pose, layout);
    var scale = Math.max(0.7, Math.min(1.06, layout.tileW / 64));

    ctx.save();
    ctx.translate(basis.center.x, basis.center.y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(66, 111, 121, 0.18)";
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
        top: "#dff5f7",
        front: "#a9ddd7",
        back: "#91cbc5",
        side: "#82bdb9",
        stroke: "#56858b"
      }
    );

    [-1, 1]
      .sort(function (a, b) {
        return robotPoint(basis, 0, a * 17, 0).y - robotPoint(basis, 0, b * 17, 0).y;
      })
      .forEach(function (side) {
        drawRobotArm(basis, side);
      });

    drawRobotPrism(
      basis,
      { forward: -1, side: 0, halfForward: 9, halfSide: 11, bottom: 18, top: 35 },
      {
        top: "#f7e4ee",
        front: "#e9b9d0",
        back: "#d7a8c0",
        side: "#c99ab4",
        stroke: "#9c718c"
      }
    );

    var chestLight = robotPoint(basis, 8.4, 0, 26);
    if (basis.uy > 0) {
      ctx.save();
      ctx.shadowColor = "#58c9a3";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#a8f0d2";
      ctx.beginPath();
      ctx.arc(chestLight.x, chestLight.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawRobotPrism(
      basis,
      { forward: 0, side: 0, halfForward: 3.5, halfSide: 4, bottom: 35, top: 40 },
      {
        top: "#84b9bd",
        front: "#5f9098",
        back: "#557f89",
        side: "#4f7a83",
        stroke: "#3d6670"
      }
    );
    drawRobotPrism(
      basis,
      { forward: 0, side: 0, halfForward: 7, halfSide: 10, bottom: 39, top: 54 },
      {
        top: "#edf8ff",
        front: "#b9dff0",
        back: "#a4cce0",
        side: "#91bfd4",
        stroke: "#668fa5"
      }
    );
    drawRobotFace(basis);

    var arrowTip = robotPoint(basis, 5.4, 0, 54.5);
    var arrowLeft = robotPoint(basis, -2.2, -4.2, 54.5);
    var arrowRight = robotPoint(basis, -2.2, 4.2, 54.5);
    drawPolygon([arrowTip, arrowLeft, arrowRight], "#ed8db7", "#9d6681", 1);

    var antennaBase = robotPoint(basis, -1.8, -2.5, 54);
    ctx.strokeStyle = "#557f8a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(antennaBase.x, antennaBase.y);
    ctx.lineTo(antennaBase.x - 1, antennaBase.y - 10);
    ctx.stroke();
    ctx.save();
    ctx.shadowColor = "#ed7fab";
    ctx.shadowBlur = 7;
    ctx.fillStyle = "#f29cc0";
    ctx.beginPath();
    ctx.arc(antennaBase.x - 1, antennaBase.y - 11.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawGhostRobot(pose, layout) {
    var basis = robotBasis(pose, layout);
    var scale = Math.max(0.7, Math.min(1.06, layout.tileW / 64));
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.translate(basis.center.x, basis.center.y);
    ctx.scale(scale, scale);
    ctx.shadowColor = "#40b8a6";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#40b8a6";
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    drawRobotPrism(
      basis,
      { forward: 0, side: 0, halfForward: 12, halfSide: 14, bottom: 8, top: 18 },
      {
        top: "#d8ffe8",
        front: "#40b8a6",
        back: "#319989",
        side: "#217c75",
        stroke: "#dcffe8"
      }
    );
    drawRobotPrism(
      basis,
      { forward: 0, side: 0, halfForward: 7, halfSide: 10, bottom: 34, top: 51 },
      {
        top: "#effff4",
        front: "#70d8c5",
        back: "#40b8a6",
        side: "#319989",
        stroke: "#dcffe8"
      }
    );
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
    mapCtx.fillStyle = "rgba(255, 250, 240, 0.9)";
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
      mapCtx.fillStyle = collected ? "#40b8a6" : "#d9a64b";
      mapCtx.beginPath();
      mapCtx.arc(offsetX + (goal.x + 0.5) * cell, offsetY + (goal.y + 0.5) * cell, cell * 0.28, 0, Math.PI * 2);
      mapCtx.fill();
    });

    var robotX = offsetX + (state.displayPose.x + 0.5) * cell;
    var robotY = offsetY + (state.displayPose.y + 0.5) * cell;
    var delta = core.DIR_DELTA[state.displayPose.direction];
    mapCtx.fillStyle = "#30343b";
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
    els.levelName.textContent = String(state.levelIndex + 1).padStart(2, "0") + " " + level.name;
    els.levelSubtitle.textContent = level.subtitle;
    els.energyValue.textContent =
      formatEnergy(state.robot.energyRemaining) + " / " + formatEnergy(level.energyMax);
    els.runCount.textContent = String(state.runCount);
    els.bestStars.textContent = starText(bestStarsFor(level));
    els.runMessage.textContent = state.message;
    els.objectiveStatus.textContent =
      collectedCount(level, state.robot) + " / " + level.goals.length + " beacons";
    els.energyTarget.textContent = formatEnergy(level.parEnergy);
    els.runTarget.textContent = String(level.parRuns);
    els.facingValue.textContent = core.DIR_LABEL[state.robot.direction];
    els.previewToggle.checked = state.preview;
    els.executeProgram.disabled =
      state.animating || state.commands.length === 0 || core.isComplete(level, state.robot);
    els.undoCommand.disabled = state.animating || state.commands.length === 0;
    els.clearProgram.disabled = state.animating || state.commands.length === 0;
    els.resetLevel.disabled = state.animating;

    renderLevels();
    renderQueue();
  }

  function renderLevels() {
    els.levelList.innerHTML = "";
    core.LEVELS.forEach(function (level, index) {
      var button = document.createElement("button");
      button.className = "level-button";
      if (index === state.levelIndex) {
        button.classList.add("is-active");
      }
      button.type = "button";
      button.dataset.levelIndex = String(index);
      button.setAttribute("aria-label", "Load level " + (index + 1) + ": " + level.name);
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
      empty.textContent = "Empty";
      els.commandQueue.appendChild(empty);
      return;
    }
    state.commands.forEach(function (command, index) {
      var chip = document.createElement("button");
      chip.className = "queue-chip";
      if (index === state.highlightIndex) {
        chip.classList.add("is-active");
      }
      chip.type = "button";
      chip.dataset.commandIndex = String(index);
      chip.textContent = core.commandToken(command);
      chip.title = "Remove " + commandNames[command];
      chip.setAttribute("aria-label", "Remove command " + (index + 1) + ": " + commandNames[command]);
      chip.disabled = state.animating;
      els.commandQueue.appendChild(chip);
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

  els.undoCommand.addEventListener("click", function () {
    if (!state.animating && state.commands.length > 0) {
      state.commands.pop();
      state.highlightIndex = null;
      renderAll();
    }
  });

  els.clearProgram.addEventListener("click", function () {
    if (!state.animating) {
      state.commands = [];
      state.highlightIndex = null;
      renderAll();
    }
  });

  els.executeProgram.addEventListener("click", executeProgram);

  els.resetLevel.addEventListener("click", function () {
    resetLevel(false);
  });

  els.previewToggle.addEventListener("change", function () {
    state.preview = els.previewToggle.checked;
    drawAll();
  });

  window.addEventListener("keydown", function (event) {
    if (event.target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].indexOf(event.target.tagName) !== -1) {
      return;
    }
    var key = event.key.toLowerCase();
    if (event.key === "ArrowUp" || key === "w" || key === "f") {
      event.preventDefault();
      addCommand("forward");
    } else if (event.key === "ArrowLeft" || key === "a" || key === "l") {
      event.preventDefault();
      addCommand("turn-left");
    } else if (event.key === "ArrowRight" || key === "d" || key === "r") {
      event.preventDefault();
      addCommand("turn-right");
    } else if (event.key === "Backspace") {
      event.preventDefault();
      if (state.commands.length > 0) {
        state.commands.pop();
        renderAll();
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      executeProgram();
    }
  });

  window.addEventListener("resize", drawAll);

  loadLevel(0);
})();
