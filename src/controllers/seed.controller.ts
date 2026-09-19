import { Request, Response } from 'express';
import { publishDirectMessage } from '@gigs/queues/gig.producer';
import { gigChannel } from 'src/server';
import { StatusCodes } from 'http-status-codes';

const gig = async (req: Request, res: Response): Promise<void> => {
  const { count } = req.params;

  await publishDirectMessage(
    gigChannel,
    'jobber-gig',
    'get-sellers',
    JSON.stringify({ type: 'getSellers', count }),
    'Gig seed message sent to user service.'
  );

  res.status(StatusCodes.CREATED).json({ message: 'Gig created successfully.' });
};

export { gig };
