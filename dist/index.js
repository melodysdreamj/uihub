#!/usr/bin/env node
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
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const main_1 = require("./function/create/main");
const main_2 = require("./function/get/main");
const program = new commander_1.Command();
program
    .name('uihub')
    .description('CLI tool for managing uihub')
    .version('1.0.0');
program
    .command('create <name>')
    .description('Create a new ui')
    .action((name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, main_1.createUI)(`uihub_${name}`); // 비동기 함수 호출
    }
    catch (error) {
        console.error(`Error: ${error}`);
    }
}));
program
    .command('get <name>')
    .description('Get a ui')
    .action((name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, main_2.getUI)(name); // 비동기 함수 호출
    }
    catch (error) {
        console.error(`Error: ${error}`);
    }
}));
program.parse(process.argv);
