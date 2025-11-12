import axios from 'axios';
import logger from './logger.js';

export const sendToSplunk = async (event) => {
  const url = process.env.SPLUNK_HEC_URL;
  const token = process.env.SPLUNK_HEC_TOKEN;
  if (!url || !token) {
    return;
  }
  try {
    await axios.post(url, {
      event,
      time: Date.now() / 1000
    }, {
      headers: {
        Authorization: `Splunk ${token}`
      },
      timeout: 3000
    });
  } catch (error) {
    logger.error('Splunk dispatch failed', { error: error.message });
  }
};
