// ============= CONFIGURAÇÃO DA API =============
const API_URL = 'http://localhost:3000/api';
let authToken = null;
let currentUser = null;

// Função auxiliar para fazer requisições
async function apiRequest(endpoint, options = {}) {
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        const data = await response.json();
      

        if (!response.ok) {
            throw new Error(data.error || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

// ============= AUTENTICAÇÃO =============
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginPassword').value;

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });

        authToken = data.token;
        currentUser = data.user;
        
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('userName').textContent = data.user.nome;
        document.getElementById('userRole').textContent = data.user.role === 'ADMIN' ? 'Administrador' : 'Secretaria';
        
        showPage('dashboard');
        await atualizarDashboard();
    } catch (error) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = error.message || 'E-mail ou senha incorretos!';
        errorDiv.classList.remove('hidden');
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    authToken = null;
    currentUser = null;
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').classList.add('hidden');
});

// ============= NAVEGAÇÃO =============
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName + 'Page').classList.remove('hidden');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    if (pageName === 'alunos') renderAlunos();
    if (pageName === 'turmas') renderTurmas();
    if (pageName === 'matriculas') {
        carregarSelectsMatricula();
        renderMatriculas();
    }
    if (pageName === 'historico') {
        carregarSelectsHistorico();
        renderHistorico();
    }
    if (pageName === 'atendimentos') {
        carregarSelectsAtendimento();
        renderAtendimentos();
    }
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(link.dataset.page);
    });
});

// ============= DASHBOARD =============
async function atualizarDashboard() {
    try {
        const data = await apiRequest('/dashboard');
        document.getElementById('statAlunosAtivos').textContent = data.totalAlunosAtivos;
        document.getElementById('statTurmasAbertas').textContent = data.totalTurmasAbertas;
        document.getElementById('statMatriculas').textContent = data.totalMatriculasSemestre;
        document.getElementById('statSolicitacoes').textContent = data.solicitacoesAbertas;
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// ============= ALUNOS =============
let alunosCache = [];

async function renderAlunos(filtro = '') {
    try {
        const tbody = document.getElementById('alunosTableBody');
        alunosCache = await apiRequest('/alunos');
        
        const alunos = alunosCache.filter(a => 
            a.nome.toLowerCase().includes(filtro.toLowerCase()) ||
            a.cpf.includes(filtro)
        );

        tbody.innerHTML = alunos.map(a => `
            <tr>
                <td>${a.nome}</td>
                <td>${a.cpf}</td>
                <td>${new Date(a.data_nascimento).toLocaleDateString('pt-BR')}</td>
                <td>${a.telefone || '-'}</td>
                <td><span class="status-badge status-${a.situacao.toLowerCase()}">${a.situacao}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editarAluno(${a.id})">Editar</button>
                        ${currentUser.role === 'ADMIN' ? `<button class="btn btn-danger btn-sm" onclick="excluirAluno(${a.id})">Excluir</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        alert('Erro ao carregar alunos: ' + error.message);
    }
}

document.getElementById('searchAlunos').addEventListener('input', (e) => {
    renderAlunos(e.target.value);
});

document.getElementById('alunoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('alunoId').value;
    const aluno = {
        nome: document.getElementById('alunoNome').value,
        cpf: document.getElementById('alunoCPF').value,
        data_nascimento: document.getElementById('alunoDataNasc').value,
        telefone: document.getElementById('alunoTelefone').value,
        email: document.getElementById('alunoEmail').value,
        endereco: document.getElementById('alunoEndereco').value,
        situacao: document.getElementById('alunoSituacao').value
    };

    try {
        if (id) {
            await apiRequest(`/alunos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(aluno)
            });
        } else {
            await apiRequest('/alunos', {
                method: 'POST',
                body: JSON.stringify(aluno)
            });
        }

        document.getElementById('alunoForm').reset();
        document.getElementById('alunoId').value = '';
        document.getElementById('alunoFormTitle').textContent = 'Novo Aluno';
        await renderAlunos();
        await atualizarDashboard();
        alert('Aluno salvo com sucesso!');
    } catch (error) {
        alert('Erro ao salvar aluno: ' + error.message);
    }
});

document.getElementById('cancelarAlunoBtn').addEventListener('click', () => {
    document.getElementById('alunoForm').reset();
    document.getElementById('alunoId').value = '';
    document.getElementById('alunoFormTitle').textContent = 'Novo Aluno';
});

function editarAluno(id) {
    const aluno = alunosCache.find(a => a.id === id);
    document.getElementById('alunoId').value = aluno.id;
    document.getElementById('alunoNome').value = aluno.nome;
    document.getElementById('alunoCPF').value = aluno.cpf;
    document.getElementById('alunoDataNasc').value = aluno.data_nascimento;
    document.getElementById('alunoTelefone').value = aluno.telefone || '';
    document.getElementById('alunoEmail').value = aluno.email || '';
    document.getElementById('alunoEndereco').value = aluno.endereco || '';
    document.getElementById('alunoSituacao').value = aluno.situacao;
    document.getElementById('alunoFormTitle').textContent = 'Editar Aluno';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirAluno(id) {
    if (currentUser.role !== 'ADMIN') {
        alert('Apenas administradores podem excluir!');
        return;
    }
    if (confirm('Deseja realmente excluir este aluno?')) {
        try {
            await apiRequest(`/alunos/${id}`, { method: 'DELETE' });
            await renderAlunos();
            await atualizarDashboard();
            alert('Aluno excluído com sucesso!');
        } catch (error) {
            alert('Erro ao excluir aluno: ' + error.message);
        }
    }
}

// ============= TURMAS =============
let turmasCache = [];

async function renderTurmas(filtro = '') {
    try {
        const tbody = document.getElementById('turmasTableBody');
        turmasCache = await apiRequest('/turmas');
        
        const turmas = turmasCache.filter(t => 
            t.identificacao.toLowerCase().includes(filtro.toLowerCase()) ||
            t.curso.toLowerCase().includes(filtro.toLowerCase())
        );

        tbody.innerHTML = turmas.map(t => `
            <tr>
                <td>${t.identificacao}</td>
                <td>${t.curso}</td>
                <td>${t.turno}</td>
                <td>${t.ano_semestre}</td>
                <td>${t.total_matriculados || 0} / ${t.max_vagas}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editarTurma(${t.id})">Editar</button>
                        ${currentUser.role === 'ADMIN' ? `<button class="btn btn-danger btn-sm" onclick="excluirTurma(${t.id})">Excluir</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar turmas:', error);
        alert('Erro ao carregar turmas: ' + error.message);
    }
}

document.getElementById('searchTurmas').addEventListener('input', (e) => {
    renderTurmas(e.target.value);
});

document.getElementById('turmaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('turmaId').value;
    const turma = {
        identificacao: document.getElementById('turmaIdentificacao').value,
        curso: document.getElementById('turmaCurso').value,
        turno: document.getElementById('turmaTurno').value,
        ano_semestre: document.getElementById('turmaAnoSemestre').value,
        max_vagas: parseInt(document.getElementById('turmaMaxVagas').value)
    };

    try {
        if (id) {
            await apiRequest(`/turmas/${id}`, {
                method: 'PUT',
                body: JSON.stringify(turma)
            });
        } else {
            await apiRequest('/turmas', {
                method: 'POST',
                body: JSON.stringify(turma)
            });
        }

        document.getElementById('turmaForm').reset();
        document.getElementById('turmaId').value = '';
        document.getElementById('turmaFormTitle').textContent = 'Nova Turma';
        await renderTurmas();
        await atualizarDashboard();
        alert('Turma salva com sucesso!');
    } catch (error) {
        alert('Erro ao salvar turma: ' + error.message);
    }
});

document.getElementById('cancelarTurmaBtn').addEventListener('click', () => {
    document.getElementById('turmaForm').reset();
    document.getElementById('turmaId').value = '';
    document.getElementById('turmaFormTitle').textContent = 'Nova Turma';
});

function editarTurma(id) {
    const turma = turmasCache.find(t => t.id === id);
    document.getElementById('turmaId').value = turma.id;
    document.getElementById('turmaIdentificacao').value = turma.identificacao;
    document.getElementById('turmaCurso').value = turma.curso;
    document.getElementById('turmaTurno').value = turma.turno;
    document.getElementById('turmaAnoSemestre').value = turma.ano_semestre;
    document.getElementById('turmaMaxVagas').value = turma.max_vagas;
    document.getElementById('turmaFormTitle').textContent = 'Editar Turma';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirTurma(id) {
    if (currentUser.role !== 'ADMIN') {
        alert('Apenas administradores podem excluir!');
        return;
    }
    if (confirm('Deseja realmente excluir esta turma?')) {
        try {
            await apiRequest(`/turmas/${id}`, { method: 'DELETE' });
            await renderTurmas();
            await atualizarDashboard();
            alert('Turma excluída com sucesso!');
        } catch (error) {
            alert('Erro ao excluir turma: ' + error.message);
        }
    }
}

// ============= MATRÍCULAS =============
async function carregarSelectsMatricula() {
    try {
        const alunos = await apiRequest('/alunos');
        const turmas = await apiRequest('/turmas');
        
        const selectAluno = document.getElementById('matriculaAluno');
        const selectTurma = document.getElementById('matriculaTurma');

        selectAluno.innerHTML = '<option value="">Selecione um aluno...</option>' +
            alunos.filter(a => a.situacao === 'ATIVO').map(a => 
                `<option value="${a.id}">${a.nome} - ${a.cpf}</option>`
            ).join('');

        selectTurma.innerHTML = '<option value="">Selecione uma turma...</option>' +
            turmas.map(t => 
                `<option value="${t.id}">${t.identificacao} - ${t.curso}</option>`
            ).join('');

        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('matriculaData').value = hoje;
    } catch (error) {
        console.error('Erro ao carregar selects:', error);
    }
}

let matriculasCache = [];

async function renderMatriculas(filtro = '') {
    try {
        const tbody = document.getElementById('matriculasTableBody');
        matriculasCache = await apiRequest('/matriculas');
        
        const matriculas = matriculasCache.filter(m => 
            m.aluno_nome.toLowerCase().includes(filtro.toLowerCase()) ||
            m.turma_identificacao.toLowerCase().includes(filtro.toLowerCase())
        );

        tbody.innerHTML = matriculas.map(m => `
            <tr>
                <td>${m.aluno_nome}</td>
                <td>${m.turma_identificacao}</td>
                <td>${m.turma_curso}</td>
                <td>${new Date(m.data_matricula).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="action-buttons">
                        ${currentUser.role === 'ADMIN' ? `<button class="btn btn-danger btn-sm" onclick="excluirMatricula(${m.id})">Cancelar</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar matrículas:', error);
        alert('Erro ao carregar matrículas: ' + error.message);
    }
}

document.getElementById('searchMatriculas').addEventListener('input', (e) => {
    renderMatriculas(e.target.value);
});

document.getElementById('matriculaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const matricula = {
        aluno_id: parseInt(document.getElementById('matriculaAluno').value),
        turma_id: parseInt(document.getElementById('matriculaTurma').value),
        data_matricula: document.getElementById('matriculaData').value
    };

    try {
        await apiRequest('/matriculas', {
            method: 'POST',
            body: JSON.stringify(matricula)
        });

        document.getElementById('matriculaForm').reset();
        await carregarSelectsMatricula();
        await renderMatriculas();
        await atualizarDashboard();
        alert('Matrícula realizada com sucesso!');
    } catch (error) {
        alert('Erro ao matricular: ' + error.message);
    }
});

async function excluirMatricula(id) {
    if (currentUser.role !== 'ADMIN') {
        alert('Apenas administradores podem cancelar matrículas!');
        return;
    }
    if (confirm('Deseja realmente cancelar esta matrícula?')) {
        try {
            await apiRequest(`/matriculas/${id}`, { method: 'DELETE' });
            await renderMatriculas();
            await atualizarDashboard();
            alert('Matrícula cancelada com sucesso!');
        } catch (error) {
            alert('Erro ao cancelar matrícula: ' + error.message);
        }
    }
}

// ============= HISTÓRICO / NOTAS =============
async function carregarSelectsHistorico() {
    try {
        const matriculas = await apiRequest('/matriculas');
        const select = document.getElementById('notaMatricula');
        
        select.innerHTML = '<option value="">Selecione uma matrícula...</option>' +
            matriculas.map(m => 
                `<option value="${m.id}">${m.aluno_nome} - ${m.turma_identificacao}</option>`
            ).join('');
    } catch (error) {
        console.error('Erro ao carregar selects:', error);
    }
}

let notasCache = [];

async function renderHistorico(filtro = '') {
    try {
        const tbody = document.getElementById('historicoTableBody');
        notasCache = await apiRequest('/notas');
        
        const historico = notasCache.filter(h => 
            h.aluno_nome.toLowerCase().includes(filtro.toLowerCase()) ||
            h.turma_identificacao.toLowerCase().includes(filtro.toLowerCase())
        );

        tbody.innerHTML = historico.map(h => `
            <tr>
                <td>${h.aluno_nome}</td>
                <td>${h.turma_identificacao}</td>
                <td>${h.turma_curso}</td>
                <td>${parseFloat(h.nota).toFixed(1)}</td>
                <td>${h.frequencia}%</td>
                <td><span class="status-badge status-${h.situacao.toLowerCase()}">${h.situacao}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editarNota(${h.matricula_id})">Editar</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        alert('Erro ao carregar histórico: ' + error.message);
    }
}

document.getElementById('searchHistorico').addEventListener('input', (e) => {
    renderHistorico(e.target.value);
});

document.getElementById('notaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const notaData = {
        matricula_id: parseInt(document.getElementById('notaMatricula').value),
        nota: parseFloat(document.getElementById('notaNota').value),
        frequencia: parseInt(document.getElementById('notaFrequencia').value),
        situacao: document.getElementById('notaSituacao').value
    };

    try {
        await apiRequest('/notas', {
            method: 'POST',
            body: JSON.stringify(notaData)
        });

        document.getElementById('notaForm').reset();
        await renderHistorico();
        alert('Nota salva com sucesso!');
    } catch (error) {
        alert('Erro ao salvar nota: ' + error.message);
    }
});

function editarNota(matriculaId) {
    const nota = notasCache.find(n => n.matricula_id === matriculaId);
    if (nota) {
        document.getElementById('notaMatricula').value = nota.matricula_id;
        document.getElementById('notaNota').value = nota.nota;
        document.getElementById('notaFrequencia').value = nota.frequencia;
        document.getElementById('notaSituacao').value = nota.situacao;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============= ATENDIMENTOS =============
async function carregarSelectsAtendimento() {
    try {
        const alunos = await apiRequest('/alunos');
        const select = document.getElementById('atendimentoAluno');
        
        select.innerHTML = '<option value="">Selecione um aluno...</option>' +
            alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');

        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('atendimentoData').value = hoje;
    } catch (error) {
        console.error('Erro ao carregar selects:', error);
    }
}

let atendimentosCache = [];

async function renderAtendimentos(filtro = '') {
    try {
        const tbody = document.getElementById('atendimentosTableBody');
        atendimentosCache = await apiRequest('/atendimentos');
        
        const atendimentos = atendimentosCache.filter(at => 
            at.aluno_nome.toLowerCase().includes(filtro.toLowerCase()) ||
            at.tipo.toLowerCase().includes(filtro.toLowerCase())
        );

        const tipoLabels = {
            'DECLARACAO': 'Declaração',
            'HISTORICO': 'Histórico',
            'SEGUNDA_VIA': 'Segunda Via',
            'OUTROS': 'Outros'
        };

        const statusLabels = {
            'ABERTO': 'aberto',
            'EM_ANDAMENTO': 'andamento',
            'CONCLUIDO': 'concluido'
        };

        tbody.innerHTML = atendimentos.map(at => `
            <tr>
                <td>${at.aluno_nome}</td>
                <td>${tipoLabels[at.tipo]}</td>
                <td>${new Date(at.data).toLocaleDateString('pt-BR')}</td>
                <td><span class="status-badge status-${statusLabels[at.status]}">${at.status.replace('_', ' ')}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editarAtendimento(${at.id})">Editar</button>
                        ${currentUser.role === 'ADMIN' ? `<button class="btn btn-danger btn-sm" onclick="excluirAtendimento(${at.id})">Excluir</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar atendimentos:', error);
        alert('Erro ao carregar atendimentos: ' + error.message);
    }
}

document.getElementById('searchAtendimentos').addEventListener('input', (e) => {
    renderAtendimentos(e.target.value);
});

document.getElementById('atendimentoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('atendimentoId').value;
    const atendimento = {
        aluno_id: parseInt(document.getElementById('atendimentoAluno').value),
        tipo: document.getElementById('atendimentoTipo').value,
        data: document.getElementById('atendimentoData').value,
        status: document.getElementById('atendimentoStatus').value,
        observacoes: document.getElementById('atendimentoObs').value
    };

    try {
        if (id) {
            await apiRequest(`/atendimentos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(atendimento)
            });
        } else {
            await apiRequest('/atendimentos', {
                method: 'POST',
                body: JSON.stringify(atendimento)
            });
        }

        document.getElementById('atendimentoForm').reset();
        document.getElementById('atendimentoId').value = '';
        document.getElementById('atendimentoFormTitle').textContent = 'Nova Solicitação';
        await carregarSelectsAtendimento();
        await renderAtendimentos();
        await atualizarDashboard();
        alert('Atendimento salvo com sucesso!');
    } catch (error) {
        alert('Erro ao salvar atendimento: ' + error.message);
    }
});

document.getElementById('cancelarAtendimentoBtn').addEventListener('click', () => {
    document.getElementById('atendimentoForm').reset();
    document.getElementById('atendimentoId').value = '';
    document.getElementById('atendimentoFormTitle').textContent = 'Nova Solicitação';
});

function editarAtendimento(id) {
    const at = atendimentosCache.find(a => a.id === id);
    document.getElementById('atendimentoId').value = at.id;
    document.getElementById('atendimentoAluno').value = at.aluno_id;
    document.getElementById('atendimentoTipo').value = at.tipo;
    document.getElementById('atendimentoData').value = at.data;
    document.getElementById('atendimentoStatus').value = at.status;
    document.getElementById('atendimentoObs').value = at.observacoes || '';
    document.getElementById('atendimentoFormTitle').textContent = 'Editar Atendimento';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirAtendimento(id) {
    if (currentUser.role !== 'ADMIN') {
        alert('Apenas administradores podem excluir!');
        return;
    }
    if (confirm('Deseja realmente excluir este atendimento?')) {
        try {
            await apiRequest(`/atendimentos/${id}`, { method: 'DELETE' });
            await renderAtendimentos();
            await atualizarDashboard();
            alert('Atendimento excluído com sucesso!');
        } catch (error) {
            alert('Erro ao excluir atendimento: ' + error.message);
        }
    }
}