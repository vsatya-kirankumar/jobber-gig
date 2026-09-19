import { Request, Response } from 'express';
import { deleteGig } from '@gigs/services/gig.service';
import { StatusCodes } from 'http-status-codes';

export const gigDelete = async (req: Request, res: Response): Promise<void> => {
  await deleteGig(req.params.gigId as string, req.params.sellerId as string);
  res.status(StatusCodes.OK).json({ message: 'Gig deleted successfully.' });
};
