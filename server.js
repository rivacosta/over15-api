const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('API Over 1.5 Gols está online!');
});

// 👉 Aqui está a rota /over15 funcionando!
app.get('/over15', (req, res) => {
  res.json({
    message: 'API funcionando! Em breve os dados reais aparecerão aqui.',
    status: 'ok'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
