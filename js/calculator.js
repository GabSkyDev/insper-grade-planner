// A função recebe o índice da matéria, o curso e o semestre atual
function calcularNota(mIdx, curso, semestre) {
    // Busca os dados atualizados diretamente da variável global preenchida pelo app.js
    const materia = window.catalogoInsper[curso][semestre][mIdx];
    
    let mediaFinal = 0;
    let pesoTotalInformado = 0;
    
    let pfIdx = -1;
    let pfPeso = 0;
    let notaAcumuladaSemPF = 0;

    // Processa avaliações originais do catálogo
    materia.avaliacoes.forEach((av, aIdx) => {
        const pesoEl = document.getElementById(`peso-${mIdx}-${aIdx}`);
        const notaEl = document.getElementById(`nota-${mIdx}-${aIdx}`);
        
        let peso = parseFloat(pesoEl.value) || 0;
        let nota = parseFloat(notaEl.value) || 0;
        
        pesoTotalInformado += peso;
        
        let contribucao = (nota * peso) / 100;
        mediaFinal += contribucao;
        
        document.getElementById(`contribucao-${mIdx}-${aIdx}`).innerText = contribucao.toFixed(2);
        
        // Regra para identificar a Prova Final e realizar a projeção preditiva
        if (av.nome.toUpperCase().includes('PF') || av.nome.toUpperCase().includes('FINAL')) {
            pfIdx = aIdx;
            pfPeso = peso;
        } else {
            if (notaEl.value !== "") {
                notaAcumuladaSemPF += contribucao;
            }
        }
    });

    // Processa avaliações adicionadas dinamicamente
    const additionalRows = document.querySelectorAll(`#rows-${mIdx} .adicional-row`);
    additionalRows.forEach((row) => {
        const idAttr = row.id; // formato: row-adicional-{mIdx}-{contadorAdicional}
        const match = idAttr.match(/row-adicional-\d+-(\d+)/);
        if (match) {
            const contadorAdicional = match[1];
            const pesoEl = document.getElementById(`peso-adicional-${mIdx}-${contadorAdicional}`);
            const notaEl = document.getElementById(`nota-adicional-${mIdx}-${contadorAdicional}`);
            
            if (pesoEl && notaEl) {
                let peso = parseFloat(pesoEl.value) || 0;
                let nota = parseFloat(notaEl.value) || 0;
                
                pesoTotalInformado += peso;
                
                let contribucao = (nota * peso) / 100;
                mediaFinal += contribucao;
                
                document.getElementById(`contribucao-adicional-${mIdx}-${contadorAdicional}`).innerText = contribucao.toFixed(2);
                
                // Verifica se a avaliação adicional é uma PF
                const nomeEl = document.getElementById(`nome-adicional-${mIdx}-${contadorAdicional}`);
                if (nomeEl && (nomeEl.value.toUpperCase().includes('PF') || nomeEl.value.toUpperCase().includes('FINAL'))) {
                    if (pfIdx === -1) { // Apenas se não houver uma PF original
                        pfIdx = `adicional-${contadorAdicional}`;
                        pfPeso = peso;
                    }
                } else {
                    if (notaEl.value !== "") {
                        notaAcumuladaSemPF += contribucao;
                    }
                }
            }
        }
    });

    const badgeContainer = document.getElementById(`badge-container-${mIdx}`);
    const mediaDisplay = document.getElementById(`media-${mIdx}`);
    const alertaEl = document.getElementById(`alerta-${mIdx}`);
    
    // Busca o elemento de nota da PF (pode ser original ou adicional)
    let pfNotaEl = null;
    if (pfIdx !== -1) {
        if (typeof pfIdx === 'string' && pfIdx.includes('adicional')) {
            const match = pfIdx.match(/adicional-(\d+)/);
            if (match) {
                const contadorAdicional = match[1];
                pfNotaEl = document.getElementById(`nota-adicional-${mIdx}-${contadorAdicional}`);
            }
        } else {
            pfNotaEl = document.getElementById(`nota-${mIdx}-${pfIdx}`);
        }
    }

    // Lógica do Alerta de Projeção (Média >= 5.0)
    if (pfIdx !== -1 && pfNotaEl && pfNotaEl.value === "") {
        let notaNecessariaPF = ((5.0 - notaAcumuladaSemPF) * 100) / pfPeso;
        
        if (notaNecessariaPF <= 0) {
            alertaEl.className = "mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium";
            alertaEl.innerHTML = `<strong>Aprovado por antecipação!</strong> Você já garantiu a média mínima 5.0 mesmo se tirar 0 na PF.`;
        } else if (notaNecessariaPF <= 10) {
            alertaEl.className = "mt-4 p-3 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium";
            alertaEl.innerHTML = `<strong>Alvo para Aprovação:</strong> Você precisa tirar no mínimo <strong>${notaNecessariaPF.toFixed(1)}</strong> na PF para passar direto com média 5.0.`;
        } else {
            alertaEl.className = "mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium";
            alertaEl.innerHTML = `<strong>Atenção:</strong> Matematicamente, você precisaria de <strong>${notaNecessariaPF.toFixed(1)}</strong> na PF para atingir a média 5.0. Verifique as regras de recuperação.`;
        }
    } else if (pfNotaEl && pfNotaEl.value !== "") {
        if (mediaFinal >= 5.0) {
            alertaEl.className = "mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium";
            alertaEl.innerHTML = `<strong>Status: Aprovado!</strong> Média final projetada de ${mediaFinal.toFixed(1)}.`;
        } else {
            alertaEl.className = "mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium";
            alertaEl.innerHTML = `<strong>Status: Abaixo da Média (Média: ${mediaFinal.toFixed(1)}).</strong> Você precisará de exames substitutivos.`;
        }
    }

    // Controle visual das tags de peso e média
    if (pesoTotalInformado !== 100) {
        badgeContainer.className = "text-sm font-medium px-3 py-1 rounded-full bg-red-100 text-red-700";
        badgeContainer.innerHTML = `Média Parcial: <span id="media-${mIdx}">Erro nos Pesos</span>`;
    } else {
        if (mediaFinal >= 5.0) {
            badgeContainer.className = "text-sm font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700";
        } else {
            badgeContainer.className = "text-sm font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700";
        }
        badgeContainer.innerHTML = `Média Parcial: <span id="media-${mIdx}">${mediaFinal.toFixed(1)}</span>`;
    }
}