const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config(); // Carrega as variáveis de ambiente

const app = express();
app.use(cors());

// Usa a variável de ambiente para o token da API
const API_TOKEN = process.env.API_TOKEN || "seu_token_aqui"; // Use a variável de ambiente para segurança

const PORT = process.env.PORT || 10000;

// Rota: Jogos de hoje
app.get('/api/jogos-hoje', async (req, res) => {
  try {
    const today = new Date();
    const ano = today.getFullYear();
    const mes = String(today.getMonth() + 1).padStart(2, '0');
    const dia = String(today.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    const url = `https://api.sportmonks.com/v3/football/fixtures/date/${dataFormatada}?api_token=${API_TOKEN}&include=localTeam;visitorTeam;goals`;

    const response = await axios.get(url);

    // Log no terminal do Render para debug
    console.log("✅ Dados recebidos da Sportmonks:");
    console.log(JSON.stringify(response.data, null, 2));

    res.json(response.data); // Envia a resposta crua pro front-end
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    // Detalha a resposta de erro para facilitar o diagnóstico
    res.status(500).json({ erro: 'Erro ao buscar os dados do primeiro tempo', detalhes: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});
