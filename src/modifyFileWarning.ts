import minimatch from 'minimatch';
import vscode from 'vscode';

import { configuration } from './configuration';

const warnedFiles = new Set();

function validateFile(fsPath: string) {
    if (warnedFiles.size > 50) {
        vscode.window.showErrorMessage(`warned files is too many, count: ${warnedFiles.size}`);
    }

    const start = Date.now();

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

    const cost = Date.now() - start;
    if (cost > configuration.validateCostThreshold) {
        vscode.window.showWarningMessage(
            `File Warning check file "${fsPath}" costs: ${cost}ms, you may set bad glob patterns`,
        );
    }

    return {
        shouldWarn,
        violatedGlob,
    };
}

function revert() {
    return vscode.commands.executeCommand('workbench.action.files.revert');
}

function undo() {
    return vscode.commands.executeCommand('undo');
}

export function modifyFileWarning(subscriptions: vscode.ExtensionContext['subscriptions']) {
    let checkCreate = true;
    let checkDelete = true;

    vscode.workspace.onDidCreateFiles(
        async ({ files }) => {
            if (!checkCreate || files.length === 0) {
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
        },
        null,
        subscriptions,
    );

    vscode.workspace.onDidDeleteFiles(
        async ({ files }) => {
            if (!checkDelete || files.length === 0) {
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
                    detail: `files:\n${invalidFiles.join('\n')} shouldn't be delete`,
                },
                restoreItem,
            );
            if (selectedItem === restoreItem) {
                checkCreate = false;
                await undo();
                setTimeout(() => {
                    checkCreate = true;
                }, 100);
            }
        },
        null,
        subscriptions,
    );

    vscode.workspace.onDidChangeTextDocument(
        async ({ document, contentChanges }) => {
            if (
                warnedFiles.has(document) ||
                contentChanges.length === 0 ||
                document.uri.scheme !== 'file'
            ) {
                return;
            }

            const { shouldWarn, violatedGlob } = validateFile(document.uri.fsPath);

            if (shouldWarn) {
                warnedFiles.add(document);
                const revertFileItem = { title: 'Revert' };
                const selectedItem = await vscode.window.showWarningMessage(
                    'Modify File Warning',
                    {
                        modal: true,
                        detail: `This file shouldn't be modified because it violates the glob: "${violatedGlob}"`,
                    },
                    revertFileItem,
                );
                if (selectedItem === revertFileItem) {
                    await revert();
                    if (
                        vscode.workspace.getConfiguration().get('files.autoSave') !== 'afterDelay'
                    ) {
                        warnedFiles.delete(document);
                    }
                }
            }
        },
        null,
        subscriptions,
    );

    vscode.workspace.onDidCloseTextDocument(
        (document) => {
            warnedFiles.delete(document);
        },
        null,
        subscriptions,
    );
}
