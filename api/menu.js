
import { Redis } from '@upstash/redis';
import { put } from '@vercel/blob';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  // 1. GET: Send the live menu to customers' screens
  if (req.method === 'GET') {
    try {
      const menu = await redis.get('sb_menu');
      return res.status(200).json(menu || []);
    } catch (error) {
      return res.status(500).json([]);
    }
  }

  // 2. POST: Handle admin updates and photo uploads
  if (req.method === 'POST') {
    const { action, menuData, imageBase64, extension } = req.body;

    // ACTION: Upload a new photo to Vercel Blob
    if (action === 'upload_image' && imageBase64) {
      try {
        const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const blob = await put(`menu/${Date.now()}.${extension}`, buffer, { 
          access: 'public', 
          contentType: `image/${extension}` 
        });
        return res.status(200).json({ url: blob.url });
      } catch (error) {
        return res.status(500).json({ error: "Image upload failed" });
      }
    }

    // ACTION: Save the updated menu list to Upstash Redis
    if (action === 'save_menu' && menuData) {
      try {
        await redis.set('sb_menu', menuData);
        return res.status(200).json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: "Menu save failed" });
      }
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}
