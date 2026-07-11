/* eslint-disable @typescript-eslint/no-require-imports */
const { exec } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/admin`;

function openBrowser(url) {
  const platform = process.platform;
  const command =
    platform === "win32"
      ? `start ${url}`
      : platform === "darwin"
      ? `open ${url}`
      : `xdg-open ${url}`;

  exec(command);
}

function waitForServer() {
  const req = http.get(`http://localhost:${PORT}`, () => {
    console.log(`\n🔗 صفحة الأدمن: ${URL}\n`);
    openBrowser(URL);
  });

  req.on("error", () => {
    setTimeout(waitForServer, 500);
  });
}

waitForServer();