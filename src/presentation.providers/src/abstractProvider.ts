// vscode references
import * as VsCodeTypes from 'vscode';

// imports
import { ILogger } from 'core.logging';

import {
  PackageSourceTypes,
  PackageResponseErrors,
  PackageResponse,
  ReplaceVersionFunction
} from 'core.packages';

import {
  CommandFactory,
  IVersionCodeLens,
  VersionLens,
  VersionLensFactory
} from "presentation.lenses";
import { VersionLensExtension } from 'presentation.extension';

import { IProviderConfig } from './definitions/iProviderConfig';
import { defaultReplaceFn } from './providerUtils';

export type VersionLensFetchResponse = Promise<Array<PackageResponse>>;

export abstract class AbstractVersionLensProvider<TConfig extends IProviderConfig> {

  _onChangeCodeLensesEmitter: VsCodeTypes.EventEmitter<void>;

  onDidChangeCodeLenses: any;

  config: TConfig;

  logger: ILogger;

  extension: VersionLensExtension;

  customReplaceFn: ReplaceVersionFunction;

  // abstract updateOutdated(packagePath: string): Promise<any>;

  // abstract generateDecorations(versionLens: VersionLens): void;

  abstract fetchVersionLenses(
    packagePath: string,
    document: VsCodeTypes.TextDocument,
    token: VsCodeTypes.CancellationToken
  ): VersionLensFetchResponse;

  constructor(config: TConfig, logger: ILogger) {
    const { EventEmitter } = require('vscode');
    this.config = config;
    this._onChangeCodeLensesEmitter = new EventEmitter();
    this.onDidChangeCodeLenses = this._onChangeCodeLensesEmitter.event;
    this.logger = logger;
    this.extension = config.extension;
  }

  refreshCodeLenses() {
    this._onChangeCodeLensesEmitter.fire();
  }

  async provideCodeLenses(
    document: VsCodeTypes.TextDocument, token: VsCodeTypes.CancellationToken
  ): Promise<VersionLens[] | null> {
    if (this.extension.state.enabled.value === false) return null;

    // package path
    const { dirname } = require('path');
    const packagePath = dirname(document.uri.fsPath);

    // clear any errors
    this.extension.state.providerError.value = false;

    // set in progress
    this.extension.state.providerBusy.value++;

    this.logger.info("Analysing dependencies for %s", document.uri.fsPath);

    // unfreeze config per file request
    this.config.caching.defrost();

    this.logger.debug(
      "Caching duration is set to %s milliseconds",
      this.config.caching.duration
    );

    return this.fetchVersionLenses(packagePath, document, token)
      .then(responses => {
        this.extension.state.providerBusy.value--;
        if (responses === null) {
          this.logger.info("No dependencies found in %s", document.uri.fsPath)
          return null;
        }

        this.logger.info("Resolved %s dependencies", responses.length)

        return VersionLensFactory.createFromPackageResponses(
          document,
          responses,
          this.customReplaceFn || defaultReplaceFn
        );
      })
      .catch(error => {
        this.extension.state.providerError.value = true;
        this.extension.state.providerBusy.change(0)
        return Promise.reject(error);
      })
  }

  async resolveCodeLens(
    codeLens: IVersionCodeLens,
    token: VsCodeTypes.CancellationToken
  ): Promise<VersionLens> {
    if (codeLens instanceof VersionLens) {
      // evaluate the code lens
      const evaluated = this.evaluateCodeLens(codeLens, token);

      // update the progress
      return Promise.resolve(evaluated);
    }
  }

  evaluateCodeLens(
    codeLens: IVersionCodeLens, token: VsCodeTypes.CancellationToken
  ) {
    if (codeLens.hasPackageError(PackageResponseErrors.Unexpected))
      return CommandFactory.createPackageUnexpectedError(codeLens);

    if (codeLens.hasPackageError(PackageResponseErrors.NotFound))
      return CommandFactory.createPackageNotFoundCommand(codeLens);

    if (codeLens.hasPackageError(PackageResponseErrors.NotSupported))
      return CommandFactory.createPackageMessageCommand(codeLens);

    if (codeLens.hasPackageError(PackageResponseErrors.GitNotFound))
      return CommandFactory.createPackageMessageCommand(codeLens);

    if (codeLens.hasPackageSource(PackageSourceTypes.Directory))
      return CommandFactory.createDirectoryLinkCommand(codeLens);

    return CommandFactory.createSuggestedVersionCommand(codeLens)
  }

}