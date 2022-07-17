import vscode from 'vscode';
import { configuration, updateConfiguration } from './configuration';

export function activate(context: vscode.ExtensionContext) {
    const { subscriptions } = context;
    
    vscode.workspace.onDidChangeConfiguration(() => {
        updateConfiguration();
    }, subscriptions);

    const warnedFiles = new Set();
    vscode.workspace.onDidChangeTextDocument((event) => {
        if (warnedFiles.has(event.document)) {
            return;
        }

        let violatedGlob: string | undefined;
        const isIncluded = configuration.includedFileGlobs.some((glob) => {
            if (vscode.languages.match({ pattern: glob }, event.document)) {
                violatedGlob = glob;
                return true;
            }

            return false;
        });

        const isExcluded = configuration.excludedFileGlobs.some((glob) =>
            vscode.languages.match({ pattern: glob }, event.document),
        );

        const shouldWarn = isIncluded && !isExcluded;

        if (shouldWarn) {
            warnedFiles.add(event.document);
            vscode.window.showWarningMessage('Modify File Warning', {
                modal: true,
                detail: `This file shouldn't be modified because it violates the glob: "${violatedGlob}"`,
            });
        }
    }, subscriptions);

    vscode.workspace.onDidCloseTextDocument((document) => {
        warnedFiles.delete(document);
    }, subscriptions);
}

export function deactivate() {}
