import { gigsSearch } from '@gigs/services/search.service';
import { IPaginateProps, ISearchResult, ISellerGig } from '@vsatya-kirankumar/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sortBy from 'lodash/sortBy';

export async function gigs(req: Request<IPaginateProps>, res: Response): Promise<void> {
  const { from, size, type } = req.params;
  let resultHits: ISellerGig[] = [];
  const paginate: IPaginateProps = { from, size: parseInt(`${size}`), type };
  const gigs: ISearchResult = await gigsSearch(
    `${req.query.query}`,
    paginate,
    `${req.query.delivery_time}`,
    parseInt(`${req.query.minPrice}`),
    parseInt(`${req.query.maxPrice}`)
  );

  if (gigs.total > 0) {
    for (const item of gigs.hits) {
      resultHits.push(item._source as ISellerGig);
    }

    if (type === 'backward') {
      resultHits = sortBy(resultHits, ['sortId']);
    }
  }

  res.status(StatusCodes.OK).json({ message: 'Search gigs results', total: gigs.total, gigs: resultHits });
}
