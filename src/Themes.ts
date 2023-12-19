type Theme = {
  name: string;
  backgroundColour: string;
  foregroundColour: string;
  textColour: string;
};

const Default: Theme = {
  name: "Default",
  backgroundColour: "rgba(0, 0, 0, 0)",
  foregroundColour: "rgba(0, 0, 0, 0)",
  textColour: "rgb(33, 37, 41)",
};

const GhostBin: Theme = {
  name: "Ghostbin",
  backgroundColour: "rgb(19, 21, 30)",
  foregroundColour: "rgb(25, 27, 39)",
  textColour: "#A6ACCD",
};

const Tomorrow: Theme = {
  name: "Tomorrow",
  backgroundColour: "rgb(29, 31, 33)",
  foregroundColour: "rgb(40, 42, 46)",
  textColour: "rgb(197, 200, 198)",
};

const themes = [Default, GhostBin, Tomorrow];

const applyTheme = (name: string) => {
  const theme = themes.find((theme) => theme.name === name) ?? Default;

  const styleInnerHtml = `
    html, body {
        background: ${theme.backgroundColour};
    }
    
    .card, .nav-tabs .nav-link.active {
      background: ${theme.foregroundColour};
      color: ${theme.textColour};
    }
    
     pre code {
      background: ${theme.foregroundColour};
      color: ${theme.textColour};
      display: inline-block;
      height: 100%;
      width: 100%;
      padding: 10px
    }
    
    .nav-tabs .nav-link.active, .nav-link:hover {
      border-color: ${theme.foregroundColour};
    }
`;

  if (!document.getElementById("custom-theme-node")) {
    const styleNode = document.createElement("style");
    styleNode.id = "custom-theme-node";
    styleNode.innerHTML = styleInnerHtml;

    document.head.appendChild(styleNode);
  } else {
    document.getElementById("custom-theme-node").innerHTML = styleInnerHtml;
  }
};

browser.storage.sync.get("config").then((extensionConfig) => {
  applyTheme(extensionConfig.config.optionsTheme);
});

browser.storage.onChanged.addListener((change, storageArea) => {
  if (change.config === undefined) return;

  applyTheme(change.config.newValue.optionsTheme);
});
