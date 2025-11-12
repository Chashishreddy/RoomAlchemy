import axios from 'axios';
import sharp from 'sharp';
import config from '../config.js';

const ENGINE_ID = 'stable-diffusion-xl-1024-v1-0';

const buildPrompt = (style) => `Interior design photograph, ${style} style, realistic lighting, ultra-detailed, magazine quality`;

export const stripMetadataToPng = async (buffer) => {
  return sharp(buffer)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .withMetadata({})
    .toBuffer();
};

export const redesignRoom = async (imageBuffer, style) => {
  if (!config.stabilityApiKey) {
    const error = new Error('Stability API key is not configured.');
    error.status = 500;
    throw error;
  }

  const sanitizedBuffer = await stripMetadataToPng(imageBuffer);
  const prompt = buildPrompt(style);

  try {
    const response = await axios.post(
      `${config.stabilityApiBase}/v1/generation/${ENGINE_ID}/image-to-image`,
      {
        image_strength: 0.65,
        init_image_mode: 'IMAGE_STRENGTH',
        text_prompts: [
          { text: prompt, weight: 1 },
          { text: 'blurry, distorted, low quality, watermark', weight: -1 }
        ],
        init_image: sanitizedBuffer.toString('base64')
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${config.stabilityApiKey}`
        },
        timeout: 120000
      }
    );

    const artifact = response.data?.artifacts?.[0];
    if (!artifact?.base64) {
      const error = new Error('No image returned from Stability API');
      error.status = 502;
      throw error;
    }

    return Buffer.from(artifact.base64, 'base64');
  } catch (error) {
    if (error.response) {
      const apiError = new Error(`Stability API error: ${error.response.statusText}`);
      apiError.status = error.response.status === 401 ? 502 : 500;
      apiError.details = error.response.data;
      throw apiError;
    }
    if (error.request) {
      const networkError = new Error('No response from Stability API');
      networkError.status = 504;
      throw networkError;
    }
    throw error;
  }
};
