const vscode = require('vscode');

const config = {}

const configDefaults = {
  color: {
    name: "color",
    defaultValue: "#75715E88"
  },
  hideActiveLine: {
    name: "hide-active-line",
    defaultValue: false
  },
  hideEmptyLines: {
    name: "hide-empty-lines",
    defaultValue: true
  },
  useAbsoluteOnActiveLine: {
    name: "use-absolute-active-line",
    defaultValue: false
  },
  margin: {
    name: "margin",
	  defaultValue: "0 0 0 2em"
  },
  usePrefix: {
    name: "use-prefix",
    defaultValue: false
  },
  prefixDefault: {
    name: "prefix-default",
    defaultValue: ""
  },
  prefixAbove: {
    name: "prefix-above",
    defaultValue: null,
    relativeValue: (cfg) => cfg.prefixDefault
  },
  prefixBelow: {
    name: "prefix-below",
    defaultValue: null,
    relativeValue: (cfg) => cfg.prefixDefault
  },
  prefixCurrent: {
    name: "prefix-current",
    defaultValue: null,
    relativeValue: (cfg) => cfg.prefixDefault
  },
  useSuffix: {
    name: "use-suffix",
    defaultValue: false
  },
  suffixDefault: {
    name: "suffix-default",
    defaultValue: ""
  },
  suffixAbove: {
    name: "suffix-above",
    defaultValue: null,
    relativeValue: (cfg) => cfg.suffixDefault
  },
  suffixBelow: {
    name: "suffix-below",
    defaultValue: null,
    relativeValue: (cfg) => cfg.suffixDefault
  },
  suffixCurrent: {
    name: "suffix-current",
    defaultValue: null,
    relativeValue: (cfg) => cfg.suffixDefault
  },
}

function updateConfig() {
  const workspaceConfig = vscode.workspace.getConfiguration('relative-line-endings', null);
  for (let [key, item] of Object.entries(configDefaults)) {
    const value = item.defaultValue == null ? item.relativeValue(configDefaults).defaultValue : item.defaultValue;
    config[key] = workspaceConfig.get(item.name, value);
  }
}


function activate(context) {

  let activeEditor = vscode.window.activeTextEditor;

  updateConfig()

  const decorationType = vscode.window.createTextEditorDecorationType({
    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    after: { }
  })

  vscode.workspace.onDidChangeConfiguration(() => {
    updateConfig()
  })

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    const decorations = [];
    const activeLine = activeEditor.selection.active.line;

    const top = activeEditor.visibleRanges[0];
    const startLine = top.start.line;
    const bottom = activeEditor.visibleRanges[1];
    const endLine = bottom?.end?.line || activeEditor.document.lineCount;

    const { color, hideActiveLine, hideEmptyLines, useAbsoluteOnActiveLine, margin, usePrefix, prefixDefault, prefixAbove, prefixBelow, prefixCurrent, useSuffix, suffixDefault, suffixAbove, suffixBelow, suffixCurrent, } = config;

    for (let i = startLine; i < endLine; i++) {
      let relative = Math.abs(i - activeLine);

      if (relative == 0) {
        if (hideActiveLine) continue;
        if (useAbsoluteOnActiveLine)
          relative = i + 1;
      }

      if (hideEmptyLines && activeEditor.document.lineAt(i).text == "") continue;

      let contentText = `${relative}`;

      if (usePrefix) {
        let prefix = "";
        // before
        if (activeLine < i) {
          prefix = prefixAbove;
        }
        // after
        else if (activeLine > i) {
          prefix = prefixBelow;
        }
        // current
        else {
          prefix = prefixCurrent;
        }
        contentText = prefix + contentText;
      }

      if (useSuffix) {
        let suffix = "";
        // before
        if (activeLine < i) {
          suffix = suffixAbove;
        }
        // after
        else if (activeLine > i) {
          suffix = suffixBelow;
        }
        // current
        else {
          suffix = suffixCurrent;
        }
        contentText += suffix;
      }

      const decoration = {
        range: new vscode.Range(i, Number.MAX_SAFE_INTEGER, i, Number.MAX_SAFE_INTEGER),
        renderOptions: {
          after: {
            contentText,
            color,
            margin,
          }
        }
      };

      decorations.push(decoration);
    }
    activeEditor.setDecorations(decorationType, decorations);
  }

  if (activeEditor) {
    updateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    activeEditor = editor;
    if (editor) {
      updateDecorations();
    }
  }, null, context.subscriptions)

  vscode.window.onDidChangeTextEditorSelection(() => {
    updateDecorations()
  }, null, context.subscriptions)


  vscode.window.onDidChangeTextEditorVisibleRanges(() => {
    updateDecorations()
  }, null, context.subscriptions)

  vscode.workspace.onDidChangeTextDocument(() => {
    updateDecorations()
  }, null, context.subscriptions)

}

function deactivate() { }

module.exports = { activate, deactivate };
