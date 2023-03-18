import { exec } from 'node:child_process';
import { constants as FS_CONSTANTS } from 'node:fs';
import fs from 'node:fs/promises';

export function pathExists(path: string) {
    return fs
        .access(path, FS_CONSTANTS.F_OK)
        .then(() => true)
        .catch(() => false);
}

export function getNodeVersion(cwd: string) {
    return new Promise<string>((resolve, reject) => {
        exec('node --version', { cwd }, (err, stdout) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(stdout.trim());
        });
    });
}
