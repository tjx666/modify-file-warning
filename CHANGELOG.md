# Change Log

## [1.0.0] - 2023-04-27

### Breaking Change

- remove nvmrc check feature
- the default warning files pattern changed to be `["**/node_modules/**"]`

### Changed

## [0.1.2] - 2023-03-19

### Changed

- just upgrade deps and some code refactor

## [0.1.1] - 2022-11-12

### Changed

- not validate when no file no change

## [0.1.0] - 2022-11-11

### Changed

- use esbuild bundle extension

## [0.0.3] - 2022-07-17

### Added

- warning user when shouldn't create file
- warning user when shouldn't delete file
- add `Revert` action to warning modal
- add `Update` action to nvmrc check message

## [0.0.2] - 2022-07-17

### Added

- Feature: notify you to update your .nvmrc when version in .nvmrc in not the same in you shell environment
- Setting: `modifyFileWarning.enableNvmrcCheck`

## [0.0.1] - 2022-07-17

### Added

- Setting: `modifyFileWarning.includedFileGlobs`
- Setting: `modifyFileWarning.excludedFileGlobs`
