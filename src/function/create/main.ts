import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';

// Git 클론 및 .git 폴더 제거
async function cloneAndRemoveGit(repoUrl: string, branchName: string, targetDirectory: string): Promise<boolean> {
    return new Promise((resolve) => {
        exec(`git clone -b ${branchName} ${repoUrl} ${targetDirectory}`, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Failed to clone Git: ${stderr}`);
                resolve(false);
                return;
            }

            const gitDir = path.join(targetDirectory, '.git');
            try {
                if (await fs.stat(gitDir)) {
                    await fs.rm(gitDir, { recursive: true });
                    // console.log('.git folder has been successfully removed.');
                }
            } catch (err) {
                if (err instanceof Error) {
                    console.log(`.git folder does not exist: ${err.message}`);
                } else {
                    console.log('.git folder does not exist.');
                }
            }

            resolve(true);
        });
    });
}

// 파일 내 문자열 치환
async function replaceStringInFiles(directoryPath: string, originalString: string, replacementString: string): Promise<void> {
    try {
        const directory = await fs.opendir(directoryPath);

        for await (const dirent of directory) {
            const fullPath = path.join(directoryPath, dirent.name);

            if (dirent.isFile()) {
                try {
                    const fileContent = await fs.readFile(fullPath, 'utf8');

                    if (fileContent.includes(originalString)) {
                        const modifiedContent = fileContent.replace(new RegExp(originalString, 'g'), replacementString);
                        await fs.writeFile(fullPath, modifiedContent, 'utf8');
                        // console.log(`Replaced in ${fullPath}`);
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        console.error(`Skipping ${fullPath}, error reading file: ${error.message}`);
                    }
                }
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`An exception occurred: ${error.message}`);
        }
    }
}

// 특정 파일에서 문자열 치환
async function replaceStringInFile(filePath: string, originalString: string, replacementString: string): Promise<void> {
    try {
        // 파일 경로를 디버깅 위해 출력
        // console.log(`Modifying file: ${filePath}`);

        // 파일 읽기
        const fileContent = await fs.readFile(filePath, 'utf8');

        // 원본 문자열이 파일에 존재하는지 확인
        if (!fileContent.includes(originalString)) {
            // console.log(`Original string not found in ${filePath}`);
        }

        // 문자열 치환
        const modifiedContent = fileContent.replace(new RegExp(originalString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replacementString);

        // 수정된 내용 파일에 쓰기
        await fs.writeFile(filePath, modifiedContent, 'utf8');
        // console.log(`Replaced in ${filePath}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to update file ${filePath}: ${error.message}`);
        }
    }
}

// 폴더 이름 변경
async function renameNewFolders(directoryPath: string, newName: string, checkDirName?: string[]): Promise<void> {
    try {
        const directory = await fs.opendir(directoryPath);
        const directoriesToRename: string[] = [];

        for await (const dirent of directory) {
            if (dirent.isDirectory()) {
                const dirName = dirent.name;
                const fullPath = path.join(directoryPath, dirName);

                if (dirName === '_new' || (checkDirName && (checkDirName.includes(dirName) || dirName.startsWith('_new.')))) {
                    directoriesToRename.push(fullPath);
                }
            }
        }

        for (const dir of directoriesToRename) {
            const dirName = path.basename(dir);
            let newPath = dir;

            if (dirName === '_new') {
                newPath = dir.replace(/_new$/, newName);
            } else if (dirName.startsWith('_new.')) {
                newPath = dir.replace(/_new/, newName);
            } else if (checkDirName && checkDirName.includes(dirName)) {
                newPath = dir.replace(new RegExp(`${dirName}$`), newName);
            }

            try {
                await fs.rename(dir, newPath);
                // console.log(`Renamed ${dir} to ${newPath}`);
            } catch (error) {
                if (error instanceof Error) {
                    console.error(`Failed to rename directory: ${error.message}`);
                }
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`An exception occurred: ${error.message}`);
        }
    }
}

// 프로젝트 생성 메인 함수
export async function createUI(name: string): Promise<void> {
    const repoUrl = 'https://github.com/melodysdreamj/uihub.git';
    const branchName = 'template';

    let successClone = await cloneAndRemoveGit(repoUrl, branchName, name);

    if (successClone) {
        await renameNewFolders(path.join(name, 'assets', 'uihub'), name);

        await replaceStringInFiles(name, 'NewLego', name);

        // pubspec.yaml 파일 경로가 정확한지 확인
        await replaceStringInFile(path.join(name, 'pubspec.yaml'), 'assets/uihub/_new/', `assets/uihub/${name}/`);
        await replaceStringInFile(path.join(name, 'pubspec.yaml'), 'name: _new', `name: ${name}`);
        await replaceStringInFile(path.join(name, 'lib/main.dart'), '_new', name);

        await renameNewFolders(path.join(name, 'lib', 'uihub'), name, ['_new', '_new.component', '_new.bottom_sheet', '_new.dialog', '_new.snackbar']);
        await replaceStringInFile(path.join(name, 'README.md'), 'NewUI', name);

        console.log('\nCongratulations! Your project has been created successfully!');
        console.log(`cd ${name} && flutter pub get`);
    } else {
        console.log('Project creation failed.');
    }
}
// 스크립트를 실행하려면, 예시로 createUI('YourProjectName')와 같이 호출
// createUI('YourProjectName').catch(console.error);
