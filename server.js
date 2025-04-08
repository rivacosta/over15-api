const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

const API_KEY = '1744145786o4z8g2eTlxQV3NmWyDZvusECwIhFc7dUiqLRM15f';
const API_BASE = 'https://v3.football.api-sports.io';

const ligasPermitidas = [2, 39, 3, 140, 78, 71, 128];

app.get('/over15', async (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];
  try {
    const jogosResp = await axios.get(`${API_BASE}/fixtures?date=${hoje}`, {
      headers: { 'x-apisports-key': API_KEY }
    });

    const jogos = jogosResp.data.response.filter(j => ligasPermitidas.includes(j.league.id));
    const resultados = [];

    for (const jogo of jogos.slice(0, 20)) {
      try {
        const homeStats = await axios.get(`${API_BASE}/teams/statistics?team=${jogo.teams.home.id}&season=2024&league=${jogo.league.id}`, {
          headers: { 'x-apisports-key': API_KEY }
        });
        const awayStats = await axios.get(`${API_BASE}/teams/statistics?team=${jogo.teams.away.id}&season=2024&league=${jogo.league.id}`, {
          headers: { 'x-apisports-key': API_KEY }
        });

        const mediaGols = (
          homeStats.data.response.goals.for.total.total / homeStats.data.response.fixtures.played.total +
          homeStats.data.response.goals.against.total.total / homeStats.data.response.fixtures.played.total +
          awayStats.data.response.goals.for.total.total / awayStats.data.response.fixtures.played.total +
          awayStats.data.response.goals.against.total.total / awayStats.data.response.fixtures.played.total
        );

        if (mediaGols > 2.2) {
          resultados.push({
            partida: `${jogo.teams.home.name} vs ${jogo.teams.away.name}`,
            campeonato: jogo.league.name,
            horario: jogo.fixture.date,
            mediaGols: mediaGols.toFixed(2)
          });
        }
      } catch (error) {
        console.log("Erro nas stats:", error.message);
      }
    }

    res.json(resultados);

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar dados" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
