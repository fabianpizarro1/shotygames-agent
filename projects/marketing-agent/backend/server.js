require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateStrategy } = require('./agent');
const sheets = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3600;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const DEMO_RESPONSE = {
  investigacion: `Análisis para "${'{msg}'}" — Shotygames compite en el segmento de entretenimiento para fiestas en Ecuador. La competencia directa son juegos importados como UNO Borracho y apps gratuitas del celular. El GAP principal: ningún competidor local tiene un producto físico diseñado para el contexto ecuatoriano con entrega a todo el país. Los mejores ángulos no explotados son: (1) el momento "pre-copa" donde el grupo necesita algo para arrancar la noche, (2) el ángulo de regalo original para quien no sabe qué comprar, y (3) la transformación social — pasar de reunión aburrida a noche épica. El nivel de consciencia más rentable para audiencia fría es "consciente del problema" (saben que las fiestas son aburridas, no conocen Shotygames).`,
  estrategia: {
    objetivo: 'Generar primera compra en audiencia fría que conoce el problema pero no el producto',
    producto: 'Torre de Shots Normal ($20)',
    audiencia: 'Hombres y mujeres 20-32 años, Ecuador, que organizan o asisten a reuniones con amigos los fines de semana',
    nivel_consciencia: 'Consciente del problema',
    descripcion: 'Atacar el momento exacto del dolor: cuando el grupo está reunido y no sabe qué hacer. Usar el formato headliner con copy que llame por nombre al organizador de la fiesta. El mensaje central: tú eres el responsable de que la noche sea épica o aburrida — Shotygames te da la ventaja.',
    formatos_sugeridos: ['Headliner (texto como focal point)', 'Transformación (antes/después)', 'Infográfico educativo']
  },
  prompts: [
    {
      angulo: 'El organizador de la fiesta',
      formato: 'Headliner',
      copy_headline: '¿Tú eres el que siempre organiza las reuniones? Entonces necesitas esto.',
      prompt_imagen: 'Photorealistic lifestyle photo, group of 5 young Ecuadorian adults aged 22-28, laughing and playing a drinking tower game at a home party in Quito, warm cozy living room with fairy lights, wooden table with shot glasses and the tower game in center, natural candid expressions of joy and surprise, one person pulling a wooden block, others watching with anticipation, cinematic lighting, 35mm lens, shallow depth of field, no AI artifacts, looks like a real Instagram photo'
    },
    {
      angulo: 'La fiesta aburrida vs épica',
      formato: 'Transformación (antes/después)',
      copy_headline: 'Antes: "¿Y qué hacemos?" — Después: risas que duran hasta las 3am',
      prompt_imagen: 'Split screen photorealistic image, left side: bored group of young Ecuadorian friends sitting awkwardly on couch staring at phones, muted blue tones, right side: same group energetically playing a wooden shot tower game, warm golden lighting, laughing and celebrating, one person triumphantly raising arms, shot glasses visible, vibrant party atmosphere, authentic candid moment, shot on Sony A7 camera, no AI look'
    },
    {
      angulo: 'Regalo original',
      formato: 'Benefits callout',
      copy_headline: 'El regalo que sí van a usar — no el que guardan en el cajón',
      prompt_imagen: 'Photorealistic flat lay product photography, Shotygames wooden tower game elegantly gift-wrapped with kraft paper and twine, surrounded by shot glasses, confetti, and a small birthday card, warm background of wooden table with soft natural light from side window, clean composition, editorial style, looks like a premium lifestyle brand photo, high detail on wood grain texture, no people visible, soft bokeh background'
    }
  ]
};

// POST /api/generate — agente genera estrategia + prompts
app.post('/api/generate', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'message requerido' });

  try {
    const result = await generateStrategy(message, history || []);
    const saved = await sheets.saveGeneration(message, result);
    res.json({ ...result, ...saved });
  } catch (err) {
    // Si falla por créditos, devolver demo con aviso
    if (err.message?.includes('credit balance') || err.message?.includes('billing')) {
      console.log('Sin créditos Anthropic — usando modo demo');
      const demo = JSON.parse(JSON.stringify(DEMO_RESPONSE));
      demo.investigacion = demo.investigacion.replace('{msg}', message);
      demo._demo = true;
      res.json(demo);
      return;
    }
    console.error('Error generate:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/prompts
app.get('/api/history/prompts', async (req, res) => {
  try {
    const rows = await sheets.getRows('Prompts');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/estrategias
app.get('/api/history/estrategias', async (req, res) => {
  try {
    const rows = await sheets.getRows('Estrategias');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/image/:promptId — subir imagen generada
app.post('/api/image/:promptId', upload.single('image'), async (req, res) => {
  const { promptId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });

  const imageUrl = `/uploads/${req.file.filename}`;
  try {
    await sheets.updatePromptImage(promptId, imageUrl);
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/feedback/:promptId
app.post('/api/feedback/:promptId', async (req, res) => {
  const { promptId } = req.params;
  const { feedback } = req.body;
  try {
    await sheets.updatePromptFeedback(promptId, feedback);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/knowledge — subir documento de conocimiento
app.post('/api/knowledge', upload.single('document'), async (req, res) => {
  const { titulo, tipo } = req.body;
  let contenido = req.body.contenido || '';

  if (req.file) {
    try {
      contenido = fs.readFileSync(req.file.path, 'utf-8');
    } catch (e) {
      contenido = `[Archivo binario: ${req.file.originalname}]`;
    }
  }

  if (!contenido) return res.status(400).json({ error: 'Contenido requerido' });

  try {
    // Pedirle al agente que analice cómo aplicar esto a Shotygames
    const analysis = await generateStrategy(
      `Analiza este documento y dime específicamente cómo podemos aplicar estas ideas a la estrategia de marketing de Shotygames. El documento se titula "${titulo}" y dice: ${contenido.slice(0, 3000)}`
    );
    const resumen = analysis.investigacion || '';
    await sheets.saveKnowledge(titulo, tipo || 'Documento', contenido, resumen);
    res.json({ ok: true, resumen });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/knowledge
app.get('/api/knowledge', async (req, res) => {
  try {
    const rows = await sheets.getRows('Conocimiento');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Marketing Agent backend corriendo en puerto ${PORT}`));
