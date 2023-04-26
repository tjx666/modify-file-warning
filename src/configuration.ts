import vscode from 'vscode';

interface Configuration {
    includedFileGlobs: string[];
    excludedFileGlobs: string[];
    validateCostThreshold: number;
}

export const configuration: Configuration = {} as Configuration;
updateConfiguration();

export function updateConfiguration() {
    const extensionConfig = vscode.workspace.getConfiguration('modifyFileWarning');
    configuration.includedFileGlobs = extensionConfig.get('includedFileGlobs')!;
    configuration.excludedFileGlobs = extensionConfig.get('excludedFileGlobs')!;
    configuration.validateCostThreshold = extensionConfig.get('validateCostThreshold')!;
}
