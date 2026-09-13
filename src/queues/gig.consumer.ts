import { config } from '@gigs/config';
import { createRabbitMQConnection } from '@gigs/queues/connection';
import { winstonLogger } from '@vsatya-kirankumar/jobber-shared';
import { Channel, ConsumeMessage, Replies } from 'amqplib';
import { updateGigReview } from 'src/services/gig.service';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'gigServiceConsumer', 'debug');

const consumeGigDirectMessage = async (channel: Channel): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createRabbitMQConnection()) as Channel;
    }

    const exchangeName = 'jobber-update-gig';
    const routingKey = 'update-gig';
    const queueName = 'gig-update-queue';

    await channel.assertExchange(exchangeName, 'direct');
    const jobberQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);
    log.info(`Successfully bound ${jobberQueue.queue} to ${exchangeName} with key ${routingKey}.`);
    channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      try {
        const { gigReview } = JSON.parse(msg!.content.toString());
        await updateGigReview(typeof gigReview === 'string' ? JSON.parse(gigReview) : gigReview);
        channel.ack(msg!);
      } catch (error) {
        log.log('error', 'Failed to process message:', error);
        channel.nack(msg, false, false);
      }
    });
  } catch (error) {
    log.log('error', 'GigService GigConsumer consumeGigDirectMessage() method error:', error);
  }
};

const consumeSeedDirectMessages = async (channel: Channel): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createRabbitMQConnection()) as Channel;
    }
    const exchangeName = 'jobber-seed-gig';
    const routingKey = 'receive-sellers';
    const queueName = 'seed-gig-queue';
    await channel.assertExchange(exchangeName, 'direct');
    const jobberQueue: Replies.AssertQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);
    channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
      //const { sellers, count } = JSON.parse(msg!.content.toString());
      //await seedData(sellers, count);
      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'GigService GigConsumer consumeGigDirectMessage() method error:', error);
  }
};

export { consumeGigDirectMessage, consumeSeedDirectMessages };
