import { spawn } from 'child_process';
import { once } from 'events';

interface RunCommandParams {
  readonly command: readonly [string, ...string[]];
  readonly workingDirectoryPath: string;
}

export async function runCommand({ command, workingDirectoryPath }: RunCommandParams): Promise<void> {
  const [executable, ...commandArguments] = command;
  const commandChild = spawn(executable, commandArguments, { cwd: workingDirectoryPath, stdio: 'inherit' });
  await once(commandChild, 'exit');
  if (commandChild.exitCode !== 0) {
    throw new Error(`${command.join(' ')} exited with ${commandChild.exitCode ?? commandChild.signalCode}`);
  }
}
