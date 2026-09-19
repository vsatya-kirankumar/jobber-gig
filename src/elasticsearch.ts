import { Client } from '@elastic/elasticsearch';
import { ClusterHealthResponse, CountResponse, GetResponse } from '@elastic/elasticsearch/lib/api/types';
import { config } from '@gigs/config';
import { ISellerGig, winstonLogger } from '@vsatya-kirankumar/jobber-shared';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigsElasticSearchServer', 'debug');

const elasticSearchClient = new Client({ node: `${config.ELASTIC_SEARCH_URL}` || 'http://localhost:9200' });

const checkElasticSearchConnection = async (): Promise<void> => {
  let isConnected: boolean = false;
  while (!isConnected) {
    try {
      const health: ClusterHealthResponse = await elasticSearchClient.cluster.health({});
      log.info(`Gig Service ElasticSearch health status - ${health.status}`);
      isConnected = true;
    } catch (error) {
      log.error('ElasticSearch connection failed. Retrying in 5 seconds...', error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      log.log('error', 'Gig Service checkElasticSearchConnection() method error.', error);
    }
  }
};

const checkIfIndexExists = async (indexName: string): Promise<boolean> => {
  const result: boolean = await elasticSearchClient.indices.exists({ index: indexName });
  return result;
};

const createIndex = async (indexName: string): Promise<void> => {
  try {
    const indexExists: boolean = await checkIfIndexExists(indexName);
    if (indexExists) {
      log.info(`Index ${indexName} is already exists.`);
    } else {
      await elasticSearchClient.indices.create({ index: indexName });
      await elasticSearchClient.indices.refresh({ index: indexName });
      log.info(`Created index ${indexName}.`);
    }
  } catch (error) {
    log.error(`An error occured while creating the index ${indexName}`, error);
  }
};

const getIndexedData = async (index: string, itemId: string): Promise<ISellerGig> => {
  try {
    const result: GetResponse = await elasticSearchClient.get({ index, id: itemId });
    return result._source as ISellerGig;
  } catch (error) {
    log.log('error', 'Gig service getIndexedData() method error: ', error);
    return {} as ISellerGig;
  }
};

const getDocumentCount = async (index: string): Promise<number> => {
  try {
    const result: CountResponse = await elasticSearchClient.count({ index });
    return result.count;
  } catch (error) {
    log.log('error', 'GigService elasticsearch getDocumentCount() method error:', error);
    return 0;
  }
};

const addDataToIndex = async (index: string, itemId: string, gigDocument: unknown): Promise<void> => {
  try {
    await elasticSearchClient.index({
      index,
      id: itemId,
      document: gigDocument
    });
  } catch (error) {
    log.log('error', 'Gig service addDataToIndex() method error: ', error);
  }
};

const updateIndexedData = async (index: string, itemId: string, gigDocument: unknown): Promise<void> => {
  try {
    await elasticSearchClient.update({
      index,
      id: itemId,
      doc: gigDocument
    });
  } catch (error) {
    log.log('error', 'Gig service updateIndexedData() method error: ', error);
  }
};

const deleteIndexedData = async (index: string, itemId: string): Promise<void> => {
  try {
    await elasticSearchClient.delete({
      index,
      id: itemId
    });
  } catch (error) {
    log.log('error', 'Gig service deleteIndexedData() method error: ', error);
  }
};

export {
  elasticSearchClient,
  checkElasticSearchConnection,
  createIndex,
  getIndexedData,
  getDocumentCount,
  addDataToIndex,
  updateIndexedData,
  deleteIndexedData
};
