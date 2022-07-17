# modify-file-warning README

Useful when modify file under node_modules accidentally.

## Settings

```json
{
    // will give a warning is file match the includedFileGlobs
    "modifyFileWarning.includedFileGlobs": ["**/node_modules/**/*"],
    // you can using this setting to exclude files from includedFileGlobs
    "modifyFileWarning.excludedFileGlobs": [],
    // default is false, recommend to enable
    // will notify you to update your .nvmrc when version in .nvmrc in not the same in you shell environment
    "modifyFileWarning.enableNvmrcCheck": true
}
```
