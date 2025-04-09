const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const API_TOKEN = "I2jITn6D1WdRllkVSZUfv2cPRayCoCVl1YQq78WOTcl6XYZQssfitEpNXQKc";

// IDs de ligas: exemplo com Champions League (2), Premier League (8), La Liga (564), Bundesliga (82), Brasileirão (71)
const LEAGUES = [2, 8, 564, 82, 71];

app.get("/over15", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await axios.get(`https://api.sportmonks.com/v3/football/fixtures`, {
      params: {
        api_token: API_TOKEN,
        include: "scores,teams",
        filters: {
          date: today,
          league_ids: LEAGUES.join(",")
        }
      }
    });

    // Filtrando jogos com mais de 90% de chance estimada de Over 1.5 (exemplo: baseada em média de gols anteriores fictícia aqui)
    const jogosFiltrados = response.data.data.filter(jogo => {
      const totalGoals =
        (jogo?.scores?.home_score || 0) + (jogo?.scores?.away_score || 0);
      return totalGoals >= 2; // Apenas para exemplo, você pode usar estatísticas reais depois
    });

    res.json(jogosFiltrados);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao buscar dados da API Sportmonks" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});
