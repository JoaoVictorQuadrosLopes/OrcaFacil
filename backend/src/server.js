const express = require('express');
const cors = require('cors');
const orcamentoRoutes = require('./routes/orcamento.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/orcamentos', orcamentoRoutes);

app.get('/', (req, res) => {
  res.send('API JGL Orçamentos rodando!');
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});