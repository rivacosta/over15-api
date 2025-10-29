/**
 * utils.js
 * * Este ficheiro contém funções auxiliares para simular a busca de estatísticas de ataque
 * e defesa (FA/FD) dos times, que são necessárias para o modelo de Poisson.
 * * NOTA: Num projeto real, esta função faria uma busca complexa na sua base de dados
 * de estatísticas históricas para calcular o FA, FD e a Média de Gols da liga.
 */

// Simula a obtenção de estatísticas de ataque e defesa dos times.
// O cálculo real requer análise de jogos passados, mas aqui usamos dados estáticos para testar a lógica do modelo.
function simulateMatchStats(localTeamId, visitorTeamId) {
    console.log(`Buscando estatísticas simuladas para os times: ${localTeamId} vs ${visitorTeamId}`);
    
    // Os valores de FA (Força de Ataque) e FD (Força de Defesa) são números que representam
    // o quão acima ou abaixo da média da liga um time se encontra.
    
    // Exemplo de valores:
    // 1.5 = 50% mais forte no ataque que a média
    // 0.8 = 20% mais forte na defesa que a média (ou seja, sofre 20% menos gols)

    // Simulamos que as estatísticas variam ligeiramente.
    const base = 1.0;
    const variacao = 0.25;

    // Gerar valores aleatórios para simular diferentes cenários de jogo
    const stats = {
        // Estatísticas do Time da Casa (Local Team)
        faHome: base + Math.random() * variacao, // Força de Ataque (Local)
        fdHome: base - Math.random() * variacao, // Força de Defesa (Local)

        // Estatísticas do Time Visitante (Visitor Team)
        faAway: base + Math.random() * variacao, // Força de Ataque (Visitante)
        fdAway: base - Math.random() * variacao, // Força de Defesa (Visitante)

        // Média de Gols da Liga (Este valor deve ser constante para uma determinada liga)
        leagueAvgGoals: 2.7 + Math.random() * 0.3 // Ex: 2.7 a 3.0 gols por jogo na liga
    };

    // Arredondar para simplificar a visualização
    stats.faHome = parseFloat(stats.faHome.toFixed(2));
    stats.fdHome = parseFloat(stats.fdHome.toFixed(2));
    stats.faAway = parseFloat(stats.faAway.toFixed(2));
    stats.fdAway = parseFloat(stats.fdAway.toFixed(2));
    stats.leagueAvgGoals = parseFloat(stats.leagueAvgGoals.toFixed(2));

    return stats;
}


/**
 * Função auxiliar para calcular a Probabilidade Implícita (PI)
 * A PI é a probabilidade que a casa de apostas "implica" na sua odd.
 * PI = 1 / Odd
 */
function calculateImpliedProbability(odd) {
    if (odd <= 1.0) return 1.0; // Evita divisão por zero ou odds irreais
    return 1 / odd;
}


module.exports = {
    simulateMatchStats,
    calculateImpliedProbability
};
