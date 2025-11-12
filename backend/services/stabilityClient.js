import axios from 'axios';
import FormData from 'form-data';
import logger from './logger.js';

const DEFAULT_ENGINE = 'stable-diffusion-xl-1024-v1-0';

export const redesignImage = async ({ imageBuffer, promptStyle }) => {
  if (!process.env.STABILITY_API_KEY) {
    throw new Error('Missing Stability API key');
  }

  const form = new FormData();
  form.append('image', imageBuffer, {
    filename: 'input.png',
    contentType: 'image/png'
  });
  form.append('prompt', `Redesign this room in ${promptStyle} style. Maintain room layout, furniture scale, and photorealism.`);
  form.append('output_format', 'png');

  try {
    const response = await axios.post(
      `${process.env.STABILITY_API_BASE || 'https://api.stability.ai'}/v2beta/image-to-image/${DEFAULT_ENGINE}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data || error.message;
    logger.error('Stability API error', { status, message });
    throw new Error('Stability API request failed');
  }
};
