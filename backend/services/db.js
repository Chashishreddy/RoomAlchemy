import { MongoClient } from 'mongodb';
import logger from './logger.js';

let client;
let collection;

export const initDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    return null;
  }
  if (collection) {
    return collection;
  }
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    collection = db.collection('events');
    await collection.createIndex({ timestamp: 1 });
    logger.info('MongoDB connected for event logging');
    return collection;
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    return null;
  }
};

export const persistEvent = async (event) => {
  try {
    if (!collection) {
      await initDb();
    }
    if (!collection) {
      return;
    }
    await collection.insertOne({ ...event, timestamp: new Date() });
  } catch (error) {
    logger.error('MongoDB persist error', { error: error.message });
  }
};

export const closeDb = async () => {
  if (client) {
    await client.close();
    client = null;
    collection = null;
  }
};
