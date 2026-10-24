import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    // Em ambientes serverless read-only, pode não permitir criar pastas
  }
}

// Usar memória para processamento compatível com Vercel
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

const router = Router();

// Função auxiliar para enviar para o ImgBB (Nuvem Grátis de Imagens)
async function uploadToImgBB(fileBuffer, apiKey) {
  const base64Image = fileBuffer.toString('base64');
  const formData = new URLSearchParams();
  formData.append('image', base64Image);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error?.message || 'Erro ao enviar para o ImgBB.');
  }

  return data.data.url;
}

// Upload de imagem única
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const imgbbKey = process.env.IMGBB_API_KEY;

    // Se tiver a chave do ImgBB configurada na Vercel, envia para a nuvem permanente
    if (imgbbKey) {
      const publicUrl = await uploadToImgBB(req.file.buffer, imgbbKey);
      return res.json({
        message: 'Upload realizado na nuvem com sucesso!',
        url: publicUrl
      });
    }

    // Se estiver rodando localmente sem ImgBB, salva na pasta uploads local
    try {
      const ext = path.extname(req.file.originalname) || '.png';
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      return res.json({
        message: 'Upload local realizado com sucesso!',
        url: `/uploads/${filename}`
      });
    } catch (fsErr) {
      // Fallback para Data URI em serverless sem chave ImgBB
      const mime = req.file.mimetype || 'image/png';
      const base64 = req.file.buffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      return res.json({
        message: 'Upload processado com sucesso!',
        url: dataUri
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro no upload: ' + err.message });
  }
});

export default router;
