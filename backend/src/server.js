const express = require('express');
const cors = require('cors');
const path = require('path');
const orcamentoRoutes = require('./routes/orcamento.routes');
const empresaRoutes = require('./routes/empresa.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, '../../frontend')));

app.use('/empresa', empresaRoutes);
app.use('/orcamentos', orcamentoRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

function startServer(port = process.env.PORT || 3000) {
  return app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
