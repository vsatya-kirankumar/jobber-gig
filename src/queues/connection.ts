import { winstonLogger } from '@vsatya-kirankumar/jobber-shared';
import { config } from '@gigs/config';
import { Logger } from 'winston';
import amqp, { Channel, ChannelModel } from 'amqplib';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigQueueConnection', 'debug');

export const createRabbitMQConnection = async (): Promise<Channel | undefined> => {
  try {
    log.info('Gig-service: Creating connection to RabbitMQ...');

    const connection: ChannelModel = await amqp.connect(`${config.RABBITMQ_ENDPOINT}`);
    const channel: Channel = await connection.createChannel();
    closeConnection(connection, channel);
    log.info('Gig Service channel created successfully...');

    return channel;
  } catch (error) {
    log.log('error', 'Users service createRabbitMQConnection() method error', error);

    throw error;
  }
};

const closeConnection = (connection: ChannelModel, channel: Channel) => {
  process.once('SIGINT', async function () {
    try {
      await connection.close();
      await channel.close();
      log.info('RabbitMQ Gig service connection closed..');
      process.exit(0);
    } catch (error) {
      log.log('error', 'Gig service closeConnection() method error', error);
      process.exit(1);
    }
  });
};
