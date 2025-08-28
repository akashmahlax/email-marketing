import { ObjectId } from "mongodb";
import client from "../db";
import { Subscriber, SubscriberList, SubscriberStats } from "../models/subscriber";

const COLLECTION_NAME = "subscribers";
const LIST_COLLECTION_NAME = "subscriber_lists";

export async function getSubscribers(page = 1, limit = 10, filter: Partial<Subscriber> = {}) {
  const db = (await client).db();
  const skip = (page - 1) * limit;
  
  const subscribers = await db
    .collection<Subscriber>(COLLECTION_NAME)
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = await db.collection(COLLECTION_NAME).countDocuments(filter);
  
  return {
    subscribers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getSubscriberById(id: string) {
  const db = (await client).db();
  return db.collection<Subscriber>(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
}

export async function getSubscriberByEmail(email: string) {
  const db = (await client).db();
  return db.collection<Subscriber>(COLLECTION_NAME).findOne({ email: email.toLowerCase() });
}

export async function createSubscriber(subscriber: Omit<Subscriber, "_id" | "createdAt" | "updatedAt">) {
  const db = (await client).db();
  
  // Check if subscriber already exists
  const existingSubscriber = await getSubscriberByEmail(subscriber.email);
  if (existingSubscriber) {
    throw new Error("Subscriber with this email already exists");
  }
  
  const now = new Date();
  const newSubscriber: Subscriber = {
    ...subscriber,
    email: subscriber.email.toLowerCase(),
    status: subscriber.status || "active",
    createdAt: now,
    updatedAt: now
  };
  
  const result = await db.collection<Subscriber>(COLLECTION_NAME).insertOne(newSubscriber as any);
  return { ...newSubscriber, _id: result.insertedId };
}

export async function updateSubscriber(id: string, update: Partial<Subscriber>) {
  const db = (await client).db();
  
  // Don't allow updating email to one that already exists
  if (update.email) {
    const existingSubscriber = await getSubscriberByEmail(update.email);
    if (existingSubscriber && existingSubscriber._id?.toString() !== id) {
      throw new Error("Another subscriber with this email already exists");
    }
    update.email = update.email.toLowerCase();
  }
  
  const now = new Date();
  const result = await db.collection<Subscriber>(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        ...update,
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Subscriber not found");
  }
  
  return getSubscriberById(id);
}

export async function deleteSubscriber(id: string) {
  const db = (await client).db();
  const result = await db.collection<Subscriber>(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
  
  if (result.deletedCount === 0) {
    throw new Error("Subscriber not found");
  }
  
  return { success: true };
}

export async function unsubscribe(email: string, reason?: string) {
  const db = (await client).db();
  const now = new Date();
  
  const result = await db.collection<Subscriber>(COLLECTION_NAME).updateOne(
    { email: email.toLowerCase() },
    { 
      $set: {
        status: "unsubscribed",
        unsubscribedAt: now,
        unsubscribeReason: reason,
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Subscriber not found");
  }
  
  return { success: true };
}

export async function getSubscriberStats(): Promise<SubscriberStats> {
  const db = (await client).db();
  
  const totalSubscribers = await db.collection(COLLECTION_NAME).countDocuments();
  const activeSubscribers = await db.collection(COLLECTION_NAME).countDocuments({ status: "active" });
  const unsubscribedSubscribers = await db.collection(COLLECTION_NAME).countDocuments({ status: "unsubscribed" });
  const bouncedSubscribers = await db.collection(COLLECTION_NAME).countDocuments({ status: "bounced" });
  const complainedSubscribers = await db.collection(COLLECTION_NAME).countDocuments({ status: "complained" });
  
  // Calculate open and click rates
  const subscribersWithOpens = await db.collection(COLLECTION_NAME).countDocuments({ lastOpenedAt: { $exists: true } });
  const subscribersWithClicks = await db.collection(COLLECTION_NAME).countDocuments({ lastClickedAt: { $exists: true } });
  
  const openRate = totalSubscribers > 0 ? subscribersWithOpens / totalSubscribers : 0;
  const clickRate = totalSubscribers > 0 ? subscribersWithClicks / totalSubscribers : 0;
  
  // Calculate growth rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newSubscribers = await db.collection(COLLECTION_NAME).countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo } 
  });
  
  const growthRate = totalSubscribers > 0 ? newSubscribers / totalSubscribers : 0;
  
  return {
    totalSubscribers,
    activeSubscribers,
    unsubscribedSubscribers,
    bouncedSubscribers,
    complainedSubscribers,
    openRate,
    clickRate,
    growthRate
  };
}

// Subscriber List Functions
export async function getLists(page = 1, limit = 10) {
  const db = (await client).db();
  const skip = (page - 1) * limit;
  
  const lists = await db
    .collection<SubscriberList>(LIST_COLLECTION_NAME)
    .find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = await db.collection(LIST_COLLECTION_NAME).countDocuments();
  
  return {
    lists,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getListById(id: string) {
  const db = (await client).db();
  return db.collection<SubscriberList>(LIST_COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
}

export async function createList(list: Omit<SubscriberList, "_id" | "createdAt" | "updatedAt" | "subscribers">) {
  const db = (await client).db();
  
  const now = new Date();
  const newList: SubscriberList = {
    ...list,
    subscribers: [],
    createdAt: now,
    updatedAt: now
  };
  
  const result = await db.collection<SubscriberList>(LIST_COLLECTION_NAME).insertOne(newList as any);
  return { ...newList, _id: result.insertedId };
}

export async function updateList(id: string, update: Partial<SubscriberList>) {
  const db = (await client).db();
  
  const now = new Date();
  const result = await db.collection<SubscriberList>(LIST_COLLECTION_NAME).updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: {
        ...update,
        updatedAt: now
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("List not found");
  }
  
  return getListById(id);
}

export async function deleteList(id: string) {
  const db = (await client).db();
  const result = await db.collection<SubscriberList>(LIST_COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
  
  if (result.deletedCount === 0) {
    throw new Error("List not found");
  }
  
  return { success: true };
}

export async function addSubscriberToList(subscriberId: string, listId: string) {
  const db = (await client).db();
  
  // Check if subscriber exists
  const subscriber = await getSubscriberById(subscriberId);
  if (!subscriber) {
    throw new Error("Subscriber not found");
  }
  
  // Check if list exists
  const list = await getListById(listId);
  if (!list) {
    throw new Error("List not found");
  }
  
  // Add subscriber to list if not already in it
  const result = await db.collection<SubscriberList>(LIST_COLLECTION_NAME).updateOne(
    { 
      _id: new ObjectId(listId),
      subscribers: { $ne: new ObjectId(subscriberId) }
    },
    { 
      $push: { subscribers: new ObjectId(subscriberId) },
      $set: { updatedAt: new Date() }
    }
  );
  
  return { success: true, alreadyInList: result.matchedCount === 0 };
}

export async function removeSubscriberFromList(listId: string, subscriberId: string) {
  const db = (await client).db();
  
  const result = await db.collection<SubscriberList>(LIST_COLLECTION_NAME).updateOne(
    { _id: new ObjectId(listId) },
    { 
      $pull: { subscribers: new ObjectId(subscriberId) },
      $set: { updatedAt: new Date() }
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("List not found");
  }
  
  return { success: true };
}

export async function getSubscribersByList(listId: string, page = 1, limit = 10) {
  const db = (await client).db();
  
  // Get the list to verify it exists and get subscriber IDs
  const list = await getListById(listId);
  if (!list) {
    throw new Error("List not found");
  }
  
  const skip = (page - 1) * limit;
  
  // Get subscribers that are in the list
  const subscribers = await db
    .collection<Subscriber>(COLLECTION_NAME)
    .find({ _id: { $in: list.subscribers } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = list.subscribers.length;
  
  return {
    subscribers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}