const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const API_TOKEN = "I2jITn6D1WdRllkVSZUfv2cPRayCoCVl1YQq78WOTcl6XYZQssfitEpNXQKc";

// IDs de ligas: exemplo com Champions League (2), Premier League (8), La Liga (564), Bundesliga (82), Brasileirão (71)
const LEAGUES = [2, 8, 564, 82, 71];

app.get('/over05ht', async (req, res) => {
  try {
    const response = await fetch('https://api.sportmonks.com/v3/football/fixtures?include=localTeam;visitorTeam&filter[starts_between]=today,today&api_token=' + API_TOKEN);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados de jogos.' });
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
app.get('/over05ht', async (req, res) => {
  try {
    const today = new Date();
    const ano = today.getFullYear();
    const mes = String(today.getMonth() + 1).padStart(2, '0');
    const dia = String(today.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    const url = `https://api.sportmonks.com/v3/football/fixtures/date/${dataFormatada}?api_token=${API_TOKEN}&include=stats`;
    const response = await axios.get(url);
    const jogos = response.data.data;

    const filtrados = jogos.filter(jogo => {
      const stats = jogo.stats?.data;
      if (!stats) return false;

      const golsHT = stats.find(stat => stat.type === 'score' && stat.period === '1stHalf');
      if (!golsHT || !golsHT.goals) return false;

      return golsHT.goals.home + golsHT.goals.away >= 1;
    });

    res.json(filtrados);
  } catch (error) {
    console.error('Erro ao buscar dados:', error.message);
    res.status(500).json({ erro: 'Erro ao buscar os dados do primeiro tempo' });
  }
});
