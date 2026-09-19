import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getGigById, getSellerGigs, getSellerPausedGigs } from '@gigs/services/gig.service';
import { ISearchResult, ISellerGig } from '@vsatya-kirankumar/jobber-shared';
import { getUserSelectedGigCategory } from '@gigs/redis/gig.cache';
import { getMoreGigsLikeThis, getTopRatedGigsByCategory, gigsSearchByCategory } from '@gigs/services/search.service';

const gigById = async (req: Request, res: Response): Promise<void> => {
  const gig: ISellerGig = await getGigById(req.params.gigId as string);
  res.status(StatusCodes.OK).json({ message: 'Gig details', gig });
};

const sellerGigs = async (req: Request, res: Response): Promise<void> => {
  const gigs: ISellerGig[] = await getSellerGigs(req.params.sellerId as string);
  res.status(StatusCodes.OK).json({ message: 'Seller gig details', gigs });
};

const sellerInactiveGigs = async (req: Request, res: Response): Promise<void> => {
  const gigs: ISellerGig[] = await getSellerPausedGigs(req.params.sellerId as string);
  res.status(StatusCodes.OK).json({ message: 'Seller gigs', gigs });
};

const topRatesGigsByCategory = async (req: Request, res: Response): Promise<void> => {
  const category = await getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await getTopRatedGigsByCategory(`${category}`);

  for (let item of gigs.hits) {
    resultHits.push(item._source as ISellerGig);
  }

  res.status(StatusCodes.OK).json({ message: 'Search top gigs results', total: gigs.total, gigs: resultHits });
};

const gigsByCategory = async (req: Request, res: Response): Promise<void> => {
  const category = await getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await gigsSearchByCategory(`${category}`, true);

  for (let item of gigs.hits) {
    resultHits.push(item._source as ISellerGig);
  }

  res.status(StatusCodes.OK).json({ message: 'Search gigs category results', total: gigs.total, gigs: resultHits });
};

const gigsMoreLikeThis = async (req: Request, res: Response): Promise<void> => {
  const resultHits: ISellerGig[] = [];
  const gigs: ISearchResult = await getMoreGigsLikeThis(`${req.params.gigId}`);

  for (let item of gigs.hits) {
    resultHits.push(item._source as ISellerGig);
  }

  res.status(StatusCodes.OK).json({ message: 'More gigs like this', total: gigs.total, gigs: resultHits });
};

export { gigById, sellerGigs, sellerInactiveGigs, topRatesGigsByCategory, gigsByCategory, gigsMoreLikeThis };
