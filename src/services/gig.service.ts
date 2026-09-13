import { addDataToIndex, deleteIndexedData, getIndexedData, updateIndexedData } from '@gigs/elasticsearch';
import { gigsSearchBySellerId } from '@gigs/services/search.service';
import { IRatingTypes, IReviewMessageDetails, ISearchResult, ISellerGig } from '@vsatya-kirankumar/jobber-shared';
import { GigModel } from '@gigs/models/gig.schema';
import { publishDirectMessage } from '@gigs/queues/gig.producer';
import { gigChannel } from '@gigs/server';

const getGigById = async (gigId: string): Promise<ISellerGig> => {
  const gig: ISellerGig = await getIndexedData('gig', gigId);
  return gig;
};

const getSellerGigs = async (sellerId: string): Promise<ISellerGig[]> => {
  const results: ISellerGig[] = [];
  const gigs: ISearchResult = await gigsSearchBySellerId(sellerId, true);

  for (const item of gigs.hits) {
    if (item._source) {
      results.push(item._source as ISellerGig);
    }
  }

  return results;
};

const getSellerPausedGigs = async (sellerId: string): Promise<ISellerGig[]> => {
  const results: ISellerGig[] = [];
  const gigs: ISearchResult = await gigsSearchBySellerId(sellerId, false);

  for (const item of gigs.hits) {
    if (item._source) {
      results.push(item._source as ISellerGig);
    }
  }

  return results;
};

const createGig = async (gig: ISellerGig): Promise<ISellerGig> => {
  const createdGig: ISellerGig = await GigModel.create(gig);
  if (createdGig) {
    const data: ISellerGig = createdGig.toJSON?.() as ISellerGig;
    await publishDirectMessage(
      gigChannel,
      'jobber-seller-update',
      'user-seller',
      JSON.stringify({ type: 'update-gig-count', gigSellerId: `${data.sellerId}`, count: 1 }),
      'Details sent to users service'
    );

    await addDataToIndex('gigs', `${createdGig._id}`, data);
  }

  return createdGig;
};

const deleteGig = async (gigId: string, sellerId: string): Promise<void> => {
  await GigModel.deleteOne({ _id: gigId }).exec();
  await publishDirectMessage(
    gigChannel,
    'jobber-seller-update',
    'user-seller',
    JSON.stringify({ type: 'update-gig-count', gigSellerId: `${sellerId}`, count: -1 }),
    'Details sent to users service'
  );
  await deleteIndexedData('gigs', `${gigId}`);
};

const updateGig = async (gigId: string, gigData: ISellerGig): Promise<ISellerGig> => {
  const document: ISellerGig = (await GigModel.findOneAndUpdate(
    { _id: gigId },
    {
      $set: {
        title: gigData.title,
        description: gigData.description,
        categories: gigData.categories,
        subCategories: gigData.subCategories,
        tags: gigData.tags,
        price: gigData.price,
        coverImage: gigData.coverImage,
        expectedDelivery: gigData.expectedDelivery,
        basicTitle: gigData.basicTitle,
        basicDescription: gigData.basicDescription
      }
    },
    { new: true }
  ).exec()) as ISellerGig;

  if (document) {
    const data: ISellerGig = document.toJSON?.() as ISellerGig;
    await updateIndexedData('gigs', `${document._id}`, data);
  }
  return document;
};

const updateActiveGigProps = async (gigId: string, gigActive: boolean): Promise<ISellerGig> => {
  const document: ISellerGig = (await GigModel.findOneAndUpdate(
    { _id: gigId },
    {
      $set: {
        active: gigActive
      }
    },
    { new: true }
  ).exec()) as ISellerGig;

  if (document) {
    const data: ISellerGig = document.toJSON?.() as ISellerGig;
    await updateIndexedData('gigs', `${document._id}`, data);
  }

  return document;
};

const updateGigReview = async (data: IReviewMessageDetails): Promise<void> => {
  const ratingTypes: IRatingTypes = {
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five'
  };
  const ratingKey: string = ratingTypes[`${data.rating}`];

  const document = await GigModel.findOneAndUpdate(
    { _id: data.sellerId },
    {
      $inc: {
        ratingsCount: 1,
        ratingSum: data.rating,
        [`ratingCategories.${ratingKey}.value`]: data.rating,
        [`ratingCategories.${ratingKey}.count`]: 1
      }
    },
    { new: true, upsert: true }
  ).exec();

  if (document) {
    const data: ISellerGig = document.toJSON?.() as ISellerGig;
    await updateIndexedData('gigs', `${document._id}`, data);
  }
};

export { getGigById, getSellerGigs, getSellerPausedGigs, createGig, deleteGig, updateGig, updateActiveGigProps, updateGigReview };
