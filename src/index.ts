#!/usr/bin/env node

import { Command } from 'commander';
import {createUI} from "./function/create/main";
import {getUI} from "./function/get/main";





const program = new Command();

program
    .name('uihub')
    .description('CLI tool for managing uihub')
    .version('1.0.0');

program
    .command('create <name>')
    .description('Create a new ui')
    .action(async (name: string) => {
        try {
            await createUI(`${name}_ui`); // 비동기 함수 호출
        } catch (error) {
            console.error(`Error: ${error}`);
        }
    });

program
    .command('get <name>')
    .description('Get a ui')
    .action(async (name: string) => {
        try {
            await getUI(name); // 비동기 함수 호출
        } catch (error) {
            console.error(`Error: ${error}`);
        }
    });

program.parse(process.argv);
