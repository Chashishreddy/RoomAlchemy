import crypto from 'crypto';
import { stripMetadata } from '../services/exif.js';
import { scanBuffer } from '../services/avScan.js';
import { redesignImage } from '../services/stabilityClient.js';
import { logRedesignEvent } from '../middleware/logging.js';
import { consumeQuota } from '../utils/quotas.js';
import { isAuthOptional } from '../middleware/auth.js';

const STYLE_PRESETS = {
  minimalist: 'Minimalist',
  japandi: 'Japandi',
  cozy_scandinavian: 'Cozy Scandinavian',
  luxury_modern: 'Luxury Modern',
  cyberpunk_neon: 'Cyberpunk Neon',
  warm_boho: 'Warm Boho'
};

const getQuotaLimit = () => Number(process.env.GUEST_DAILY_QUOTA) || 3;

export const redesignRoom = async (req, res, next) => {
  try {
    const { style } = req.body;
    if (!style) {
      return res.status(400).json({ error: 'invalid_style', message: 'Style is required.' });
    }

    const styleKey = style.toLowerCase().replace(/\s+/g, '_');
    const resolvedStyle = STYLE_PRESETS[styleKey];
    if (!resolvedStyle) {
      return res.status(400).json({ error: 'invalid_style', message: 'Unsupported style selected.' });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'invalid_image', message: 'Image upload is required.' });
    }

    const role = req.user?.role;
    const userId = req.user?.id;

    const quotaLimit = getQuotaLimit();
    if (role === 'guest' || (!role && isAuthOptional())) {
      const quotaKey = userId ? `guest:${userId}` : `guest:${req.ip}`;
      const quota = consumeQuota(quotaKey, quotaLimit);
      if (!quota.allowed) {
        return res.status(403).json({
          error: 'quota_exceeded',
          message: 'Guest design quota reached. Sign in for unlimited designs.',
          resetAt: quota.resetAt
        });
      }
    }

    const { buffer: cleanBuffer } = await stripMetadata(req.file.buffer);
    await scanBuffer(cleanBuffer);

    const outputBuffer = await redesignImage({
      imageBuffer: cleanBuffer,
      promptStyle: resolvedStyle
    });

    logRedesignEvent({
      style: resolvedStyle,
      success: true,
      inputSize: req.file.size,
      outputSize: outputBuffer.length,
      userId: userId || null,
      role: role || (isAuthOptional() ? 'guest' : 'anonymous'),
      ip: req.ip
    });

    res.setHeader('Content-Type', 'image/png');
    const filename = `roomalchemy-${resolvedStyle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(6).toString('hex')}.png`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(outputBuffer);
  } catch (error) {
    logRedesignEvent({
      style: req.body?.style,
      success: false,
      error: error.message,
      userId: req.user?.id || null,
      role: req.user?.role || null,
      ip: req.ip
    });
    if (error.message === 'Stability API request failed') {
      return res.status(502).json({ error: 'upstream_error', message: 'AI rendering service is unavailable. Please try again later.' });
    }
    next(error);
  } finally {
    if (req.file) {
      req.file.buffer = null;
    }
  }
};

export const availableStyles = Object.values(STYLE_PRESETS);
