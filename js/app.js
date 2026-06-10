// Expõe o catálogo globalmente para que a calculadora possa acessá-lo
window.catalogoInsper = {};

// Quando a página carregar, busca o arquivo JSON
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Caminho para o seu arquivo JSON estruturado
        const response = await fetch('./data/catalogo_insper.json');
        window.catalogoInsper = await response.json();
        inicializarApp();
    } catch (error) {
        console.error("Erro ao carregar o catálogo de matérias. Verifique se o arquivo JSON existe e está no caminho correto.", error);
    }
});

function inicializarApp() {
    const selectCurso = document.getElementById('select-curso');
    
    // Popula o select de cursos
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
    selectSemestre.innerHTML = ''; // Limpa as opções anteriores
    
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

    // Atualiza metadados para a impressão do PDF
    document.getElementById('pdf-meta').innerText = `Curso: ${curso} | Semestre: ${semestre} | Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`;

    materias.forEach((materia, mIdx) => {
        let card = document.createElement('div');
        card.className = "print-card bg-white p-6 rounded-xl shadow-sm border border-slate-200";
        
        let html = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <h3 class="text-lg font-semibold text-slate-800">${materia.nome}</h3>
                <div class="text-sm font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600" id="badge-container-${mIdx}">
                    Média Parcial: <span id="media-${mIdx}">0.0</span>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="text-xs font-semibold text-slate-400 uppercase border-b border-slate-200">
                            <th class="py-2 pb-3">Avaliação</th>
                            <th class="py-2 pb-3 w-32">Peso (%)</th>
                            <th class="py-2 pb-3 w-32">Sua Nota</th>
                            <th class="py-2 pb-3 text-right">Contribuição na Média</th>
                        </tr>
                    </thead>
                    <tbody id="rows-${mIdx}">
        `;

        materia.avaliacoes.forEach((av, aIdx) => {
            // Note que agora passamos o 'curso' e 'semestre' para a função de cálculo
            html += `
                <tr class="border-b border-slate-100 last:border-0">
                    <td class="py-3 font-medium text-slate-700 text-sm">${av.nome}</td>
                    <td class="py-2">
                        <input type="number" value="${av.peso}" min="0" max="100" 
                            id="peso-${mIdx}-${aIdx}" oninput="calcularNota(${mIdx}, '${curso}', '${semestre}')"
                            class="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none">
                    </td>
                    <td class="py-2">
                        <input type="number" placeholder="0.0" min="0" max="10" step="0.1"
                            id="nota-${mIdx}-${aIdx}" oninput="calcularNota(${mIdx}, '${curso}', '${semestre}')"
                            class="w-24 bg-white border border-slate-300 font-semibold text-slate-700 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
                    </td>
                    <td class="py-3 text-right text-sm text-slate-500 font-mono" id="contribucao-${mIdx}-${aIdx}">0.00</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4 flex gap-2 no-print">
                <button onclick="adicionarAvaliacao(${mIdx}, '${curso}', '${semestre}')" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Avaliação
                </button>
            </div>
            
            <div id="alerta-${mIdx}" class="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium flex items-center justify-between">
                <span>Preencha as notas para calcular a projeção necessária para aprovação.</span>
            </div>
        `;
        
        card.innerHTML = html;
        grid.appendChild(card);
        
        // Inicializa os cálculos passando os parâmetros necessários
        calcularNota(mIdx, curso, semestre); 
    });
}

// Variável global para rastrear avaliações adicionadas
window.avaliacoesAdicionadas = {};

function adicionarAvaliacao(mIdx, curso, semestre) {
    // Inicializa o contador para esta matéria se não existir
    if (!window.avaliacoesAdicionadas[mIdx]) {
        window.avaliacoesAdicionadas[mIdx] = 0;
    }
    
    const contadorAdicional = window.avaliacoesAdicionadas[mIdx]++;
    const tbody = document.getElementById(`rows-${mIdx}`);
    
    // Cria uma nova linha de tabela
    const novaLinha = document.createElement('tr');
    novaLinha.className = "border-b border-slate-100 last:border-0 adicional-row";
    novaLinha.id = `row-adicional-${mIdx}-${contadorAdicional}`;
    
    const nomePadrao = `Avaliação Adic. ${contadorAdicional + 1}`;
    
    novaLinha.innerHTML = `
        <td class="py-3 font-medium text-slate-700 text-sm">
            <input type="text" value="${nomePadrao}" 
                id="nome-adicional-${mIdx}-${contadorAdicional}"
                class="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
        </td>
        <td class="py-2">
            <input type="number" value="0" min="0" max="100" 
                id="peso-adicional-${mIdx}-${contadorAdicional}" oninput="calcularNota(${mIdx}, '${curso}', '${semestre}')"
                class="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none">
        </td>
        <td class="py-2">
            <input type="number" placeholder="0.0" min="0" max="10" step="0.1"
                id="nota-adicional-${mIdx}-${contadorAdicional}" oninput="calcularNota(${mIdx}, '${curso}', '${semestre}')"
                class="w-24 bg-white border border-slate-300 font-semibold text-slate-700 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none">
        </td>
        <td class="py-3 text-right text-sm text-slate-500 font-mono flex items-center justify-between">
            <span id="contribucao-adicional-${mIdx}-${contadorAdicional}">0.00</span>
            <button onclick="removerAvaliacao(${mIdx}, ${contadorAdicional}, '${curso}', '${semestre}')" class="ml-2 text-red-500 hover:text-red-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
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