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
    // Saímos para evitar falhas de requisição 401
    // return process.exit(1); 
    // Em produção, a linha acima seria ativada. Deixamos desativada para que a API inicie e mostre o erro no navegador.
} else {
    console.log(`✅ Token Carregado: ${API_TOKEN.substring(0, 5)}...`);
}

// === ROTAS DA API ===

// Rota Principal: Busca jogos, aplica o modelo e calcula o valor
app.get('/api/previsoes-over-15', async (req, res) => {
    // 1. Configura a data de hoje para a busca na Sportmonks
    const today = new Date();
    const ano = today.getFullYear();
    const mes = String(today.getMonth() + 1).padStart(2, '0');
    const dia = String(today.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    // Endpoint da Sportmonks para jogos de hoje, incluindo times e odds (+1.5 Gols)
    // CORREÇÃO: Simplificamos o parâmetro 'include' para evitar o erro 404 (Request failed).
    // Pedimos 'participants' (times) e 'odds' (todas as odds).
    const url = `https://api.sportmonks.com/v3/football/fixtures/date/${dataFormatada}?api_token=${API_TOKEN}&include=participants;odds`;

    console.log(`\n➡️ Buscando jogos e odds para ${dataFormatada}...`);

    try {
        const response = await axios.get(url);
        const fixtures = response.data.data;
        
        if (!fixtures || fixtures.length === 0) {
            console.log("✅ Nenhuma partida encontrada para hoje.");
            return res.status(200).json({ mensagem: "Nenhuma partida encontrada ou erro ao extrair dados.", previsoes: [] });
        }

        const previsoesFinais = [];

        // 2. Itera sobre cada jogo e aplica o modelo
        for (const fixture of fixtures) {

            // === EXTRAÇÃO DE DADOS APÓS A CORREÇÃO DA API ===
            // Na V3, as equipes (participants) vêm em um array e você precisa identificar quem é local e quem é visitante.
            const localTeam = fixture.participants.find(p => p.pivot.location === 'home');
            const visitorTeam = fixture.participants.find(p => p.pivot.location === 'away');

            if (!localTeam || !visitorTeam) {
                previsoesFinais.push({
                    id: fixture.id,
                    mandante: "DESCONHECIDO",
                    visitante: "DESCONHECIDO",
                    status: "ERRO DE EXTRAÇÃO DE TIMES",
                    detalhe: "Não foi possível identificar o time local ou visitante no array 'participants'."
                });
                continue;
            }
            
            // Tenta encontrar as odds de +1.5 Gols (Assumindo OID 144 para Over/Under 1.5)
            // Agora filtramos no JS, pois a URL simplificada traz todas as odds.
            const market15 = fixture.odds.find(odd => 
                odd.market_id === 144 || (odd.name && (odd.name.includes("1.5") || odd.name.includes("Over"))));

            if (!market15 || !market15.bookmaker || market15.bookmaker.length === 0) {
                // Se as odds não estiverem disponíveis, pula o jogo
                previsoesFinais.push({
                    id: fixture.id,
                    mandante: localTeam.name, // Usando a variável corrigida
                    visitante: visitorTeam.name, // Usando a variável corrigida
                    status: "ODDS INDISPONÍVEIS",
                    detalhe: "Não foi possível encontrar o mercado Over/Under 1.5 nas odds."
                });
                continue;
            }
            
            // Extrai a Odd de Over 1.5 Gols (Assumindo que o primeiro odd é o Over)
            // IMPORTANTE: Isso é uma simplificação. A Sportmonks tem códigos específicos para 'Over' e 'Under'.
            // Aqui, usamos a primeira odd disponível do mercado 144 como simulação do Over 1.5.
            const oddData = market15.bookmaker[0].odds.find(o => o.label.includes('Over') || o.label === '1.5');
            const oddOver15 = oddData ? parseFloat(oddData.value) : 0;
            
            if (oddOver15 === 0) {
                previsoesFinais.push({
                    id: fixture.id,
                    mandante: localTeam.name, // Usando a variável corrigida
                    visitante: visitorTeam.name, // Usando a variável corrigida
                    status: "ODD 1.5 NÃO ENCONTRADA",
                    detalhe: "O valor da odd Over 1.5 é zero ou não foi extraído corretamente."
                });
                continue;
            }

            // 3. Obtém as estatísticas necessárias (FA, FD, Média da Liga)
            // Os IDs usados aqui são os IDs dos participantes
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
                liga: fixture.league_id,
                mandante: localTeam.name, // Usando a variável corrigida
                visitante: visitorTeam.name, // Usando a variável corrigida
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
            res.status(error.response.status).json({ 
                erro: `Erro na API Sportmonks. Status: ${error.response.status}`, 
                detalhes: error.response.data || 'Sem dados adicionais. Verifique o API_TOKEN.'
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
