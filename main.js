

const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 900,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));
    win.show();
    win.focus();
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

