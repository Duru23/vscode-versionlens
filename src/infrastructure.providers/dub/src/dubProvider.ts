// vscode references
import * as VsCodeTypes from 'vscode';

// imports
import { ILogger } from 'core.logging';
import { extractPackageDependenciesFromJson, VersionHelpers, RequestFactory } from 'core.packages';

import { VersionLens } from 'presentation.lenses';
import { AbstractVersionLensProvider, VersionLensFetchResponse } from 'presentation.providers';
import {
  renderMissingDecoration,
  renderInstalledDecoration,
  renderOutdatedDecoration
} from 'presentation.extension';

import { DubConfig } from './dubConfig';
import { readDubSelections, DubClient } from './clients/dubClient';

export class DubVersionLensProvider extends AbstractVersionLensProvider<DubConfig> {

  _outdatedCache: any;

  dubClient: DubClient;

  constructor(config: DubConfig, logger: ILogger) {
    super(config, logger);
    this._outdatedCache = {};

    const requestOptions = {
      caching: config.caching,
      http: config.http
    };

    this.dubClient = new DubClient(
      config,
      requestOptions,
      logger.child({ namespace: 'dub pkg client' })
    );
  }

  async fetchVersionLenses(
    packagePath: string,
    document: VsCodeTypes.TextDocument,
    token: VsCodeTypes.CancellationToken
  ): VersionLensFetchResponse {
    const packageDependencies = extractPackageDependenciesFromJson(
      document.getText(),
      this.config.dependencyProperties
    );
    if (packageDependencies.length === 0) return null;

    const includePrereleases = this.extension.state.prereleasesEnabled.value;

    const context = {
      includePrereleases,
      clientData: null,
    }

    return RequestFactory.executeDependencyRequests(
      packagePath,
      this.dubClient,
      packageDependencies,
      context,
    );
  }

  async updateOutdated(packagePath: string): Promise<any> {
    const path = require('path');
    const selectionsFilePath = path.join(packagePath, 'dub.selections.json');
    return readDubSelections(selectionsFilePath)
      .then(selectionsJson => {
        this._outdatedCache = selectionsJson;
      })
      .catch(err => {
        if (err)
          console.warn(err);
      })
  }

  generateDecorations(versionLens: VersionLens): void {
    const currentPackageName = versionLens.package.requested.name;
    const currentPackageVersion = versionLens.package.requested.version;

    if (!versionLens.replaceRange) return;

    if (!this._outdatedCache) {
      renderMissingDecoration(
        versionLens.replaceRange,
        this.config.extension.statuses.notInstalledColour
      );
      return;
    }

    const currentVersion = this._outdatedCache.versions[currentPackageName];
    if (!currentVersion) {
      renderMissingDecoration(
        versionLens.replaceRange,
        this.config.extension.statuses.notInstalledColour
      );
      return;
    }

    if (VersionHelpers.formatWithExistingLeading(currentPackageVersion, currentVersion) == currentPackageVersion) {
      renderInstalledDecoration(
        versionLens.replaceRange,
        currentPackageVersion,
        this.config.extension.statuses.installedColour
      );
      return;
    }

    renderOutdatedDecoration(
      versionLens.replaceRange,
      currentVersion,
      this.config.extension.statuses.outdatedColour
    );

  }

}