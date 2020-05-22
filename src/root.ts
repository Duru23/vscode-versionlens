// vscode references
import * as VsCodeTypes from 'vscode';

import { VsCodeConfig } from 'infrastructure/configuration';
import { createWinstonLogger } from 'infrastructure/logging';

import { registerProviders } from 'presentation/providers';
import {
  registerExtension,
  registerCommands,
  registerTextEditorEvents,
  registerTextDocumentEvents,
  VersionLensExtension,
} from 'presentation/extension';

const { version } = require('../package.json');

export async function composition(context: VsCodeTypes.ExtensionContext) {

  const configuration = new VsCodeConfig(VersionLensExtension.extensionName.toLowerCase());

  // create the output channel
  const { window } = require('vscode');

  const channel = window.createOutputChannel(VersionLensExtension.extensionName);

  const extension = registerExtension(configuration, channel);

  // Setup the logger
  const logger = createWinstonLogger(channel, extension.logging);
  const appLogger = logger.child({ namespace: 'extension' });
  appLogger.info('version: %s', version);
  appLogger.info('log level: %s', extension.logging.level);
  appLogger.info('log path: %s', context.logPath);

  registerTextDocumentEvents(extension.state, appLogger);

  const textEditorEvents = registerTextEditorEvents(extension.state, appLogger);

  const disposables = [
    ...await registerProviders(extension, appLogger),
    ...registerCommands(extension, appLogger)
  ]
  // subscribe command and provider disposables
  context.subscriptions.push(<any>disposables);

  // show icons in active text editor if versionLens.providerActive
  textEditorEvents.onDidChangeActiveTextEditor(window.activeTextEditor);
}