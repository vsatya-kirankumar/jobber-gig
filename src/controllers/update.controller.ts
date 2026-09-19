import { gigUpdateSchema } from '@gigs/schemes/gig';
import { createGig, updateActiveGigProps } from '@gigs/services/gig.service';
import { BadRequestError, isDataURL, ISellerGig, uploads } from '@vsatya-kirankumar/jobber-shared';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const gigUpdate = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(gigUpdateSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(error?.details[0]?.message, 'Update gig() method error.');
  }

  const isDataUrl: boolean = isDataURL(req.body.coverImage);
  let coverImage = '';

  if (isDataUrl) {
    const result: UploadApiResponse = (await uploads(req.body.coverImage)) as UploadApiResponse;
    if (!result.public_id) {
      throw new BadRequestError('Error in uploading the image. Please try again!', 'Update gig() method error.');
    }
    coverImage = result?.secure_url;
  } else {
    coverImage = req.body.coverImage;
  }

  const gigObj: ISellerGig = {
    title: req.body.title,
    description: req.body.description,
    categories: req.body.categories,
    subCategories: req.body.subCategories,
    tags: req.body.tags,
    price: req.body.price,
    expectedDelivery: req.body.expectedDelivery,
    basicTitle: req.body.basicTitle,
    basicDescription: req.body.basicDescription,
    coverImage
  };

  const createdGig: ISellerGig = await createGig(gigObj);
  res.status(StatusCodes.OK).json({ message: 'Gig updated successfully.', gig: createdGig });
};

const gigUpdateActive = async (req: Request, res: Response): Promise<void> => {
  const updatedGig: ISellerGig = await updateActiveGigProps(req.params.gigId as string, req.body.active);
  res.status(StatusCodes.OK).json({ message: 'Active Gig updated successfully.', gig: updatedGig });
};

export { gigUpdate, gigUpdateActive };
