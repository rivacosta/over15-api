const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const API_TOKEN = "I2jITn6D1WdRllkVSZUfv2cPRayCoCVl1YQq78WOTcl6XYZQssfitEpNXQKc";

// Rota: Jogos com dados do dia (sem incluir 'stats')
app.get('/api/jogos-hoje', async (req, res) => {
  try {
    const today = new Date();
    const ano = today.getFullYear();
    const mes = String(today.getMonth() + 1).padStart(2, '0');
    const dia = String(today.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    // 🚫 Removido o "stats" do include
    const url = `https://api.sportmonks.com/v3/football/fixtures/date/${dataFormatada}?api_token=${API_TOKEN}&include=localTeam;visitorTeam`;

    const response = await axios.get(url);

    console.log("✅ Dados recebidos da Sportmonks:");
    console.log(JSON.stringify(response.data, null, 2));

    res.json(response.data);
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.response?.data || error.message);
    res.status(500).json({ erro: 'Erro ao buscar os dados do primeiro tempo' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});
