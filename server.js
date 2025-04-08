const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());

const API_TOKEN = 'I2jITn6D1WdRllkVSZUfv2cPRayCoCVl1YQq78WOTcl6XYZQssfitEpNXQKc';

const ligasImportantes = [
  2,    // UCL
  8,    // Premier League
  384,  // La Liga
  82,   // Bundesliga
  71,   // Brasileirão
  5,    // Serie A
  301,  // Argentina
];

app.get('/over15', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const url = `https://api.sportmonks.com/v3/football/fixtures/date/${today}?api_token=${API_TOKEN}&include=stats,participants,league`;

    const response = await axios.get(url);
    const jogos = response.data.data;

    const filtrados = jogos.filter(jogo => {
      const liga = jogo.league?.id;
      if (!ligasImportantes.includes(liga)) return false;

      const stats = jogo.stats || [];

      const golsTime1 = stats[0]?.goals || 0;
      const golsTime2 = stats[1]?.goals || 0;
      const mediaGols = (golsTime1 + golsTime2) / 2;

      return mediaGols >= 1.5;
    });

    res.json({
      total: filtrados.length,
      partidas: filtrados.map(j => ({
        time1: j.participants[0]?.name,
        time2: j.participants[1]?.name,
        liga: j.league?.name,
        horario: j.starting_at,
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

app.listen(10000, () => console.log('Servidor rodando na porta 10000'));
