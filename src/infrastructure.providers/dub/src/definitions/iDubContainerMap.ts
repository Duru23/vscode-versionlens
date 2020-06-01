// compiled run-time references
import {
  ICachingOptions,
  IHttpOptions,
  IJsonHttpClient
} from 'core.clients';

import { DubConfig } from '../dubConfig';
import { DubVersionLensProvider } from '../dubProvider';
import { DubClient } from '../dubClient';

export interface IDubContainerMap {

  // options
  dubCachingOpts: ICachingOptions,

  dubHttpOpts: IHttpOptions,

  // config
  dubConfig: DubConfig,

  // clients
  dubJsonClient: IJsonHttpClient,

  dubClient: DubClient,

  // provider
  dubProvider: DubVersionLensProvider

}