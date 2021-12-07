import * as vscode from "vscode";

const workboxBuild = require("workbox-build");

export async function handleServiceWorkerCommand() {
  const buildDir = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: "Select your build directory",
  });

  if (buildDir) {
    const serviceWorkerFileName = await vscode.window.showInputBox({
      title: "Service Worker File Name",
      value: "serviceWorkerFileName",
      prompt: "What would you like your service worker file to be called?",
      placeHolder: "service-worker.js",
    });

    if (serviceWorkerFileName) {
      console.log("here");
      try {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
          },
          async (progress) => {
            progress.report({ message: "Building service worker..." });
            await runWorkboxTool(buildDir[0].fsPath, serviceWorkerFileName);
            progress.report({ message: "Service worker added!" });
          }
        );

        await handleAddingToIndex();
      } catch (err) {
        vscode.window.showErrorMessage(
          err && (err as Error).message
            ? (err as Error).message
            : "There was an issue adding your service worker"
        );
      }
    }
  }
}

async function runWorkboxTool(buildDir: string, fileName: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await workboxBuild.generateSW({
        globDirectory: `${buildDir}`,
        globPatterns: ["**/*.{html,json,js,css}"],
        inlineWorkboxRuntime: true,
        swDest: `${vscode.workspace.workspaceFolders?.[0].uri.fsPath}/${fileName}`,
      });
      console.log(data);
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
}

async function handleAddingToIndex() {
  const indexFile = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    title: "Select your index.html",
    filters: {
      HTML: ["html"],
    },
  });

  if (indexFile) {
    const document = await vscode.workspace.openTextDocument(indexFile[0]);
    console.log(document);
    await vscode.window.showTextDocument(document);

    await vscode.window.showInformationMessage(
      "Finish adding your service worker by adding the following code to your index.html: `navigator.serviceWorker.register('/service-worker.js');`",
      {},
      {
        title: "Copy to clipboard",
        action: async () => {
          try {
            await vscode.env.clipboard.writeText(
              `<script>navigator.serviceWorker.register('/service-worker.js');</script>`
            );
          } catch (err) {
            vscode.window.showErrorMessage(
              err && (err as Error).message
                ? (err as Error).message
                : "There was an issue adding your service worker"
            );
          }
        },
      }
    );
  }
}
