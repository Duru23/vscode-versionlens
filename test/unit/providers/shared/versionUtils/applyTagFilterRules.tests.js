import { TestFixtureMap } from 'test/unit/utils';
import { applyTagFilterRules } from 'providers/shared/versionUtils';

const npmFixtures = new TestFixtureMap('./unit/core/npm/fixtures');

const assert = require('assert');

export default {

  "returns results ordered by recent version": () => {
    const expected = [
      "next",
      "lts"
    ];

    const distTags = JSON.parse(npmFixtures.read('./npm.json').content).distTags;
    const results = applyTagFilterRules(distTags, '1', '1.4.29', '4.6.1', false);

    assert.equal(
      results.length,
      expected.length,
      `Length not equal. Expected ${results.length} to be ${expected.length}`
    );

    results.map(result => result.name)
      .forEach((result, index) => {
        assert.equal(
          result,
          expected[index],
          `result[index].name: Not equal. Expected ${result} to be ${expected[index]}`
        )
      });
  }

}