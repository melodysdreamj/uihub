"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUI = getUI;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
const node_util_1 = require("node:util");
// addUI 함수
function getUI(moduleName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 기존 패키지 제거
            yield removeFlutterPackage(moduleName);
            // 새 패키지 추가
            yield addFlutterPackage(moduleName, { devPackage: false });
            // 빌드 작업 수행
            yield buildApp();
        }
        catch (error) {
            console.error(`Error: ${error}`);
        }
    });
}
// 패키지를 제거하는 함수
function removeFlutterPackage(packageName) {
    return __awaiter(this, void 0, void 0, function* () {
        const pubspecPath = path_1.default.join(process.cwd(), 'pubspec.yaml');
        const pubspecContent = fs_1.default.readFileSync(pubspecPath, 'utf8');
        const pubspecYaml = js_yaml_1.default.load(pubspecContent);
        const hasDependency = checkDependencies(pubspecYaml['dependencies'], packageName);
        const hasDevDependency = checkDependencies(pubspecYaml['dev_dependencies'], packageName);
        if (hasDependency || hasDevDependency) {
            // console.log(`Removing ${packageName}...`);
            const result = yield execCommand(`flutter pub remove ${packageName}`);
            if (result.stderr) {
                // console.error(`Error removing package: ${result.stderr}`);
            }
            else {
                // console.log(`${packageName} removed successfully.`);
            }
        }
        else {
            // console.log(`Package '${packageName}' not found in pubspec.yaml.`);
        }
    });
}
const execAsync = (0, node_util_1.promisify)(child_process_1.exec);
function addFlutterPackage(packageName_1) {
    return __awaiter(this, arguments, void 0, function* (packageName, options = { devPackage: false }) {
        const { version, devPackage } = options;
        // pubspec.yaml 파일 로드
        const pubspecFilePath = path_1.default.join(process.cwd(), 'pubspec.yaml');
        const pubspecContent = fs_1.default.readFileSync(pubspecFilePath, 'utf8');
        const pubspec = js_yaml_1.default.load(pubspecContent);
        // dependencies 또는 dev_dependencies에 패키지 존재 여부 확인
        const dependencies = pubspec['dependencies'] || {};
        const devDependencies = pubspec['dev_dependencies'] || {};
        const packageExists = dependencies.hasOwnProperty(packageName) ||
            devDependencies.hasOwnProperty(packageName);
        if (packageExists) {
            // 이미 패키지가 존재하는 경우
            return true;
        }
        // 버전이 유효한지 확인
        const isValidVersion = version && /^\d+(\.\d+)*$/.test(version);
        const packageArgument = isValidVersion ? `${packageName}:^${version}` : packageName;
        // 패키지를 추가하기 위한 명령어 구성
        const command = ['pub', 'add', packageArgument];
        if (devPackage) {
            command.push('--dev');
        }
        try {
            // 패키지 추가 명령 실행
            const result = yield execAsync(`${process.platform === 'win32' ? 'flutter.bat' : 'flutter'} ${command.join(' ')}`, { cwd: process.cwd() });
            if (result.stderr) {
                console.error('Error:', result.stderr);
                return true;
            }
            // 버전이 없거나 dev가 포함되지 않은 경우 버전 제거
            if (!version || version === '' || !version.includes('dev')) {
                // await removePackageVersion(pubspecFilePath, packageName);
            }
            // console.log(`Installed ${packageName} in ${devPackage ? 'dev_dependencies' : 'dependencies'}.`);
        }
        catch (error) {
            console.error('Failed to add package:', error);
            return true;
        }
        // 새로 추가된 패키지로 간주
        return false;
    });
}
// async function removePackageVersion(pubspecFilePath: string, packageName: string) {
//     // 이 함수는 pubspec.yaml에서 특정 패키지의 버전을 제거하는 로직이 구현될 수 있습니다.
//     // 임시 구현으로, 실제로는 pubspec.yaml을 다시 작성해야 합니다.
//     // console.log(`Removed version for ${packageName} in ${pubspecFilePath}`);
// }
// 명령 실행을 비동기 처리하는 함수
function execCommand(command) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                reject({ stdout, stderr });
            }
            else {
                resolve({ stdout, stderr });
            }
        });
    });
}
// 의존성 체크 함수
function checkDependencies(dependencies, packageName) {
    if (!dependencies)
        return false;
    return Object.keys(dependencies).includes(packageName);
}
function buildApp() {
    return __awaiter(this, void 0, void 0, function* () {
        yield addAllModules();
    });
}
function addAllModules() {
    return __awaiter(this, void 0, void 0, function* () {
        // 현재 프로젝트의 모든 패키지를 가져옵니다.
        const projectPath = process.cwd(); // 현재 작업 디렉토리
        const allPackages = yield getAllPackages(projectPath);
        // 각 패키지에 대해 처리합니다.
        for (const packageName of allPackages) {
            // console.log(`Adding ${packageName}...`);
            // 해당 패키지의 버전을 가져옵니다.
            const packageInfo = yield getPackageInfoUsingName(packageName);
            if (!packageInfo) {
                continue;
            }
            // console.log(packageInfo);
            // // 해당 패키지의 경로를 가져옵니다.
            const packagePath = getPackagePath(packageInfo.Name, packageInfo.Version);
            if (!packagePath) {
                continue;
            }
            if (!(yield checkUihubTopicInPubspec(packagePath))) {
                continue;
            }
            // console.log(packagePath);
            // // 패키지 경로를 이용해 추가 작업을 수행합니다.
            yield addPackageCodeUsingPath(packagePath, packageInfo);
        }
    });
}
function checkUihubTopicInPubspec(packagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // pubspec.yaml 파일 경로 설정
            const pubspecPath = path_1.default.join(packagePath, 'pubspec.yaml');
            // pubspec.yaml 파일을 읽습니다.
            const fileContents = fs_1.default.readFileSync(pubspecPath, 'utf8');
            // YAML 파일을 파싱합니다.
            const pubspecYaml = js_yaml_1.default.load(fileContents);
            // topics 섹션이 존재하는지 확인합니다.
            const topics = pubspecYaml['topics'];
            // topics가 배열이고, 그 안에 'uihub'가 있는지 확인합니다.
            if (topics && Array.isArray(topics)) {
                return topics.includes('uihub');
            }
            return false;
        }
        catch (error) {
            // console.error('Error reading pubspec.yaml or parsing topics:', error);
            return false;
        }
    });
}
function getAllPackages(projectPath) {
    return __awaiter(this, void 0, void 0, function* () {
        // pubspec.yaml 파일 경로
        const pubspecYamlPath = path_1.default.join(projectPath, 'pubspec.yaml');
        // pubspec.yaml 파일을 읽습니다.
        const pubspecContent = fs_1.default.readFileSync(pubspecYamlPath, 'utf8');
        // YAML 파싱
        const pubspecYamlMap = js_yaml_1.default.load(pubspecContent);
        // dependencies를 가져옵니다.
        const dependencies = pubspecYamlMap['dependencies'];
        // 패키지 이름 목록 반환
        return Object.keys(dependencies || {});
    });
}
function addPackageCodeUsingPath(packagePath, packageInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        // 해당 패키지명 가져오기
        const packageName = packageInfo.Name;
        // 패키지의 assets와 lib 디렉터리 경로 설정
        const assetsSourcePath = path_1.default.join(packagePath, 'assets', 'uihub', packageName);
        const libSourcePath = path_1.default.join(packagePath, 'lib', 'uihub', packageName);
        // 현재 프로젝트의 목적 경로 설정
        const projectAssetsTargetPath = path_1.default.join(process.cwd(), 'assets', 'uihub', packageName);
        const projectLibTargetPath = path_1.default.join(process.cwd(), 'lib', 'uihub', packageName);
        // assets 파일 복사
        var isExistAssetFiles = yield copyDirectory(assetsSourcePath, projectAssetsTargetPath);
        // lib 파일 복사
        yield copyDirectory(libSourcePath, projectLibTargetPath);
        if (isExistAssetFiles) {
            yield addAssetPaths([`assets/uihub/${packageName}/`]);
        }
    });
}
// 디렉터리의 모든 파일을 복사하는 함수
function copyDirectory(sourceDir, targetDir) {
    return __awaiter(this, void 0, void 0, function* () {
        let filesCopied = false; // 파일이 복사되었는지 여부를 추적
        try {
            // 소스 디렉터리가 존재하는지 확인
            if (!fs_1.default.existsSync(sourceDir)) {
                // console.log(`Source directory ${sourceDir} does not exist. Skipping...`);
                return filesCopied;
            }
            // withFileTypes 옵션을 사용하여 디렉토리 항목 읽기
            const entries = fs_1.default.readdirSync(sourceDir, { withFileTypes: true });
            // 소스 디렉토리에 파일이나 디렉터리가 없는 경우 넘어감
            if (entries.length === 0) {
                // console.log(`Source directory ${sourceDir} is empty. Skipping...`);
                return filesCopied;
            }
            // 타겟 디렉터리가 존재하지 않으면 생성
            fs_1.default.mkdirSync(targetDir, { recursive: true });
            for (const entry of entries) {
                const sourcePath = path_1.default.join(sourceDir, entry.name);
                const targetPath = path_1.default.join(targetDir, entry.name);
                if (entry.isDirectory()) {
                    // 하위 디렉터리를 재귀적으로 복사
                    const result = yield copyDirectory(sourcePath, targetPath);
                    if (result) {
                        filesCopied = true;
                    }
                }
                else if (entry.isFile()) {
                    // 파일을 복사
                    fs_1.default.copyFileSync(sourcePath, targetPath);
                    filesCopied = true; // 파일이 복사되었음을 기록
                }
            }
        }
        catch (error) {
            console.error(`Error copying directory from ${sourceDir} to ${targetDir}:`, error);
        }
        return filesCopied;
    });
}
function addAssetPaths(newPaths) {
    return __awaiter(this, void 0, void 0, function* () {
        const filePath = 'pubspec.yaml';
        try {
            // 파일 존재 여부 확인 (동기 방식)
            const fileExists = (() => {
                try {
                    fs_1.default.statSync(filePath);
                    return true;
                }
                catch (_a) {
                    return false;
                }
            })();
            if (!fileExists) {
                console.error('pubspec.yaml file not found.');
                return;
            }
            // 파일 내용 읽기
            const contents = fs_1.default.readFileSync(filePath, 'utf8');
            const lines = contents.split(/\r?\n/);
            // 'flutter:' 섹션 찾기
            const flutterSectionIndex = lines.findIndex((line) => line.startsWith('flutter:'));
            if (flutterSectionIndex !== -1) {
                // 'assets:' 섹션 찾기
                let assetsIndex = lines.findIndex((line, index) => line.trim() === 'assets:' && index > flutterSectionIndex);
                // 'assets:' 섹션이 없고 새로운 경로가 있는 경우 섹션 추가
                if (assetsIndex === -1 && newPaths.length > 0) {
                    lines.splice(flutterSectionIndex + 1, 0, '  assets:');
                    assetsIndex = flutterSectionIndex + 1;
                }
                // 새로운 경로 추가
                for (const newPath of newPaths) {
                    let pathExists = false;
                    // 이미 'assets:' 섹션에 경로가 존재하는지 확인
                    for (let i = assetsIndex + 1; i < lines.length && lines[i].startsWith('    -'); i++) {
                        if (lines[i].trim() === `- ${newPath}`) {
                            pathExists = true;
                            break;
                        }
                    }
                    // 경로가 존재하지 않는 경우 추가
                    if (!pathExists && assetsIndex !== -1) {
                        lines.splice(assetsIndex + 1, 0, `    - ${newPath}`);
                        // console.log(`Added asset path: ${newPath}`);
                    }
                    else if (pathExists) {
                        // console.log(`Asset path already exists and was not added: ${newPath}`);
                    }
                }
                // 파일 쓰기
                if (newPaths.length > 0) {
                    fs_1.default.writeFileSync(filePath, lines.join(os_1.default.EOL), 'utf8');
                    // console.log('Asset paths processing completed.');
                }
                else if (assetsIndex === -1) {
                    // console.log('No new asset paths to add and no existing "assets:" section to update.');
                }
            }
            else {
                // console.error('Flutter section not found in pubspec.yaml');
            }
        }
        catch (error) {
            // console.error('Error processing pubspec.yaml:', error);
        }
    });
}
function getPackageInfoUsingName(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // pubspec.lock 파일 읽기
            const lockFilePath = 'pubspec.lock';
            const content = fs_1.default.readFileSync(lockFilePath, 'utf8');
            const yamlContent = js_yaml_1.default.load(content);
            // 패키지 목록 추출
            const dependencies = yamlContent['packages'];
            // 주어진 패키지 이름으로 패키지 정보 검색
            if (dependencies[name]) {
                return {
                    Name: name,
                    Version: dependencies[name].version
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error reading pubspec.lock:', error);
            return null;
        }
    });
}
function getPackagePath(packageName, packageVersion) {
    // 환경 변수에서 홈 디렉토리 경로 가져오기
    const homePath = os_1.default.platform() === 'win32'
        ? process.env['LOCALAPPDATA'] // Windows의 경우 LOCALAPPDATA 사용
        : process.env['HOME'] || process.env['USERPROFILE']; // Mac/Linux의 경우 HOME 또는 USERPROFILE 사용
    // 현재 위치 출력
    // console.log(`Current directory: ${process.cwd()}`);
    // 아니 이거 말고 이 npm의 위치
    // console.log(`Current directory: ${process.execPath}`);
    if (!homePath) {
        console.error('Cannot find user home directory');
        return null;
    }
    // .pub-cache 경로 옵션 설정
    const pubCachePath = os_1.default.platform() === 'win32'
        ? path_1.default.join(homePath, 'Pub', 'Cache', 'hosted') // Windows의 경우 Pub\Cache 경로 사용
        : path_1.default.join(homePath, '.pub-cache', 'hosted'); // Mac/Linux의 경우 .pub-cache 사용
    const pubDevPath = path_1.default.join(pubCachePath, 'pub.dev');
    const pubDartlangOrgPath = path_1.default.join(pubCachePath, 'pub.dartlang.org');
    // 존재하는 .pub-cache 호스팅 경로 확인
    let packageHostedPath = null;
    if (fs_1.default.existsSync(pubDevPath)) {
        packageHostedPath = pubDevPath;
    }
    else if (fs_1.default.existsSync(pubDartlangOrgPath)) {
        packageHostedPath = pubDartlangOrgPath;
    }
    if (!packageHostedPath) {
        // console.error('No valid .pub-cache hosted path found');
        return null;
    }
    // 패키지 경로 생성
    return path_1.default.join(packageHostedPath, `${packageName}-${packageVersion}`);
}
