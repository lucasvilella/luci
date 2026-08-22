/**
 * SystemLauncher — OS Automation Skill
 *
 * Handles opening local software, applications, and system utilities on Windows.
 * E.g. "Abra o VS Code", "Abra o navegador", "Abra a calculadora", "Abra o bloco de notas".
 */

import { exec } from 'child_process';

export interface SystemLaunchResult {
  handled: boolean;
  message?: string;
}

export class SystemLauncher {
  /**
   * Checks if user input is an app launch request and executes it if matched.
   */
  async handleLaunch(userInput: string): Promise<SystemLaunchResult> {
    const clean = userInput.toLowerCase().trim();

    if (!clean.startsWith('abra') && !clean.startsWith('abrir') && !clean.startsWith('iniciar') && !clean.startsWith('abrir o')) {
      return { handled: false };
    }

    let commandToRun: string | null = null;
    let appName = '';

    if (clean.includes('code') || clean.includes('vs code') || clean.includes('vscode')) {
      commandToRun = 'start code';
      appName = 'VS Code';
    } else if (clean.includes('navegador') || clean.includes('chrome') || clean.includes('edge') || clean.includes('browser')) {
      commandToRun = 'start https://google.com';
      appName = 'Navegador Web';
    } else if (clean.includes('bloco de notas') || clean.includes('notepad')) {
      commandToRun = 'start notepad';
      appName = 'Bloco de Notas';
    } else if (clean.includes('calculadora') || clean.includes('calc')) {
      commandToRun = 'start calc';
      appName = 'Calculadora';
    } else if (clean.includes('spotify')) {
      commandToRun = 'start spotify';
      appName = 'Spotify';
    } else if (clean.includes('explorer') || clean.includes('arquivos') || clean.includes('pasta')) {
      commandToRun = 'start explorer';
      appName = 'Explorador de Arquivos';
    }

    if (!commandToRun) {
      return { handled: false };
    }

    console.log(`[SystemLauncher] Executing command: "${commandToRun}" for ${appName}`);
    
    return new Promise((resolve) => {
      exec(commandToRun!, (error) => {
        if (error) {
          console.error(`[SystemLauncher] Failed to launch ${appName}:`, error);
          resolve({
            handled: true,
            message: `Não foi possível abrir o ${appName}. Verifique se ele está instalado.`
          });
        } else {
          console.log(`[SystemLauncher] Successfully launched ${appName}`);
          resolve({
            handled: true,
            message: `${appName} aberto com sucesso!`
          });
        }
      });
    });
  }
}
