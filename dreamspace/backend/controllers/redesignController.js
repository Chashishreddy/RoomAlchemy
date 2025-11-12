import { redesignRoom } from '../services/stabilityService.js';
import logger from '../services/logger.js';

export const redesign = async (req, res, next) => {
  try {
    const { style } = req.body;
    const ip = req.ip;
    const userRole = req.user?.role || 'guest';

    const generatedBuffer = await redesignRoom(req.file.buffer, style);

    logger.info('Redesign completed', {
      ip,
      style,
      userRole,
      fileSize: req.file.size
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="dreamspace-redesign.png"');
    return res.status(200).send(generatedBuffer);
  } catch (error) {
    return next(error);
  }
};
