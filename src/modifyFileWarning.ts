import minimatch from 'minimatch';
import vscode from 'vscode';

import { configuration } from './configuration';

function validateFile(fsPath: string) {
    let violatedGlob: string | undefined;
    const isIncluded = configuration.includedFileGlobs.some((glob) => {
        if (minimatch(fsPath, glob)) {
            violatedGlob = glob;
            return true;
        }

        return false;
    });
    const isExcluded = configuration.excludedFileGlobs.some((glob) => minimatch(fsPath, glob));
    const shouldWarn = isIncluded && !isExcluded;
    return {
        shouldWarn,
        violatedGlob,
    };
}

export function modifyFileWarning(subscriptions: vscode.ExtensionContext['subscriptions']) {
    const warnedFiles = new Set();
    let checkCreate = true;
    let checkDelete = true;

    vscode.workspace.onDidCreateFiles(async ({ files }) => {
        if (!checkCreate) {
            return;
        }

        async function checkFile(file: vscode.Uri) {
            if (file.scheme !== 'file') {
                return;
            }

            const { shouldWarn, violatedGlob } = validateFile(file.fsPath);
            if (!shouldWarn) {
                return;
            }

            let editor = vscode.window.visibleTextEditors.find(
                (editor) => editor.document.uri.fsPath === file.fsPath,
            );
            if (!editor) {
                const document = await vscode.workspace.openTextDocument(file);
                editor = await vscode.window.showTextDocument(document);
            } else {
                vscode.window.showTextDocument(editor.document);
            }

            warnedFiles.add(editor.document);
            const deleteFileItem = { title: 'Delete' };
            const selectedItem = await vscode.window.showWarningMessage(
                'Modify File Warning',
                {
                    modal: true,
                    detail: `You shouldn't create this file because it violates the glob: "${violatedGlob}"`,
                },
                deleteFileItem,
            );
            if (selectedItem === deleteFileItem) {
                checkDelete = false;
                const edit = new vscode.WorkspaceEdit();
                edit.deleteFile(file, { recursive: true, ignoreIfNotExists: true });
                await vscode.workspace.applyEdit(edit);
                warnedFiles.delete(editor.document);
                checkDelete = true;
            }
        }

        for (const file of files) {
            await checkFile(file);
        }
    }, subscriptions);

    vscode.workspace.onDidDeleteFiles(async ({ files }) => {
        if (!checkDelete) {
            return;
        }

        const invalidFiles = files
            .filter((file) => file.scheme === 'file' && validateFile(file.fsPath).shouldWarn)
            .map((uri) => uri.fsPath);
        if (invalidFiles.length === 0) {
            return;
        }

        const restoreItem = { title: 'Restore' };
        const selectedItem = await vscode.window.showWarningMessage(
            'Modify File Warning',
            {
                modal: true,
                detail: 'files:\n' + invalidFiles.join('\n') + ` shouldn't be delete`,
            },
            restoreItem,
        );
        if (selectedItem === restoreItem) {
            checkCreate = false;
            await vscode.commands.executeCommand('undo');
            setTimeout(() => {
                checkCreate = true;
            }, 100);
        }
    }, subscriptions);

    vscode.workspace.onDidChangeTextDocument(async ({ document }) => {
        if (warnedFiles.has(document) || document.uri.scheme !== 'file') {
            return;
        }

        const { shouldWarn, violatedGlob } = validateFile(document.uri.fsPath);
        if (shouldWarn) {
            warnedFiles.add(document);
            const revertFileItem = { title: 'Revert File' };
            const selectedItem = await vscode.window.showWarningMessage(
                'Modify File Warning',
                {
                    modal: true,
                    detail: `This file shouldn't be modified because it violates the glob: "${violatedGlob}"`,
                },
                revertFileItem,
            );
            if (selectedItem === revertFileItem) {
                await vscode.commands.executeCommand('workbench.action.files.revert');
                if (vscode.workspace.getConfiguration().get('files.autoSave') !== 'afterDelay') {
                    warnedFiles.delete(document);
                }
            }
        }
    }, subscriptions);

    vscode.workspace.onDidCloseTextDocument((document) => {
        warnedFiles.delete(document);
    }, subscriptions);
}
