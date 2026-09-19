import { estypes } from '@elastic/elasticsearch';
import { elasticSearchClient } from '@gigs/elasticsearch';
import { IHitsTotal, IPaginateProps, ISearchResult } from '@vsatya-kirankumar/jobber-shared';

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

const gigsSearch = async (
  searchQuery: string,
  paginate: IPaginateProps,
  deliverTime?: string,
  min?: number,
  max?: number
): Promise<ISearchResult> => {
  const { from, size, type } = paginate;

  const queryList: SearchQueryContainer[] = [
    {
      query_string: {
        fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories', 'expectedDelivery'],
        query: `*${searchQuery}*`
      }
    },
    {
      term: { active: true }
    }
  ];
  if (deliverTime !== 'undefined') {
    queryList.push({
      query_string: {
        fields: ['expectedDelivery'],
        query: `*${deliverTime}`
      }
    });
  }
  if (!isNaN(parseInt(`${min}`)) && !isNaN(parseInt(`${max}`))) {
    queryList.push({
      range: {
        price: {
          gte: min,
          lte: max
        }
      }
    });
  }

  const results: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size,
    query: {
      bool: {
        must: [...queryList]
      }
    },
    sort: [
      {
        sortId: type === 'forward' ? 'asc' : 'desc'
      }
    ],
    ...(from !== '0' && { search_after: [from] })
  });

  const total: IHitsTotal = results.hits?.total as IHitsTotal;

  return {
    total: total.value,
    hits: results.hits.hits
  };
};

const gigsSearchByCategory = async (searchQuery: string, active: boolean): Promise<ISearchResult> => {
  const queryList: SearchQueryContainer[] = [
    {
      query_string: {
        fields: ['category'],
        query: `*${searchQuery}*`
      }
    },
    {
      term: { active }
    }
  ];

  const results: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size: 10,
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

const getMoreGigsLikeThis = async (gigId: string): Promise<ISearchResult> => {
  const results: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size: 5,
    query: {
      more_like_this: {
        fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories', 'expectedDelivery'],
        like: [
          {
            _index: 'gigs',
            _id: gigId
          }
        ]
      }
    }
  });

  const total: IHitsTotal = results.hits?.total as IHitsTotal;

  return {
    total: total.value,
    hits: results.hits.hits
  };
};

const getTopRatedGigsByCategory = async (searchQuery: string): Promise<ISearchResult> => {
  const results: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size: 10,
    query: {
      bool: {
        filter: {
          script: {
            script: {
              source: "doc['ratingSum'].value != 0 && (doc['ratingSum'].value / doc['ratingsCount'].value === params['threashold'])",
              lang: 'painless',
              params: {
                threashold: 5
              }
            }
          }
        },
        must: [
          {
            query_string: {
              fields: ['categories'],
              query: `*${searchQuery}*`
            }
          }
        ]
      }
    }
  });

  const total: IHitsTotal = results.hits?.total as IHitsTotal;

  return {
    total: total.value,
    hits: results.hits.hits
  };
};

export { getMoreGigsLikeThis, getTopRatedGigsByCategory, gigsSearch, gigsSearchByCategory, gigsSearchBySellerId };
