const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Servir arquivos estáticos do diretório 'public'
app.use(express.static("public"));

// Rota para /over15
app.get("/over15", (req, res) => {
  res.json({ message: "API funcionando! Em breve os dados reais aparecerão aqui." });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
