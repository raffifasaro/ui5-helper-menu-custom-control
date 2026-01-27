sap.ui.define([], function () {
  "use strict";

  return sap.ui.getCore().initLibrary({
    name: "helper.menu",
    version: "0.1.0",
    dependencies: [
      "sap.ui.core",
      "sap.m"
    ],
    controls: [
      "helper.menu.AiMenuButton",
      "helper.menu.AiAssistantCore"
    ],
    noLibraryCSS: true
  });
});

