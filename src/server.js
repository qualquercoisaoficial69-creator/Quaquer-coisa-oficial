import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor Qualquer Coisa Rápido rodando na porta ${PORT}`);
  console.log(`🌐 Site (Frontend): http://localhost:${PORT}/home.html`);
  console.log(`🛠️ Painel CMS:     http://localhost:${PORT}/cms.html`);
  console.log(`📡 API Status:     http://localhost:${PORT}/api/health`);
  console.log(`📂 Uploads:        http://localhost:${PORT}/uploads`);
});
