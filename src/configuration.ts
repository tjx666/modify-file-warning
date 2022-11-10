import vscode from 'vscode';

type Configuration = {
    includedFileGlobs: string[];
    excludedFileGlobs: string[];
    enableNvmrcCheck: boolean;
    validateCostThreshold: number;
};

export const configuration: Configuration = {} as Configuration;
updateConfiguration();

export function updateConfiguration() {
    const extensionConfig = vscode.workspace.getConfiguration('modifyFileWarning');
    configuration.includedFileGlobs = extensionConfig.get('includedFileGlobs')!;
    configuration.excludedFileGlobs = extensionConfig.get('excludedFileGlobs')!;
    configuration.enableNvmrcCheck = extensionConfig.get('enableNvmrcCheck')!;
    configuration.validateCostThreshold = extensionConfig.get('validateCostThreshold')!;
}
