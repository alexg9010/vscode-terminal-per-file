const vscode = require('vscode');

// Map: file path (string) -> vscode.Terminal
const fileTerminals = new Map();
let autoSwitchEnabled = true;

function activate(context) {
  // Clean up the map when a terminal is closed (e.g. process exited, or user closed it)
  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((closedTerminal) => {
      for (const [filePath, terminal] of fileTerminals.entries()) {
        if (terminal === closedTerminal) {
          fileTerminals.delete(filePath);
          break;
        }
      }
    })
  );

  // Core behavior: when the active editor changes, show (or create) that file's terminal
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!autoSwitchEnabled) return;
      if (!editor || !editor.document || editor.document.uri.scheme !== 'file') return;

      const filePath = editor.document.uri.fsPath;
      let terminal = fileTerminals.get(filePath);

      if (!terminal) {
        // Lazily create a terminal pinned to this file, named after the filename
        const fileName = filePath.split('/').pop();
        terminal = vscode.window.createTerminal({
          name: `📌 ${fileName}`,
          cwd: require('path').dirname(filePath)
        });
        fileTerminals.set(filePath, terminal);
      }

      // .show(false) reveals it in the panel WITHOUT stealing focus from the editor.
      // Pass true (or omit) if you want the terminal to grab keyboard focus instead.
      terminal.show(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('terminalPerFile.toggleAutoSwitch', () => {
      autoSwitchEnabled = !autoSwitchEnabled;
      vscode.window.showInformationMessage(
        `Terminal Per File: auto-switch ${autoSwitchEnabled ? 'enabled' : 'disabled'}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('terminalPerFile.closeForFile', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const filePath = editor.document.uri.fsPath;
      const terminal = fileTerminals.get(filePath);
      if (terminal) {
        terminal.dispose();
        fileTerminals.delete(filePath);
      }
    })
  );
}

function deactivate() {
  fileTerminals.clear();
}

module.exports = { activate, deactivate };
