import fs from 'fs/promises';
import { resolve } from 'path';
import vscode from 'vscode';

import { configuration, updateConfiguration } from './configuration';
import { getNodeVersion, pathExists } from './utils';

export async function activate(context: vscode.ExtensionContext) {
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

    if (configuration.enableNvmrcCheck) {
        checkNvmrc();
    }
}

async function checkNvmrc() {
    const { workspaceFolders } = vscode.workspace;
    if (workspaceFolders && workspaceFolders.length === 1) {
        const workspaceFolder = workspaceFolders[0];
        const workspaceFolderPath = workspaceFolder.uri.fsPath;
        const nvmConfigPath = resolve(workspaceFolderPath, '.nvmrc');
        const existsNvmConfig = await pathExists(nvmConfigPath);
        if (existsNvmConfig) {
            const nodeVersionInConfig = (
                await fs.readFile(nvmConfigPath, { encoding: 'utf-8' })
            ).trim();
            const nodeVersion = await getNodeVersion(workspaceFolderPath);
            if (nodeVersionInConfig !== nodeVersion) {
                vscode.window.showInformationMessage(
                    `You may want to update your .nvmrc from ${nodeVersionInConfig} to ${nodeVersion}`,
                );
            }
        }
    }
}

export function deactivate() {}
