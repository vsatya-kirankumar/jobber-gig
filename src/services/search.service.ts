import { estypes } from '@elastic/elasticsearch';
import { elasticSearchClient } from '@gigs/elasticsearch';
import { IHitsTotal, ISearchResult } from '@vsatya-kirankumar/jobber-shared';

type SearchResponse = estypes.SearchResponse;
type SearchQueryContainer = estypes.QueryDslQueryContainer;

const gigsSearchBySellerId = async (searchQuery: string, active: boolean): Promise<ISearchResult> => {
  const queryList: SearchQueryContainer[] = [
    {
      query_string: {
        fields: ['sellerId'],
        query: `*${searchQuery}*`
      }
    },
    {
      term: { active }
    }
  ];

  const results: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    query: {
      bool: {
        must: [...queryList]
      }
    }
  });

  const total: IHitsTotal = results.hits?.total as IHitsTotal;

  return {
    total: total.value,
    hits: results.hits.hits
  };
};

export { gigsSearchBySellerId };
