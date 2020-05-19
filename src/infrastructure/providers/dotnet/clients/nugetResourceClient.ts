import { ILogger } from 'core/logging';
import { HttpClientResponse, HttpClientRequestMethods } from 'core/clients';

import { JsonHttpClientRequest } from 'infrastructure/clients';

import { NugetServiceIndexResponse } from '../definitions/nuget';
import { DotNetSource } from '../definitions/dotnet';
import { DotNetConfig } from '../dotnetConfig';

export class NuGetResourceClient extends JsonHttpClientRequest {

  config: DotNetConfig;
  logger: ILogger;

  constructor(config: DotNetConfig, logger: ILogger) {
    super(logger, config.caching, {})
    this.config = config;
    this.logger = logger;
  }

  async fetchResource(source: DotNetSource): Promise<string> {

    return this.requestJson(HttpClientRequestMethods.get, source.url)
      .then((response: NugetServiceIndexResponse) => {
        const autocompleteServices = response.data.resources
          .filter(res => res["@type"] === 'SearchAutocompleteService');
        return autocompleteServices[0]["@id"];
      }).catch((error: HttpClientResponse) => {
        const feeds = this.config.nuGetFeeds;
        return feeds.length > 0 ?
          feeds[0] :
          Promise.reject("Could not obtain a nuget resource")
      });

  }

}