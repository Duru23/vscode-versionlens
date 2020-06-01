import { LoggerStub } from 'test.core.logging'

import { ILogger } from 'core.logging';

import {
  UrlHelpers,
  IJsonHttpClient,
  JsonHttpClient,
  HttpClientRequestMethods
} from 'core.clients';

import { NuGetResourceClient } from 'infrastructure.providers/dotnet';

import Fixtures from './fixtures/nugetResources'

const assert = require('assert');
const { mock, instance, when, anything, capture } = require('ts-mockito');

let jsonClientMock: IJsonHttpClient;
let loggerMock: ILogger;

export const NuGetResourceClientTests = {

  beforeEach: () => {
    jsonClientMock = mock(JsonHttpClient);
    loggerMock = mock(LoggerStub);
  },

  "fetchResource": {

    "returns the package resource from a list of resources": async () => {
      const testSource = {
        enabled: true,
        machineWide: false,
        url: 'https://test',
        protocol: UrlHelpers.RegistryProtocols.https
      };

      const mockResponse = {
        status: 200,
        data: Fixtures.success,
      };

      const expected = 'https://api.nuget.org/v3-flatcontainer1/';

      when(jsonClientMock.request(anything(), anything(), anything(), anything()))
        .thenResolve(mockResponse)

      const cut = new NuGetResourceClient(
        instance(jsonClientMock),
        instance(loggerMock)
      )

      return cut.fetchResource(testSource)
        .then(actualSources => {
          assert.equal(actualSources, expected)

          const [actualMethod, actualUrl] = capture(jsonClientMock.request).first();
          assert.equal(actualMethod, HttpClientRequestMethods.get);
          assert.equal(actualUrl, testSource.url);
        });
    },

    "throws an error when no resource or feeds can be obtained": async () => {

      const testSource = {
        enabled: true,
        machineWide: false,
        url: 'https://test',
        protocol: UrlHelpers.RegistryProtocols.https
      };

      const expectedResponse = {
        source: 'remote',
        status: 404,
        data: 'an error occurred',
        rejected: true
      };

      when(jsonClientMock.request(anything(), anything(), anything(), anything()))
        .thenReject(expectedResponse)

      const cut = new NuGetResourceClient(
        instance(jsonClientMock),
        instance(loggerMock)
      )

      await cut.fetchResource(testSource)
        .catch(err => {
          assert.deepEqual(err, expectedResponse)
        });
    },

  }

}