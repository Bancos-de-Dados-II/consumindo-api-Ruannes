// Configuração da API
const API_URL = 'http://localhost:3000/tasks';

// Elementos do DOM
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks-list');
const loadingMessage = document.getElementById('loading-message');
const emptyMessage = document.getElementById('empty-message');
const formTitle = document.getElementById('form-title');
const btnCancel = document.getElementById('btn-cancel');
const btnRefresh = document.getElementById('btn-refresh');
const taskIdInput = document.getElementById('task-id');
const tituloInput = document.getElementById('titulo');
const descricaoInput = document.getElementById('descricao');
const tipoInput = document.getElementById('tipo');
const toast = document.getElementById('toast');

// Estado da aplicação
let editMode = false;

// Funções da API
async function fetchTasks() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Falha ao buscar tarefas');
        }
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar as tarefas', 'error');
    } finally {
        showLoading(false);
    }
}

async function fetchTaskById(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Tarefa não encontrada');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao buscar tarefa', 'error');
        return null;
    }
}

async function createTask(taskData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error('Falha ao criar tarefa');
        }
        
        const newTask = await response.json();
        showToast('Tarefa criada com sucesso!', 'success');
        return newTask;
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao criar tarefa', 'error');
        return null;
    }
}

async function updateTask(id, taskData) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error('Falha ao atualizar tarefa');
        }
        
        const updatedTask = await response.json();
        showToast('Tarefa atualizada com sucesso!', 'success');
        return updatedTask;
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao atualizar tarefa', 'error');
        return null;
    }
}

async function deleteTask(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Falha ao excluir tarefa');
        }
        
        showToast('Tarefa excluída com sucesso!', 'success');
        await fetchTasks(); // Atualiza a lista após excluir
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao excluir tarefa', 'error');
    }
}

// Funções de UI
function renderTasks(tasks) {
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        emptyMessage.style.display = 'block';
        return;
    }
    
    emptyMessage.style.display = 'none';
    
    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        
        // Formatar data
        const date = new Date(task.dataHora);
        const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + 
                             date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        taskItem.innerHTML = `
            <div class="task-content">
                <h3 class="task-title">${task.titulo}</h3>
                <p class="task-description">${task.descricao || 'Sem descrição'}</p>
                <div class="task-meta">
                    <span>Criada em: ${formattedDate}</span>
                    <span class="task-type ${task.tipo}">${task.tipo}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-edit" data-id="${task.id}">Editar</button>
                <button class="btn-danger" data-id="${task.id}">Excluir</button>
            </div>
        `;
        
        // Adicionar event listeners para os botões
        const editButton = taskItem.querySelector('.btn-edit');
        const deleteButton = taskItem.querySelector('.btn-danger');
        
        editButton.addEventListener('click', () => {
            loadTaskForEdit(task.id);
        });
        
        deleteButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                deleteTask(task.id);
            }
        });
        
        tasksList.appendChild(taskItem);
    });
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingMessage.style.display = 'block';
        tasksList.style.display = 'none';
        emptyMessage.style.display = 'none';
    } else {
        loadingMessage.style.display = 'none';
        tasksList.style.display = 'block';
    }
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

function resetForm() {
    taskForm.reset();
    taskIdInput.value = '';
    editMode = false;
    formTitle.textContent = 'Nova Tarefa';
}

async function loadTaskForEdit(id) {
    const task = await fetchTaskById(id);
    if (!task) return;
    
    // Preencher o formulário com os dados da tarefa
    taskIdInput.value = task.id;
    tituloInput.value = task.titulo;
    descricaoInput.value = task.descricao || '';
    tipoInput.value = task.tipo;
    
    // Mudar o título do formulário e ativar modo de edição
    formTitle.textContent = 'Editar Tarefa';
    editMode = true;
    
    // Rolar até o formulário
    taskForm.scrollIntoView({ behavior: 'smooth' });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carregar tarefas quando a página carrega
    fetchTasks();
    
    // Evento de submit do formulário
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const taskData = {
            titulo: tituloInput.value,
            descricao: descricaoInput.value,
            tipo: tipoInput.value
        };
        
        if (editMode) {
            // Atualizar tarefa existente
            const id = taskIdInput.value;
            const updated = await updateTask(id, taskData);
            if (updated) {
                resetForm();
                await fetchTasks();
            }
        } else {
            // Criar nova tarefa
            const created = await createTask(taskData);
            if (created) {
                resetForm();
                await fetchTasks();
            }
        }
    });
    
    // Botão de cancelar edição
    btnCancel.addEventListener('click', () => {
        resetForm();
    });
    
    // Botão de atualizar lista
    btnRefresh.addEventListener('click', () => {
        fetchTasks();
    });
});