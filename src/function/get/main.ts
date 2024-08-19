import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { exec } from 'child_process';
import os from 'os';
import {promisify} from "node:util";


// addUI 함수
export async function getUI(moduleName: string): Promise<void> {
    try {
        // 기존 패키지 제거
        await removeFlutterPackage(moduleName);

        // 새 패키지 추가
        await addFlutterPackage(moduleName, { devPackage: false });

        // 빌드 작업 수행
        await buildApp();
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

// 패키지를 제거하는 함수
async function removeFlutterPackage(packageName: string): Promise<void> {
    const pubspecPath = path.join(process.cwd(), 'pubspec.yaml');
    const pubspecContent = fs.readFileSync(pubspecPath, 'utf8');
    const pubspecYaml = yaml.load(pubspecContent) as any;

    const hasDependency = checkDependencies(pubspecYaml['dependencies'], packageName);
    const hasDevDependency = checkDependencies(pubspecYaml['dev_dependencies'], packageName);

    if (hasDependency || hasDevDependency) {
        console.log(`Removing ${packageName}...`);
        const result = await execCommand(`flutter pub remove ${packageName}`);
        if (result.stderr) {
            console.error(`Error removing package: ${result.stderr}`);
        } else {
            console.log(`${packageName} removed successfully.`);
        }
    } else {
        console.log(`Package '${packageName}' not found in pubspec.yaml.`);
    }
}

const execAsync = promisify(exec);

async function addFlutterPackage(
    packageName: string,
    options: { version?: string; devPackage?: boolean } = { devPackage: false }
): Promise<boolean> {
    const { version, devPackage } = options;

    // pubspec.yaml 파일 로드
    const pubspecFilePath = path.join(process.cwd(), 'pubspec.yaml');
    const pubspecContent = fs.readFileSync(pubspecFilePath, 'utf8');
    const pubspec = yaml.load(pubspecContent) as Record<string, any>;

    // dependencies 또는 dev_dependencies에 패키지 존재 여부 확인
    const dependencies = pubspec['dependencies'] || {};
    const devDependencies = pubspec['dev_dependencies'] || {};
    const packageExists =
        dependencies.hasOwnProperty(packageName) ||
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
        const result = await execAsync(
            `${process.platform === 'win32' ? 'flutter.bat' : 'flutter'} ${command.join(' ')}`,
            { cwd: process.cwd() }
        );

        if (result.stderr) {
            console.error('Error:', result.stderr);
            return true;
        }

        // 버전이 없거나 dev가 포함되지 않은 경우 버전 제거
        if (!version || version === '' || !version.includes('dev')) {
            await removePackageVersion(pubspecFilePath, packageName);
        }

        console.log(`Installed ${packageName} in ${devPackage ? 'dev_dependencies' : 'dependencies'}.`);

    } catch (error) {
        console.error('Failed to add package:', error);
        return true;
    }

    // 새로 추가된 패키지로 간주
    return false;
}

async function removePackageVersion(pubspecFilePath: string, packageName: string) {
    // 이 함수는 pubspec.yaml에서 특정 패키지의 버전을 제거하는 로직이 구현될 수 있습니다.
    // 임시 구현으로, 실제로는 pubspec.yaml을 다시 작성해야 합니다.
    console.log(`Removed version for ${packageName} in ${pubspecFilePath}`);
}

// 명령 실행을 비동기 처리하는 함수
function execCommand(command: string): Promise<{ stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({ stdout, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

// 의존성 체크 함수
function checkDependencies(dependencies: any, packageName: string): boolean {
    if (!dependencies) return false;
    return Object.keys(dependencies).includes(packageName);
}


async function buildApp() {
    await addAllModules();
}


async function addAllModules(): Promise<void> {
    // 현재 프로젝트의 모든 패키지를 가져옵니다.
    const projectPath = process.cwd(); // 현재 작업 디렉토리
    const allPackages = await getAllPackages(projectPath);

    // 각 패키지에 대해 처리합니다.
    for (const packageName of allPackages) {

        console.log(`Adding ${packageName}...`);

        // 해당 패키지의 버전을 가져옵니다.
        const packageInfo = await getPackageInfoUsingName(packageName);
        if (!packageInfo) {
            continue;
        }

        console.log(packageInfo);

        // // 해당 패키지의 경로를 가져옵니다.
        const packagePath = getPackagePath(packageInfo.Name, packageInfo.Version);
        if (!packagePath) {
            continue;
        }

        if(!await checkUihubTopicInPubspec(packagePath)){
            continue;
        }

        console.log(packagePath);

        // // 패키지 경로를 이용해 추가 작업을 수행합니다.
        await addPackageCodeUsingPath(packagePath, packageInfo);
    }
}

async function checkUihubTopicInPubspec(packagePath: string): Promise<boolean> {
    try {
        // pubspec.yaml 파일 경로 설정
        const pubspecPath = path.join(packagePath, 'pubspec.yaml');

        // pubspec.yaml 파일을 읽습니다.
        const fileContents = fs.readFileSync(pubspecPath, 'utf8');

        // YAML 파일을 파싱합니다.
        const pubspecYaml = yaml.load(fileContents) as Record<string, any>;

        // topics 섹션이 존재하는지 확인합니다.
        const topics = pubspecYaml['topics'] as string[] | undefined;

        // topics가 배열이고, 그 안에 'uihub'가 있는지 확인합니다.
        if (topics && Array.isArray(topics)) {
            return topics.includes('uihub');
        }

        return false;
    } catch (error) {
        console.error('Error reading pubspec.yaml or parsing topics:', error);
        return false;
    }
}

async function getAllPackages(projectPath: string): Promise<string[]> {
    // pubspec.yaml 파일 경로
    const pubspecYamlPath = path.join(projectPath, 'pubspec.yaml');

    // pubspec.yaml 파일을 읽습니다.
    const pubspecContent = fs.readFileSync(pubspecYamlPath, 'utf8');

    // YAML 파싱
    const pubspecYamlMap = yaml.load(pubspecContent) as Record<string, any>;

    // dependencies를 가져옵니다.
    const dependencies = pubspecYamlMap['dependencies'] as Record<string, any>;

    // 패키지 이름 목록 반환
    return Object.keys(dependencies || {});
}

async function addPackageCodeUsingPath(packagePath: string, packageInfo: PackageInfo): Promise<void> {
    // 해당 패키지명 가져오기
    const packageName = packageInfo.Name;

    // 패키지의 assets와 lib 디렉터리 경로 설정
    const assetsSourcePath = path.join(packagePath, 'assets', 'uihub', packageName);
    const libSourcePath = path.join(packagePath, 'lib', 'uihub', packageName);

    // 현재 프로젝트의 목적 경로 설정
    const projectAssetsTargetPath = path.join(process.cwd(), 'assets', 'uihub', packageName);
    const projectLibTargetPath = path.join(process.cwd(), 'lib', 'uihub', packageName);

    // assets 파일 복사
    var isExistAssetFiles = await copyDirectory(assetsSourcePath, projectAssetsTargetPath);

    // lib 파일 복사
    await copyDirectory(libSourcePath, projectLibTargetPath);

    if(isExistAssetFiles){
        await addAssetPaths([`assets/uihub/${packageName}/`]);
    }
}

// 디렉터리의 모든 파일을 복사하는 함수
async function copyDirectory(sourceDir: string, targetDir: string): Promise<boolean> {
    let filesCopied = false; // 파일이 복사되었는지 여부를 추적

    try {
        // 타겟 디렉터리가 존재하지 않으면 생성
        fs.mkdirSync(targetDir, { recursive: true });

        // withFileTypes 옵션을 사용하여 디렉토리 항목 읽기
        const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(sourceDir, entry.name);
            const targetPath = path.join(targetDir, entry.name);

            if (entry.isDirectory()) {
                // 하위 디렉터리를 재귀적으로 복사
                const result = await copyDirectory(sourcePath, targetPath);
                if (result) {
                    filesCopied = true;
                }
            } else if (entry.isFile()) {
                // 파일을 복사
                fs.copyFileSync(sourcePath, targetPath);
                filesCopied = true; // 파일이 복사되었음을 기록
            }
        }
    } catch (error) {
        console.error(`Error copying directory from ${sourceDir} to ${targetDir}:`, error);
    }

    return filesCopied;
}




async function addAssetPaths(newPaths: string[]): Promise<void> {
    const filePath = 'pubspec.yaml';

    try {
        // 파일 존재 여부 확인 (동기 방식)
        const fileExists = (() => {
            try {
                fs.statSync(filePath);
                return true;
            } catch {
                return false;
            }
        })();

        if (!fileExists) {
            console.error('pubspec.yaml file not found.');
            return;
        }

        // 파일 내용 읽기
        const contents = fs.readFileSync(filePath, 'utf8');
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
                    console.log(`Added asset path: ${newPath}`);
                } else if (pathExists) {
                    console.log(`Asset path already exists and was not added: ${newPath}`);
                }
            }

            // 파일 쓰기
            if (newPaths.length > 0) {
                fs.writeFileSync(filePath, lines.join(os.EOL), 'utf8');
                console.log('Asset paths processing completed.');
            } else if (assetsIndex === -1) {
                console.log('No new asset paths to add and no existing "assets:" section to update.');
            }
        } else {
            console.error('Flutter section not found in pubspec.yaml');
        }
    } catch (error) {
        console.error('Error processing pubspec.yaml:', error);
    }
}


// async function addPackageUsingPath(packagePath: string): Promise<string[]> {
//     const resultPaths: string[] = [];
//
//     // 패키지 정보 가져오기
//     const packagesInfo = await getNeedAddPackagesUsingPath(packagePath);
//
//     // 일반 패키지 처리
//     for (let packageInfo of packagesInfo) {
//         const isExistBefore = await addFlutterPackage(packageInfo.Name, {
//             version: packageInfo.Version,
//             devPackage: false
//         });
//
//         // 패키지 정보 갱신
//         const renewPackageInfo = await getPackageInfoUsingName(packageInfo.Name);
//         if (!renewPackageInfo) continue;
//
//         packageInfo = renewPackageInfo;
//
//         const _packagePath = getPackagePath(packageInfo.Name, packageInfo.Version);
//         if (!_packagePath || isExistBefore) continue;
//
//         // 패키지 경로를 결과 리스트에 추가
//         resultPaths.push(_packagePath);
//
//         // 추가적으로 패키지 경로를 통해 재귀적으로 처리할 경로들 추가
//         const childPaths = await addPackageUsingPath(_packagePath);
//         resultPaths.push(...childPaths);
//     }
//
//     return resultPaths;
// }

interface PackageInfo {
    Name: string;
    Version: string;
}

async function getPackageInfoUsingName(name: string): Promise<PackageInfo | null> {
    try {
        // pubspec.lock 파일 읽기
        const lockFilePath = 'pubspec.lock';
        const content = fs.readFileSync(lockFilePath, 'utf8');
        const yamlContent = yaml.load(content) as Record<string, any>;

        // 패키지 목록 추출
        const dependencies = yamlContent['packages'] as Record<string, any>;

        // 주어진 패키지 이름으로 패키지 정보 검색
        if (dependencies[name]) {
            return {
                Name: name,
                Version: dependencies[name].version
            };
        }

        return null;
    } catch (error) {
        console.error('Error reading pubspec.lock:', error);
        return null;
    }
}

function getPackagePath(packageName: string, packageVersion: string): string | null {
    // 환경 변수에서 홈 디렉토리 경로 가져오기
    const homePath = os.platform() === 'win32'
        ? process.env['LOCALAPPDATA'] // Windows의 경우 LOCALAPPDATA 사용
        : process.env['HOME'] || process.env['USERPROFILE']; // Mac/Linux의 경우 HOME 또는 USERPROFILE 사용

    if (!homePath) {
        console.error('Cannot find user home directory');
        return null;
    }

    // .pub-cache 경로 옵션 설정
    const pubCachePath = os.platform() === 'win32'
        ? path.join(homePath, 'Pub', 'Cache', 'hosted') // Windows의 경우 Pub\Cache 경로 사용
        : path.join(homePath, '.pub-cache', 'hosted'); // Mac/Linux의 경우 .pub-cache 사용

    const pubDevPath = path.join(pubCachePath, 'pub.dev');
    const pubDartlangOrgPath = path.join(pubCachePath, 'pub.dartlang.org');

    // 존재하는 .pub-cache 호스팅 경로 확인
    let packageHostedPath: string | null = null;
    if (fs.existsSync(pubDevPath)) {
        packageHostedPath = pubDevPath;
    } else if (fs.existsSync(pubDartlangOrgPath)) {
        packageHostedPath = pubDartlangOrgPath;
    }

    if (!packageHostedPath) {
        console.error('No valid .pub-cache hosted path found');
        return null;
    }

    // 패키지 경로 생성
    return path.join(packageHostedPath, `${packageName}-${packageVersion}`);
}