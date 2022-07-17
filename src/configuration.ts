import vscode, { ExtensionContext } from 'vscode';

type Configuration = {
    includedFileGlobs: string[];
    excludedFileGlobs: string[];
};

export const configuration: Configuration = {} as Configuration;
updateConfiguration();

export function updateConfiguration() {
    const extensionConfig = vscode.workspace.getConfiguration('modifyFileWarning');
    configuration.includedFileGlobs = (extensionConfig.get('includedFileGlobs') as string[]) ?? [];
    configuration.excludedFileGlobs = (extensionConfig.get('excludedFileGlobs') as string[]) ?? [];
}


