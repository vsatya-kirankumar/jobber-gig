import { winstonLogger } from '@vsatya-kirankumar/jobber-shared';
import { config } from '@gigs/config';
import { Logger } from 'winston';
import { client } from '@gigs/redis/redis.connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigCache', 'debug');

const getUserSelectedGigCategory = async (key: string): Promise<string> => {
  try {
    if (!client.isOpen) {
      await client.connect();
    }

    const response: string = (await client.GET(key)) as string;

    return response;
  } catch (error) {
    log.log('error', 'Gig Service gig-cache getUserSelectedGigCategory() method error', error);
    return '';
  }
};

export { getUserSelectedGigCategory };
