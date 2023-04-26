import vscode from 'vscode';

import { updateConfiguration } from './configuration';
import { modifyFileWarning } from './modifyFileWarning';

export async function activate(context: vscode.ExtensionContext) {
    const { subscriptions } = context;

    vscode.workspace.onDidChangeConfiguration(
        (event) => {
            if (event.affectsConfiguration('modifyFileWarning')) {
                updateConfiguration();
            }
        },
        null,
        subscriptions,
    );

    modifyFileWarning(context);
}

export function deactivate() {
    // nothing todo
}
