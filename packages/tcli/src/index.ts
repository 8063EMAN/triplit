import { bold } from 'ansis/colors';
import React from 'react';
import { render } from 'ink';
import {
  findCommands,
  CommandTree,
  CommandInfo,
  isCommandInfo,
  getCommandDefinition,
  getCommandsWithDefinition,
} from './command-utils';
import minimist from 'minimist';
import { fileURLToPath } from 'node:url';

const argv = minimist(process.argv.slice(2), { stopEarly: false });

const { _: args, ...flags } = argv;

await execute(args, flags);

async function execute(args: string[], flags: {}) {
  const commands = findCommands(
    fileURLToPath(new URL('.', import.meta.url)) + '/commands'
  );

  let command: CommandTree | CommandInfo = commands;

  let i: number;
  for (i = 0; i < argv._.length; i++) {
    const part: string = argv._[i];
    if (isCommandInfo(command) || !command[part]) {
      break;
    }
    command = command[part];
  }

  const commandArgs = args.slice(i);

  if (!isCommandInfo(command)) {
    if (commandArgs.length > 0) {
      console.error('Could not find command: ' + args.join(' '));
    }

    await printHelp(i === 0 ? 'triplit' : args.slice(0, i).join(' '), command);
    return;
  }
  const cmdDef = await getCommandDefinition(command);
  const result = await cmdDef.run({ flags, args: commandArgs });
  if (React.isValidElement(result)) {
    render(result, { patchConsole: false });
  }
}

async function printHelp(name: string, commands: CommandTree) {
  console.log(`Available commands for ${bold(name)}`);
  const commandDefs = await getCommandsWithDefinition(commands, []);
  console.log(
    commandDefs
      .map((cmd) => `  ${bold(cmd.name)} - ${cmd.description}`)
      .join('\n')
  );
}