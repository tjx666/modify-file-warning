import vscode from 'vscode';

import { checkNvmrc } from './checkNvmrc';
import { configuration, updateConfiguration } from './configuration';
import { modifyFileWarning } from './modifyFileWarning';

export async function activate(context: vscode.ExtensionContext) {
    const { subscriptions } = context;

    vscode.workspace.onDidChangeConfiguration(() => { updateConfiguration(); }, subscriptions);
    
    modifyFileWarning(subscriptions);

    if (configuration.enableNvmrcCheck) {
        checkNvmrc();
    }
}

export function deactivate() {}
