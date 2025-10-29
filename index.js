/**
 * index.js
 * Ponto de entrada da API.
 * Responsável por:
 * 1. Configurar o servidor Express.
 * 2. Carregar variáveis de ambiente (API_TOKEN).
 * 3. Buscar jogos do dia na Sportmonks.
 * 4. Aplicar o Modelo de Predição (Poisson) para calcular o "Valor".
 */
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config(); // Carrega as variáveis de ambiente

// Importa a lógica de predição e as funções auxiliares
const { calculateOver15Probability, calculateValue } = require("./prediction_model");
const { simulateMatchStats, calculateImpliedProbability } = require("./utils");

const app = express();
app.use(cors());
app.use(express.json());

// === CONFIGURAÇÃO E VERIFICAÇÃO DE AMBIENTE ===

const API_TOKEN = process.env.API_TOKEN;
const PORT = process.env.PORT || 10000;

// Log de verificação do Token de Emergência
if (!API_TOKEN || API_TOKEN === "INSIRA_O_SEU_TOKEN_REAL_AQUI" || API_TOKEN === "seu_token_aqui") {
    console.error("❌ ERRO CRÍTICO: O API_TOKEN não foi carregado corretamente.");
    console.error("Por favor, verifique se o ficheiro .env existe na raiz do projeto e contém o seu token real.");
    // Deixamos a linha de saída comentada para que a API inicie e mostre o erro no navegador, se necessário.
} else {
    console.log(`✅ Token Carregado: ${API_TOKEN.substring(0, 5)}...`);
}

// === ROTAS DA API ===

// Rota Principal: Busca jogos, aplica o modelo e calcula o valor
app.get('/api/previsoes-over-15', async (req, res) => {
    // 1. Configura a data de hoje para a busca na Sportmonks
    // A data será a data do sistema para garantir que haja jogos no dia de hoje.
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dataFormatada = `${year}-${month}-${day}`;
    // FIM DA CORREÇÃO

    // Endpoint da Sportmonks para jogos, incluindo times, liga e odds.
    // O 'include' foi corrigido para 'participants.team;league;odds' para evitar o erro 404 da API V3.
    const url = `https://api.sportmonks.com/v3/football/fixtures/date/${dataFormatada}?api_token=${API_TOKEN}&include=participants.team;league;odds`;

    console.log(`\n➡️ Buscando jogos e odds para ${dataFormatada}...`);

    try {
        const response = await axios.get(url);
        const fixtures = response.data.data;
        
        if (!fixtures || fixtures.length === 0) {
            console.log("✅ Nenhuma partida encontrada para a data de teste.");
            return res.status(200).json({ mensagem: "Nenhuma partida encontrada ou erro ao extrair dados.", previsoes: [] });
        }

        const previsoesFinais = [];

        // 2. Itera sobre cada jogo e aplica o modelo
        for (const fixture of fixtures) {

            // Extrai as equipes. Na V3, as equipes (participants) vêm em um array.
            const localTeam = fixture.participants.find(p => p.pivot.location === 'home');
            const visitorTeam = fixture.participants.find(p => p.pivot.location === 'away');

            if (!localTeam || !visitorTeam) {
                previsoesFinais.push({
                    id: fixture.id,
                    status: "ERRO DE EXTRAÇÃO DE TIMES",
                    detalhe: "Não foi possível identificar o time local ou visitante no array 'participants'."
                });
                continue;
            }
            
            // Tenta encontrar as odds de +1.5 Gols (Assumindo Market ID 144 para Over/Under 1.5)
            const market15 = fixture.odds.find(odd => 
                odd.market_id === 144 || (odd.name && (odd.name.includes("1.5"))));

            if (!market15 || !market15.bookmaker || market15.bookmaker.length === 0) {
                previsoesFinais.push({
                    id: fixture.id,
                    mandante: localTeam.name,
                    visitante: visitorTeam.name,
                    status: "ODDS INDISPONÍVEIS",
                    detalhe: "Não foi possível encontrar o mercado Over/Under 1.5."
                });
                continue;
            }
            
            // Extrai a Odd de Over 1.5 Gols (Procura a odd com 'Over' ou '1.5')
            const oddData = market15.bookmaker[0].odds.find(o => 
                o.label.includes('Over') || o.label.includes('1.5'));
            
            const oddOver15 = oddData ? parseFloat(oddData.value) : 0;
            
            if (oddOver15 === 0) {
                previsoesFinais.push({
                    id: fixture.id,
                    mandante: localTeam.name,
                    visitante: visitorTeam.name,
                    status: "ODD 1.5 NÃO ENCONTRADA",
                    detalhe: "O valor da odd Over 1.5 é zero ou não foi extraído corretamente."
                });
                continue;
            }

            // 3. Obtém as estatísticas necessárias (FA, FD, Média da Liga) - **USANDO SIMULAÇÃO**
            // IMPORTANTE: Aqui você deve implementar a busca REAL na sua DB de estatísticas.
            const stats = simulateMatchStats(localTeam.id, visitorTeam.id);

            // 4. Aplica o Modelo de Predição (Poisson)
            const probabilidadeModelo = calculateOver15Probability(stats);
            
            // 5. Calcula a Probabilidade Implícita e o Expected Value (EV)
            const probabilidadeImplicita = calculateImpliedProbability(oddOver15);
            const value = calculateValue(probabilidadeModelo, oddOver15); // > 0 indica Value Bet
            
            // 6. Define a Oportunidade (Filtro de Valor)
            const oportunidade = value > 0.10; // Filtro: Aposta de valor se EV for superior a 10%
            
            previsoesFinais.push({
                id: fixture.id,
                liga_nome: fixture.league ? fixture.league.name : 'N/A',
                mandante: localTeam.name,
                visitante: visitorTeam.name,
                odd_over_1_5: oddOver15.toFixed(2),
                
                // Resultados do Modelo
                prob_modelo: (probabilidadeModelo * 100).toFixed(2) + '%',
                prob_implicita: (probabilidadeImplicita * 100).toFixed(2) + '%',
                
                // Decisão Final
                value_bet: value.toFixed(4),
                oportunidade_valor: oportunidade
            });
        }
        
        console.log(`✅ Previsões geradas para ${previsoesFinais.length} jogos.`);
        res.json({
            data: previsoesFinais
        });

    } catch (error) {
        // Log detalhado para diagnosticar erros de API ou token
        if (error.response) {
            // Erros como 401 (Token Inválido) ou 404 (Endpoint não encontrado)
            console.error(`❌ Erro Sportmonks (Status: ${error.response.status}): ${error.message}`);
            // Mostra o erro detalhado no navegador
            res.status(error.response.status).json({ 
                erro: `Erro na API Sportmonks. Status: ${error.response.status}`, 
                detalhes: error.response.data || 'Resposta da API vazia. Verifique o API_TOKEN ou o URL.'
            });
        } else {
            // Erros de rede, DNS ou código interno
            console.error('❌ Erro de Rede ou Código:', error.message);
            res.status(500).json({ erro: 'Erro interno ao processar a requisição', detalhes: error.message });
        }
    }
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`\n✅ API rodando na porta ${PORT}`);
});
