const ALERT_CLASSES = {
    info: 'mt-4 p-3.5 rounded-xl text-xs font-medium border alert-info bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    success: 'mt-4 p-3.5 rounded-xl text-xs font-medium border alert-success bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'mt-4 p-3.5 rounded-xl text-xs font-medium border alert-warning bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    danger: 'mt-4 p-3.5 rounded-xl text-xs font-medium border alert-danger bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
};

const BADGE_CLASSES = {
    default: 'text-sm font-semibold px-3 py-1.5 rounded-full surface-raised text-[var(--text-secondary)]',
    success: 'text-sm font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    error: 'text-sm font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    neutral: 'text-sm font-semibold px-3 py-1.5 rounded-full surface-raised text-[var(--text-secondary)]',
};

function calcularNota(mIdx, curso, semestre) {
    const materia = window.catalogoInsper[curso][semestre][mIdx];

    let mediaFinal = 0;
    let pesoTotalInformado = 0;

    let pfIdx = -1;
    let pfPeso = 0;
    let notaAcumuladaSemPF = 0;

    materia.avaliacoes.forEach((av, aIdx) => {
        const pesoEl = document.getElementById(`peso-${mIdx}-${aIdx}`);
        const notaEl = document.getElementById(`nota-${mIdx}-${aIdx}`);

        let peso = parseFloat(pesoEl.value) || 0;
        let nota = parseFloat(notaEl.value) || 0;

        pesoTotalInformado += peso;

        let contribucao = (nota * peso) / 100;
        mediaFinal += contribucao;

        document.getElementById(`contribucao-${mIdx}-${aIdx}`).innerText = contribucao.toFixed(2);

        if (av.nome.toUpperCase().includes('PF') || av.nome.toUpperCase().includes('FINAL')) {
            pfIdx = aIdx;
            pfPeso = peso;
        } else {
            if (notaEl.value !== "") {
                notaAcumuladaSemPF += contribucao;
            }
        }
    });

    const additionalRows = document.querySelectorAll(`#rows-${mIdx} .adicional-row`);
    additionalRows.forEach((row) => {
        const idAttr = row.id;
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

                const nomeEl = document.getElementById(`nome-adicional-${mIdx}-${contadorAdicional}`);
                if (nomeEl && (nomeEl.value.toUpperCase().includes('PF') || nomeEl.value.toUpperCase().includes('FINAL'))) {
                    if (pfIdx === -1) {
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
    const alertaEl = document.getElementById(`alerta-${mIdx}`);

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

    if (pfIdx !== -1 && pfNotaEl && pfNotaEl.value === "") {
        let notaNecessariaPF = ((5.0 - notaAcumuladaSemPF) * 100) / pfPeso;

        if (notaNecessariaPF <= 0) {
            alertaEl.className = ALERT_CLASSES.success;
            alertaEl.innerHTML = `<strong>Aprovado por antecipação!</strong> Você já garantiu a média mínima 5.0 mesmo se tirar 0 na PF.`;
        } else if (notaNecessariaPF <= 10) {
            alertaEl.className = ALERT_CLASSES.warning;
            alertaEl.innerHTML = `<strong>Alvo para Aprovação:</strong> Você precisa tirar no mínimo <strong>${notaNecessariaPF.toFixed(1)}</strong> na PF para passar direto com média 5.0.`;
        } else {
            alertaEl.className = ALERT_CLASSES.danger;
            alertaEl.innerHTML = `<strong>Atenção:</strong> Matematicamente, você precisaria de <strong>${notaNecessariaPF.toFixed(1)}</strong> na PF para atingir a média 5.0. Verifique as regras de recuperação.`;
        }
    } else if (pfNotaEl && pfNotaEl.value !== "") {
        if (mediaFinal >= 5.0) {
            alertaEl.className = ALERT_CLASSES.success;
            alertaEl.innerHTML = `<strong>Status: Aprovado!</strong> Média final projetada de ${mediaFinal.toFixed(1)}.`;
        } else {
            alertaEl.className = ALERT_CLASSES.danger;
            alertaEl.innerHTML = `<strong>Status: Abaixo da Média (Média: ${mediaFinal.toFixed(1)}).</strong> Você precisará de exames substitutivos.`;
        }
    } else {
        alertaEl.className = ALERT_CLASSES.info;
        alertaEl.innerHTML = `<span>Preencha as notas para calcular a projeção necessária para aprovação.</span>`;
    }

    if (pesoTotalInformado !== 100) {
        badgeContainer.className = BADGE_CLASSES.error;
        badgeContainer.innerHTML = `Média Parcial: <span id="media-${mIdx}">Erro nos Pesos</span>`;
    } else {
        if (mediaFinal >= 5.0) {
            badgeContainer.className = BADGE_CLASSES.success;
        } else {
            badgeContainer.className = BADGE_CLASSES.neutral;
        }
        badgeContainer.innerHTML = `Média Parcial: <span id="media-${mIdx}">${mediaFinal.toFixed(1)}</span>`;
    }
}
