const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/over15", async (req, res) => {
  res.json({ message: "API funcionando! Em breve os dados reais aparecerão aqui." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
