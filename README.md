# modify-file-warning README

![test](https://github.com/tjx666/modify-file-warning/actions/workflows/test.yml/badge.svg)

Useful when modify file under node_modules accidentally.

## Settings

```jsonc
{
  // will give a warning is file match the includedFileGlobs
  "modifyFileWarning.includedFileGlobs": [
    "**/node_modules/**/*"
    // "**/.git/**"
  ],
  // you can using this setting to exclude files from includedFileGlobs
  "modifyFileWarning.excludedFileGlobs": []
}
```

## Why not automatically set file readonly but choose to warn?

VSCode doesn't provide an api to mark a opened editor readonly now, ref: [Add read-only mode](https://github.com/microsoft/vscode/issues/4873).
