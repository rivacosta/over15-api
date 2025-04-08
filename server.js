const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Rota principal só pra teste
app.get("/", (req, res) => {
  res.send("API Over 1.5 ativa!");
});

// Rota com dados (pode atualizar depois com dados reais)
app.get("/over15", (req, res) => {
  res.json({
    message: "API funcionando! Em breve os dados reais aparecerão aqui.",
    status: "ok"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
