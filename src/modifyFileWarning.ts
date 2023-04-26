import { setTimeout } from 'node:timers/promises';

import { minimatch } from 'minimatch';
import vscode, { Uri } from 'vscode';

import { configuration } from './configuration';

const warnedFiles = new Set<string>();

function validateFile(fsPath: string) {
    if (warnedFiles.size > 50) {
        vscode.window.showErrorMessage(`warned files is too many, count: ${warnedFiles.size}`);
        console.error(`warned files:\n${[...warnedFiles].join('\n')}`);
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

async function revert() {
    return vscode.commands.executeCommand('workbench.action.files.revert');
}

async function undo() {
    return vscode.commands.executeCommand('undo');
}

export function modifyFileWarning({ subscriptions }: vscode.ExtensionContext) {
    let checkCreate = true;
    let checkDelete = true;

    vscode.workspace.onDidCreateFiles(
        async ({ files }) => {
            if (!checkCreate || files.length === 0) {
                return;
            }

            const filesChooseToDelete: string[] = [];
            for (const file of files) {
                if (file.scheme !== 'file') {
                    continue;
                }

                const { shouldWarn, violatedGlob } = validateFile(file.fsPath);
                if (!shouldWarn) {
                    return;
                }

                await vscode.commands.executeCommand('vscode.open', file);
                warnedFiles.add(file.fsPath);
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
                    filesChooseToDelete.push(file.fsPath);
                }
            }
            if (filesChooseToDelete.length > 0) {
                checkDelete = false;
                const edit = new vscode.WorkspaceEdit();
                for (const file of filesChooseToDelete) {
                    edit.deleteFile(Uri.file(file), { recursive: true, ignoreIfNotExists: true });
                    warnedFiles.delete(file);
                }
                await vscode.workspace.applyEdit(edit);
                checkDelete = true;
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
                    detail: `These files shouldn't be deleted:\n${invalidFiles.join('\n')}`,
                },
                restoreItem,
            );
            if (selectedItem === restoreItem) {
                checkCreate = false;
                await undo();
                await setTimeout(100);
                checkCreate = true;
            }
        },
        null,
        subscriptions,
    );

    vscode.workspace.onDidChangeTextDocument(
        async ({ document, contentChanges }) => {
            if (
                document.uri.scheme !== 'file' ||
                warnedFiles.has(document.uri.fsPath) ||
                contentChanges.length === 0
            ) {
                return;
            }

            const { shouldWarn, violatedGlob } = validateFile(document.uri.fsPath);

            if (shouldWarn) {
                warnedFiles.add(document.uri.fsPath);
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
                    if (document.isDirty) {
                        await revert();
                    } else {
                        await undo();
                    }

                    if (
                        vscode.workspace.getConfiguration().get('files.autoSave') !== 'afterDelay'
                    ) {
                        warnedFiles.delete(document.uri.fsPath);
                    }
                }
            }
        },
        null,
        subscriptions,
    );

    vscode.workspace.onDidCloseTextDocument(
        (document) => {
            warnedFiles.delete(document.uri.fsPath);
        },
        null,
        subscriptions,
    );
}
