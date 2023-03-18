import fs from 'node:fs/promises';
import { resolve } from 'node:path';

import vscode from 'vscode';

import { getNodeVersion, pathExists } from './utils';

export async function checkNvmrc() {
    const { workspaceFolders } = vscode.workspace;
    if (workspaceFolders && workspaceFolders.length === 1) {
        const workspaceFolder = workspaceFolders[0];
        const workspaceFolderPath = workspaceFolder.uri.fsPath;
        const nvmConfigPath = resolve(workspaceFolderPath, '.nvmrc');
        const existsNvmConfig = await pathExists(nvmConfigPath);
        if (existsNvmConfig) {
            const nvmConfig = await fs.readFile(nvmConfigPath, { encoding: 'utf8' });
            const nodeVersionInConfig = nvmConfig.trim();
            const nodeVersion = await getNodeVersion(workspaceFolderPath);
            if (nodeVersionInConfig !== nodeVersion) {
                const updateVersionItem = { title: 'Update' };
                const selectedItem = await vscode.window.showInformationMessage(
                    `You may want to update your .nvmrc from ${nodeVersionInConfig} to ${nodeVersion}`,
                    updateVersionItem,
                );
                if (selectedItem === updateVersionItem) {
                    await fs.writeFile(
                        nvmConfigPath,
                        nvmConfig.replace(nodeVersionInConfig, nodeVersion),
                        { encoding: 'utf8' },
                    );
                }
            }
        }
    }
}
