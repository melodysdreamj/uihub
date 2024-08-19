"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUI = createUI;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path = __importStar(require("path"));
// Git 클론 및 .git 폴더 제거
function cloneAndRemoveGit(repoUrl, branchName, targetDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            (0, child_process_1.exec)(`git clone -b ${branchName} ${repoUrl} ${targetDirectory}`, (error, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                if (error) {
                    console.error(`Failed to clone Git: ${stderr}`);
                    resolve(false);
                    return;
                }
                const gitDir = path.join(targetDirectory, '.git');
                try {
                    if (yield fs_1.promises.stat(gitDir)) {
                        yield fs_1.promises.rm(gitDir, { recursive: true });
                        // console.log('.git folder has been successfully removed.');
                    }
                }
                catch (err) {
                    if (err instanceof Error) {
                        console.log(`.git folder does not exist: ${err.message}`);
                    }
                    else {
                        console.log('.git folder does not exist.');
                    }
                }
                resolve(true);
            }));
        });
    });
}
// 파일 내 문자열 치환
function replaceStringInFiles(directoryPath, originalString, replacementString) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        try {
            const directory = yield fs_1.promises.opendir(directoryPath);
            try {
                for (var _d = true, directory_1 = __asyncValues(directory), directory_1_1; directory_1_1 = yield directory_1.next(), _a = directory_1_1.done, !_a; _d = true) {
                    _c = directory_1_1.value;
                    _d = false;
                    const dirent = _c;
                    const fullPath = path.join(directoryPath, dirent.name);
                    if (dirent.isFile()) {
                        try {
                            const fileContent = yield fs_1.promises.readFile(fullPath, 'utf8');
                            if (fileContent.includes(originalString)) {
                                const modifiedContent = fileContent.replace(new RegExp(originalString, 'g'), replacementString);
                                yield fs_1.promises.writeFile(fullPath, modifiedContent, 'utf8');
                                // console.log(`Replaced in ${fullPath}`);
                            }
                        }
                        catch (error) {
                            if (error instanceof Error) {
                                console.error(`Skipping ${fullPath}, error reading file: ${error.message}`);
                            }
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = directory_1.return)) yield _b.call(directory_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`An exception occurred: ${error.message}`);
            }
        }
    });
}
// 특정 파일에서 문자열 치환
function replaceStringInFile(filePath, originalString, replacementString) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 파일 경로를 디버깅 위해 출력
            // console.log(`Modifying file: ${filePath}`);
            // 파일 읽기
            const fileContent = yield fs_1.promises.readFile(filePath, 'utf8');
            // 원본 문자열이 파일에 존재하는지 확인
            if (!fileContent.includes(originalString)) {
                // console.log(`Original string not found in ${filePath}`);
            }
            // 문자열 치환
            const modifiedContent = fileContent.replace(new RegExp(originalString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replacementString);
            // 수정된 내용 파일에 쓰기
            yield fs_1.promises.writeFile(filePath, modifiedContent, 'utf8');
            // console.log(`Replaced in ${filePath}`);
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`Failed to update file ${filePath}: ${error.message}`);
            }
        }
    });
}
// 폴더 이름 변경
function renameNewFolders(directoryPath, newName, checkDirName) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_2, _b, _c;
        try {
            const directory = yield fs_1.promises.opendir(directoryPath);
            const directoriesToRename = [];
            try {
                for (var _d = true, directory_2 = __asyncValues(directory), directory_2_1; directory_2_1 = yield directory_2.next(), _a = directory_2_1.done, !_a; _d = true) {
                    _c = directory_2_1.value;
                    _d = false;
                    const dirent = _c;
                    if (dirent.isDirectory()) {
                        const dirName = dirent.name;
                        const fullPath = path.join(directoryPath, dirName);
                        if (dirName === '_new' || (checkDirName && (checkDirName.includes(dirName) || dirName.startsWith('_new.')))) {
                            directoriesToRename.push(fullPath);
                        }
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = directory_2.return)) yield _b.call(directory_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            for (const dir of directoriesToRename) {
                const dirName = path.basename(dir);
                let newPath = dir;
                if (dirName === '_new') {
                    newPath = dir.replace(/_new$/, newName);
                }
                else if (dirName.startsWith('_new.')) {
                    newPath = dir.replace(/_new/, newName);
                }
                else if (checkDirName && checkDirName.includes(dirName)) {
                    newPath = dir.replace(new RegExp(`${dirName}$`), newName);
                }
                try {
                    yield fs_1.promises.rename(dir, newPath);
                    // console.log(`Renamed ${dir} to ${newPath}`);
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.error(`Failed to rename directory: ${error.message}`);
                    }
                }
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`An exception occurred: ${error.message}`);
            }
        }
    });
}
// 프로젝트 생성 메인 함수
function createUI(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const repoUrl = 'https://github.com/melodysdreamj/uihub.git';
        const branchName = 'template';
        let successClone = yield cloneAndRemoveGit(repoUrl, branchName, name);
        if (successClone) {
            yield renameNewFolders(path.join(name, 'assets', 'uihub'), name);
            yield replaceStringInFiles(name, 'NewLego', name);
            // pubspec.yaml 파일 경로가 정확한지 확인
            yield replaceStringInFile(path.join(name, 'pubspec.yaml'), 'assets/uihub/_new/', `assets/uihub/${name}/`);
            yield replaceStringInFile(path.join(name, 'pubspec.yaml'), 'name: _new', `name: ${name}`);
            yield replaceStringInFile(path.join(name, 'lib/main.dart'), '_new', name);
            yield renameNewFolders(path.join(name, 'lib', 'uihub'), name, ['_new', '_new.component', '_new.bottom_sheet', '_new.dialog', '_new.snackbar']);
            yield replaceStringInFile(path.join(name, 'README.md'), 'NewUI', name);
            console.log('\nCongratulations! Your project has been created successfully!');
            console.log(`cd ${name} && flutter pub get`);
        }
        else {
            console.log('Project creation failed.');
        }
    });
}
// 스크립트를 실행하려면, 예시로 createUI('YourProjectName')와 같이 호출
// createUI('YourProjectName').catch(console.error);
