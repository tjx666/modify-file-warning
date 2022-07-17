import { exec } from 'child_process';
import fs from 'fs/promises';
import { constants as FS_CONSTANTS } from 'fs';

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
