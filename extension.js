const vscode = require('vscode');
const path = require('path');
const crypto = require('crypto');

// Map: file path (string) -> vscode.Terminal
const fileTerminals = new Map();
let autoSwitchEnabled = true;

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('terminalPerFile');
  return {
    scope: cfg.get('scope', 'file'),
    useTmux: cfg.get('useTmux', false),
    tmuxSessionPrefix: cfg.get('tmuxSessionPrefix', 'vsc-'),
    tmuxBinary: cfg.get('tmuxBinary', 'tmux')
  };
}

// The "key" is whatever a terminal is pinned to: a full file path in "file"
// scope, or a directory path in "directory" scope. Everything downstream
// (map lookups, terminal naming, tmux session naming) just operates on this
// key and doesn't need to know which scope produced it.
function keyForEditor(filePath, scope) {
  return scope === 'directory' ? path.dirname(filePath) : filePath;
}

// tmux session names can't contain ':' or '.', and we want something short
// but still unique per full path (two files/dirs named the same under
// different parents must not collide) - so use the basename plus a short
// hash of the full key.
function sessionNameForKey(key, prefix) {
  const base = path.basename(key).replace(/[^a-zA-Z0-9_-]/g, '_');
  const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 6);
  return `${prefix}${base}-${hash}`;
}

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
      const { scope, useTmux, tmuxSessionPrefix, tmuxBinary } = getConfig();
      const key = keyForEditor(filePath, scope);
      let terminal = fileTerminals.get(key);

      if (!terminal) {
        const label = path.basename(key); // filename, or directory name in "directory" scope
        const icon = scope === 'directory' ? '📁' : '📌';

        terminal = vscode.window.createTerminal({
          name: `${icon} ${label}`,
          cwd: path.dirname(filePath)
        });

        if (useTmux) {
          const sessionName = sessionNameForKey(key, tmuxSessionPrefix);
          // -A: attach if the session already exists (e.g. from before a
          // restart), create it otherwise. This is what makes the session,
          // and anything running inside it, survive closing VS Code.
          terminal.sendText(`${tmuxBinary} new-session -A -s ${sessionName}`);
        }

        fileTerminals.set(key, terminal);
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
      const { scope } = getConfig();
      const key = keyForEditor(editor.document.uri.fsPath, scope);
      const terminal = fileTerminals.get(key);
      if (terminal) {
        // Note: with useTmux enabled, disposing the VS Code terminal just
        // detaches the tmux client - the session (and anything running in
        // it) keeps going in the background, and reattaches automatically
        // next time you open this file/directory. Use `tmux kill-session`
        // yourself if you actually want to end it.
        terminal.dispose();
        fileTerminals.delete(key);
      }
    })
  );
}

function deactivate() {
  fileTerminals.clear();
}

module.exports = { activate, deactivate };
