(function (root) {
  "use strict";

  var theme = {
    shell: "#b9c1c6",
    frame: "#394247",
    screen: "#4f8fa2",
    panel: "#e5e9eb",
    ink: "#242b2f",
    muted: "#68747a",
    floor: "#bdd8e2",
    wall: "#a8c9b4",
    robot: "#ff9f2f",
    beacon: "#b85cff",
    path: "#42d0a4",
    energy: "#f4bd5e",
    charge: "#55cfc0",
    danger: "#c8454d"
  };

  if (root.document && root.document.documentElement) {
    Object.keys(theme).forEach(function (name) {
      root.document.documentElement.style.setProperty(
        "--rn-" + name,
        theme[name]
      );
    });
  }

  root.RoboNaviTheme = Object.freeze(theme);
})(typeof globalThis !== "undefined" ? globalThis : this);
