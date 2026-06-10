function exportarPDF() {
    // Certifique-se de que a tag html2pdf.js está no seu index.html
    if (typeof html2pdf === 'undefined') {
        alert("A biblioteca de geração de PDF não foi carregada corretamente.");
        return;
    }

    const elemento = document.getElementById('conteudo-relatorio');
    const curso = document.getElementById('select-curso').value;
    const semestre = document.getElementById('select-semestre').value;
    
    const opt = {
        margin:       10,
        filename:     `Grade_Planner_Insper_${curso.replace(/ /g, "_")}_${semestre.replace(/ /g, "_")}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Dispara o download
    html2pdf().set(opt).from(elemento).save();
}