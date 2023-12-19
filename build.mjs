import * as fs from "fs";
import copyfiles from "copyfiles";
import webExt from "web-ext";

const copyFilesPromise = (paths, config = {}, callback = () => {}) => {
  return new Promise((resolve, reject) => {
    copyfiles(paths, config, () => {
      callback();
      resolve();
    });
  });
};

const build = async (name, manifestFile = "manifest.json") => {
  if (!fs.existsSync("web-ext-artifacts")) {
    fs.mkdirSync("web-ext-artifacts");
  }

  if (fs.existsSync(`build-${name}`)) {
    fs.rmSync(`build-${name}`, { recursive: true, force: true });
  }

  await copyFilesPromise([
    "build/*",
    "icons/*",
    "libs/*",
    "options/*",
    "resources/*",
    "styles/*",
    "vn-hook/*",
    manifestFile,
    `build-${name}`,
  ]);

  if (manifestFile !== "manifest.json") {
    fs.renameSync(
      `build-${name}/${manifestFile}`,
      `build-${name}/manifest.json`
    );
  }

  process.chdir(`./build-${name}`);
  await webExt.cmd.build({ sourceDir: "./", artifactsDir: "out" });
  process.chdir("..");

  const fileName = fs.readdirSync(`build-${name}/out/`)[0];

  fs.copyFileSync(
    `build-${name}/out/${fileName}`,
    `web-ext-artifacts/${fileName.replace(".zip", `-${name}.zip`)}`
  );

  fs.rmSync(`build-${name}`, { recursive: true, force: true });
};

void build("firefox", "manifest.json").then(() => {
  return build("chrome", "manifest-chrome.json");
});
