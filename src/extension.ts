import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

interface SnowConfig {
  areas: string[];
  flakeCount: number;
  speed: number;
  opacity: number;
  wind: number;
  color: string;
  cursorInteraction: boolean;
  cursorRadius: number;
  cursorStrength: number;
}

function generateSnowJS(config: SnowConfig): string {
  const areaSelectors: Record<string, string> = {
    'editor': '.editor-container',
    'sidebar': '.sidebar',
    'panel': '.panel',
    'activitybar': '.activitybar',
    'fullscreen': '.monaco-workbench'
  };

  const selectors = config.areas.map(a => areaSelectors[a] || areaSelectors['fullscreen']);

  return `
/* SNOW-BACKGROUND-START */
(function() {
  const CONFIG = {
    flakeCount: ${config.flakeCount},
    baseSpeed: ${config.speed},
    maxOpacity: ${config.opacity},
    wind: ${config.wind},
    color: '${config.color}',
    selectors: ${JSON.stringify(selectors)},
    cursorInteraction: ${config.cursorInteraction},
    repulsionRadius: ${config.cursorRadius},
    repulsionStrength: ${config.cursorStrength}
  };

  const Doc = {
    canvases: new Map(),
    animationFrames: new Map(),
    mouseX: -1000,
    mouseY: -1000
  };

  // Track global mouse position
  if (CONFIG.cursorInteraction) {
    document.addEventListener('mousemove', (e) => {
      Doc.mouseX = e.clientX;
      Doc.mouseY = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
      Doc.mouseX = -1000;
      Doc.mouseY = -1000;
    });
  }

  function createFlake(canvas) {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * -50,
      radius: Math.random() * 3 + 1,
      speed: Math.random() * CONFIG.baseSpeed + CONFIG.baseSpeed * 0.5,
      opacity: Math.random() * CONFIG.maxOpacity + 0.1,
      wind: CONFIG.wind + (Math.random() - 0.5) * 0.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
      // Velocity for smoother repulsion
      vx: 0,
      vy: 0
    };
  }

  function createSnowCanvas(container) {
    const containerId = container.dataset.snowId || (container.dataset.snowId = Math.random().toString(36).substr(2, 9));

    // Clean up existing canvas for this container
    if (Doc.canvases.has(containerId)) {
      const oldCanvas = Doc.canvases.get(containerId);
      if (oldCanvas && oldCanvas.parentNode) {
        oldCanvas.remove();
      }
      if (Doc.animationFrames.has(containerId)) {
        cancelAnimationFrame(Doc.animationFrames.get(containerId));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'snow-canvas';
    canvas.dataset.containerId = containerId;
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width;
    canvas.height = rect.height;

    const computedStyle = window.getComputedStyle(container);
    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }
    container.appendChild(canvas);
    Doc.canvases.set(containerId, canvas);

    const ctx = canvas.getContext('2d');
    let flakes = [];

    const flakeCount = Math.max(15, Math.floor(CONFIG.flakeCount * (rect.width * rect.height) / (1920 * 1080)));
    for (let i = 0; i < flakeCount; i++) {
      const flake = createFlake(canvas);
      flake.y = Math.random() * canvas.height;
      flakes.push(flake);
    }

    let isRunning = true;

    function animate() {
      if (!isRunning || !document.body.contains(canvas)) {
        Doc.canvases.delete(containerId);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get canvas position for mouse coordinate conversion
      const canvasRect = canvas.getBoundingClientRect();
      const localMouseX = Doc.mouseX - canvasRect.left;
      const localMouseY = Doc.mouseY - canvasRect.top;

      flakes.forEach(flake => {
        // Update wobble for gentle swaying motion
        flake.wobble += flake.wobbleSpeed;
        const wobbleOffset = Math.sin(flake.wobble) * 0.5;

        // Mouse repulsion
        if (CONFIG.cursorInteraction) {
          const dx = flake.x - localMouseX;
          const dy = flake.y - localMouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONFIG.repulsionRadius && distance > 0) {
            const force = (1 - distance / CONFIG.repulsionRadius) * CONFIG.repulsionStrength;
            flake.vx += (dx / distance) * force;
            flake.vy += (dy / distance) * force;
          }

          // Apply velocity with damping
          flake.x += flake.vx;
          flake.y += flake.vy;
          flake.vx *= 0.92;
          flake.vy *= 0.92;
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + CONFIG.color + ', ' + flake.opacity + ')';
        ctx.fill();

        flake.y += flake.speed;
        flake.x += flake.wind + wobbleOffset;

        if (flake.y > canvas.height) {
          Object.assign(flake, createFlake(canvas));
        }
        if (flake.x > canvas.width) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = canvas.width;
        }
      });

      Doc.animationFrames.set(containerId, requestAnimationFrame(animate));
    }
    animate();

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newRect = entry.contentRect;
        if (newRect.width > 0 && newRect.height > 0) {
          canvas.width = newRect.width;
          canvas.height = newRect.height;
        }
      }
    });
    resizeObserver.observe(container);

    canvas._cleanup = () => {
      isRunning = false;
      resizeObserver.disconnect();
      if (Doc.animationFrames.has(containerId)) {
        cancelAnimationFrame(Doc.animationFrames.get(containerId));
      }
    };
  }

  function initSnow() {
    CONFIG.selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.querySelector('.snow-canvas')) {
          createSnowCanvas(el);
        }
      });
    });
  }

  function cleanupOrphanedCanvases() {
    document.querySelectorAll('.snow-canvas').forEach(canvas => {
      if (!document.body.contains(canvas.parentNode)) {
        if (canvas._cleanup) canvas._cleanup();
        canvas.remove();
      }
    });
  }

  // Initial setup with delay to ensure VS Code is fully loaded
  setTimeout(initSnow, 1500);

  // Periodically check and reinitialize (handles tab switching, panel toggles, etc.)
  setInterval(() => {
    cleanupOrphanedCanvases();
    initSnow();
  }, 1000);

  // Also watch for DOM changes
  const observer = new MutationObserver(() => {
    setTimeout(initSnow, 100);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
/* SNOW-BACKGROUND-END */
`;
}

function getWindowsUsername(): string {
  const config = vscode.workspace.getConfiguration('snowBackground');
  const configuredUsername = config.get<string>('windowsUsername');

  if (configuredUsername && configuredUsername.trim() !== '') {
    return configuredUsername.trim();
  }

  try {
    const usersDir = '/mnt/c/Users';
    if (fs.existsSync(usersDir)) {
      const users = fs.readdirSync(usersDir).filter(u =>
        !['Public', 'Default', 'Default User', 'All Users'].includes(u) &&
        !u.startsWith('.')
      );
      if (users.length > 0) {
        return users[0];
      }
    }
  } catch {}

  return 'User';
}

function findWorkbenchFile(vscodeDir: string): string | undefined {
  const workbenchRelPath = path.join('resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js');

  // Check the legacy direct path first
  const directPath = path.join(vscodeDir, workbenchRelPath);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // VS Code 1.100+ moves content into a hash-named subdirectory
  try {
    const entries = fs.readdirSync(vscodeDir);
    for (const entry of entries) {
      if (/^[0-9a-f]{6,}$/.test(entry)) {
        const hashPath = path.join(vscodeDir, entry, workbenchRelPath);
        if (fs.existsSync(hashPath)) {
          return hashPath;
        }
      }
    }
  } catch {}

  return undefined;
}

function updateWorkbenchChecksum(jsPath: string): void {
  try {
    // Find the product.json relative to the workbench file
    const productJsonPath = path.join(jsPath, '..', '..', '..', '..', 'product.json');
    if (!fs.existsSync(productJsonPath)) {
      return;
    }

    const content = fs.readFileSync(jsPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('base64');

    let productJson = fs.readFileSync(productJsonPath, 'utf8');
    const checksumKey = 'vs/workbench/workbench.desktop.main.js';
    const regex = new RegExp(`("${checksumKey.replace(/\//g, '\\/')}":\\s*")([^"]+)(")`);

    if (regex.test(productJson)) {
      productJson = productJson.replace(regex, `$1${hash}$3`);
      fs.writeFileSync(productJsonPath, productJson, 'utf8');
    }
  } catch {}
}

function getWorkbenchJSPath(): string {
  const appRoot = vscode.env.appRoot;

  if (appRoot.includes('.vscode-server')) {
    const windowsUser = getWindowsUsername();
    const installDirs = [
      `/mnt/c/Users/${windowsUser}/AppData/Local/Programs/Microsoft VS Code`,
      '/mnt/c/Program Files/Microsoft VS Code',
    ];

    for (const dir of installDirs) {
      const found = findWorkbenchFile(dir);
      if (found) {
        return found;
      }
    }

    throw new Error(
      `Could not find VS Code installation for Windows user "${windowsUser}". ` +
      `Please set your Windows username in Settings > Snow Background > Windows Username`
    );
  }

  // Local (non-WSL) installation — also check for hash-directory layout
  const found = findWorkbenchFile(path.join(appRoot, '..'));
  if (found) {
    return found;
  }
  return path.join(appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
}

function getSnowConfig(): SnowConfig {
  const config = vscode.workspace.getConfiguration('snowBackground');
  return {
    areas: config.get<string[]>('areas') || ['editor'],
    flakeCount: config.get<number>('flakeCount') || 100,
    speed: config.get<number>('speed') || 2,
    opacity: config.get<number>('opacity') || 0.6,
    wind: config.get<number>('wind') || 0.5,
    color: config.get<string>('color') || '255, 255, 255',
    cursorInteraction: config.get<boolean>('cursorInteraction') ?? true,
    cursorRadius: config.get<number>('cursorRadius') || 60,
    cursorStrength: config.get<number>('cursorStrength') || 1.5
  };
}

function isSnowEnabled(): boolean {
  try {
    const jsPath = getWorkbenchJSPath();
    const content = fs.readFileSync(jsPath, 'utf8');
    return content.includes('SNOW-BACKGROUND-START');
  } catch {
    return false;
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Prompt to enable on first activation
  const hasPrompted = context.globalState.get<boolean>('hasPromptedEnable');
  if (!hasPrompted && !isSnowEnabled()) {
    context.globalState.update('hasPromptedEnable', true);
    vscode.window.showInformationMessage(
      'Snow Background installed! Would you like to enable the snow effect?',
      'Enable',
      'Later'
    ).then(selection => {
      if (selection === 'Enable') {
        vscode.commands.executeCommand('snow-background.enable');
      }
    });
  }

  // Watch for settings changes and auto-apply
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async e => {
      if (!e.affectsConfiguration('snowBackground')) {
        return;
      }

      if (!isSnowEnabled()) {
        return;
      }

      try {
        const jsPath = getWorkbenchJSPath();
        let content = fs.readFileSync(jsPath, 'utf8');

        // Remove old snow code and add updated config
        content = content.replace(/\/\* SNOW-BACKGROUND-START \*\/[\s\S]*?\/\* SNOW-BACKGROUND-END \*\//g, '');
        const snowConfig = getSnowConfig();
        content += generateSnowJS(snowConfig);
        fs.writeFileSync(jsPath, content, 'utf8');
        updateWorkbenchChecksum(jsPath);

        const result = await vscode.window.showInformationMessage(
          'Snow settings updated. Restart VS Code to apply.',
          'Restart Now'
        );

        if (result === 'Restart Now') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to update snow settings: ${err.message}`);
      }
    })
  );

  const enableCmd = vscode.commands.registerCommand('snow-background.enable', async () => {
    try {
      const jsPath = getWorkbenchJSPath();

      // Check write permissions before attempting
      try {
        fs.accessSync(jsPath, fs.constants.W_OK);
      } catch {
        if (os.platform() === 'darwin') {
          vscode.window.showErrorMessage(
            'Permission denied. Run in Terminal: sudo chown -R $(whoami) "/Applications/Visual Studio Code.app"'
          );
          return;
        }
        throw new Error(`No write permission to ${jsPath}`);
      }

      let content = fs.readFileSync(jsPath, 'utf8');

      // Remove old snow code if exists
      content = content.replace(/\/\* SNOW-BACKGROUND-START \*\/[\s\S]*?\/\* SNOW-BACKGROUND-END \*\//g, '');

      // Add new snow code with current config
      const snowConfig = getSnowConfig();
      content += generateSnowJS(snowConfig);
      fs.writeFileSync(jsPath, content, 'utf8');
      updateWorkbenchChecksum(jsPath);

      const result = await vscode.window.showInformationMessage(
        `Snow enabled on: ${snowConfig.areas.join(', ')}. Restart VS Code to see the effect.`,
        'Restart Now'
      );

      if (result === 'Restart Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    } catch (err: any) {
      if (os.platform() === 'darwin' && (err.code === 'EACCES' || err.message.includes('permission'))) {
        vscode.window.showErrorMessage(
          'Permission denied. Run in Terminal: sudo chown -R $(whoami) "/Applications/Visual Studio Code.app"'
        );
      } else {
        vscode.window.showErrorMessage(`Failed to enable: ${err.message}`);
      }
    }
  });

  const disableCmd = vscode.commands.registerCommand('snow-background.disable', async () => {
    try {
      const jsPath = getWorkbenchJSPath();
      let content = fs.readFileSync(jsPath, 'utf8');

      content = content.replace(/\/\* SNOW-BACKGROUND-START \*\/[\s\S]*?\/\* SNOW-BACKGROUND-END \*\//g, '');
      fs.writeFileSync(jsPath, content, 'utf8');
      updateWorkbenchChecksum(jsPath);

      const result = await vscode.window.showInformationMessage(
        'Snow background disabled! Restart VS Code to apply.',
        'Restart Now'
      );

      if (result === 'Restart Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to disable: ${err.message}`);
    }
  });

  context.subscriptions.push(enableCmd, disableCmd);
}

export function deactivate() {
  // No-op: cleanup is handled by vscode:uninstall script and the disable command.
  // deactivate() runs on every reload/window close, so we must not touch the
  // workbench file here.
}
