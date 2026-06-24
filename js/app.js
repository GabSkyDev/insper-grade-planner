// Expõe o catálogo globalmente para que a calculadora possa acessá-lo
window.catalogoInsper = {};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('./data/catalogo_insper.json');
        window.catalogoInsper = await response.json();
        inicializarApp();
    } catch (error) {
        console.error("Erro ao carregar o catálogo de matérias. Verifique se o arquivo JSON existe e está no caminho correto.", error);
    }
});

function inicializarApp() {
    const selectCurso = document.getElementById('select-curso');

    for (let curso in window.catalogoInsper) {
        let option = document.createElement('option');
        option.value = curso;
        option.innerText = curso;
        selectCurso.appendChild(option);
    }
    carregarSemestres();
}

function carregarSemestres() {
    const cursoSelecionado = document.getElementById('select-curso').value;
    const selectSemestre = document.getElementById('select-semestre');
    selectSemestre.innerHTML = '';

    const semestres = window.catalogoInsper[cursoSelecionado];
    for (let semestre in semestres) {
        let option = document.createElement('option');
        option.value = semestre;
        option.innerText = semestre;
        selectSemestre.appendChild(option);
    }
    renderizarMaterias();
}

function renderizarMaterias() {
    const curso = document.getElementById('select-curso').value;
    const semestre = document.getElementById('select-semestre').value;
    const materias = window.catalogoInsper[curso][semestre] || [];

    const grid = document.getElementById('grid-materias');
    grid.innerHTML = '';

    document.getElementById('pdf-meta').innerText = `Curso: ${curso} | Semestre: ${semestre} | Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`;

    materias.forEach((materia, mIdx) => {
        let card = document.createElement('div');
        card.className = "print-card surface-card p-6 rounded-2xl shadow-card dark:shadow-card-dark";

        let html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5 pb-4 border-b border-[var(--border-subtle)]">
                <h3 class="text-lg font-bold text-[var(--text-primary)]">${materia.nome}</h3>
                <div class="text-sm font-semibold px-3 py-1.5 rounded-full surface-raised text-[var(--text-secondary)]" id="badge-container-${mIdx}">
                    Média Parcial: <span id="media-${mIdx}">0.0</span>
                </div>
            </div>

            <div class="overflow-x-auto -mx-1 px-1">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
                            <th class="py-2 pb-3 pr-4">Avaliação</th>
                            <th class="py-2 pb-3 w-28">Peso (%)</th>
                            <th class="py-2 pb-3 w-28">Sua Nota</th>
                            <th class="py-2 pb-3 text-right">Contribuição</th>
                        </tr>
                    </thead>
                    <tbody id="rows-${mIdx}">
        `;

        materia.avaliacoes.forEach((av, aIdx) => {
            html += `
                <tr class="border-b border-[var(--border-subtle)] last:border-0">
                    <td class="py-3 font-medium text-[var(--text-primary)] text-sm pr-4">${av.nome}</td>
                    <td class="py-2">
                        <input type="number" value="${av.peso}" min="0" max="100"
                            id="peso-${mIdx}-${aIdx}" oninput="calcularNota(${mIdx}, '${curso}', '${semestre}')"
                            class="input-field w-20 rounded-lg px-2 py-1.5 text-sm">
                    </td>
                    <td class="py-2">
                        <input type="number" placeholder="0.0" min="0" max="10" step="0.1"
                            id="nota-${mIdx}-${aIdx}" oninput="calcularNota(${mIdx}, '${curso}', '${semestre}')"
                            class="input-field w-24 rounded-lg px-2 py-1.5 text-sm font-semibold">
                    </td>
                    <td class="py-3 text-right text-sm text-[var(--text-muted)] font-mono" id="contribucao-${mIdx}-${aIdx}">0.00</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>

            <div class="mt-5 flex gap-2 no-print">
                <button onclick="adicionarAvaliacao(${mIdx}, '${curso}', '${semestre}')" class="btn-ghost px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Avaliação
                </button>
            </div>

            <div id="alerta-${mIdx}" class="mt-4 p-3.5 rounded-xl text-xs font-medium border alert-info">
                <span>Preencha as notas para calcular a projeção necessária para aprovação.</span>
            </div>
        `;

        card.innerHTML = html;
        grid.appendChild(card);

        calcularNota(mIdx, curso, semestre);
    });
}

window.avaliacoesAdicionadas = {};

function adicionarAvaliacao(mIdx, curso, semestre) {
    if (!window.avaliacoesAdicionadas[mIdx]) {
        window.avaliacoesAdicionadas[mIdx] = 0;
    }

    const contadorAdicional = window.avaliacoesAdicionadas[mIdx]++;
    const tbody = document.getElementById(`rows-${mIdx}`);

    const novaLinha = document.createElement('tr');
    novaLinha.className = "border-b border-[var(--border-subtle)] last:border-0 adicional-row";
    novaLinha.id = `row-adicional-${mIdx}-${contadorAdicional}`;

    const nomePadrao = `Avaliação Adic. ${contadorAdicional + 1}`;

    novaLinha.innerHTML = `
        <td class="py-3 font-medium text-[var(--text-primary)] text-sm pr-4">
            <input type="text" value="${nomePadrao}"
                id="nome-adicional-${mIdx}-${contadorAdicional}"
                class="input-field w-full rounded-lg px-2 py-1.5 text-sm">
        </td>
        <td class="py-2">
            <input type="number" value="0" min="0" max="100"
                id="peso-adicional-${mIdx}-${contadorAdicional}" oninput="calcularNota(${mIdx}, '${curso}', '${semestre}')"
                class="input-field w-20 rounded-lg px-2 py-1.5 text-sm">
        </td>
        <td class="py-2">
            <input type="number" placeholder="0.0" min="0" max="10" step="0.1"
                id="nota-adicional-${mIdx}-${contadorAdicional}" oninput="calcularNota(${mIdx}, '${curso}', '${semestre}')"
                class="input-field w-24 rounded-lg px-2 py-1.5 text-sm font-semibold">
        </td>
        <td class="py-3 text-right text-sm text-[var(--text-muted)] font-mono">
            <div class="flex items-center justify-end gap-2">
                <span id="contribucao-adicional-${mIdx}-${contadorAdicional}">0.00</span>
                <button onclick="removerAvaliacao(${mIdx}, ${contadorAdicional}, '${curso}', '${semestre}')" class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </td>
    `;

    tbody.appendChild(novaLinha);
    calcularNota(mIdx, curso, semestre);
}

function removerAvaliacao(mIdx, contadorAdicional, curso, semestre) {
    const linha = document.getElementById(`row-adicional-${mIdx}-${contadorAdicional}`);
    if (linha) {
        linha.remove();
        calcularNota(mIdx, curso, semestre);
    }
}
