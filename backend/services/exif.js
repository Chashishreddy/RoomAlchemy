import sharp from 'sharp';

export const stripMetadata = async (buffer) => {
  const { data, info } = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, info };
};
