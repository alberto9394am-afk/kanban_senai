/**
 * KANBAN SIMPLES - GESTÃO DE TAREFAS COTIDIANAS
 * Desenvolvido para aula de Antigravity (HTML + CSS + JS)
 * Recursos: Colunas dinâmicas (3 fixas), Categorias, Drag & Drop e Prazos
 */

// ============================================================================
// 1. ESTADO DA APLICAÇÃO E PERSISTÊNCIA LOCAL
// ============================================================================
const STORAGE_TASKS_KEY = 'antigravity_kanban_tasks';
const STORAGE_COLUMNS_KEY = 'antigravity_kanban_columns';

// Função auxiliar para datas de exemplo
const getFormattedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// 3 Colunas Padrão Fixas
const defaultColumns = [
  { id: 'todo', title: 'A Fazer', isFixed: true, color: '#64748b' },
  { id: 'doing', title: 'Em Execução', isFixed: true, color: '#0284c7' },
  { id: 'done', title: 'Finalizado', isFixed: true, color: '#10b981' }
];

// Tarefas de Exemplo Padrão com Categorias
const defaultTasks = [
  {
    id: 'task-1',
    title: 'Estudar conceitos do Google Antigravity',
    description: 'Compreender agentes, prompts e estrutura de arquivos do projeto.',
    category: 'Estudo',
    dueDate: getFormattedDate(3), // No prazo
    status: 'todo',
    overdueNote: ''
  },
  {
    id: 'task-2',
    title: 'Preparar slides da apresentação',
    description: 'Montar resumo visual para a reunião com os alunos.',
    category: 'Trabalho',
    dueDate: getFormattedDate(0), // Vence hoje
    status: 'doing',
    overdueNote: ''
  },
  {
    id: 'task-3',
    title: 'Enviar relatório mensal de métricas',
    description: 'Tarefa atrasada para testar a regra de justificativa obrigatória.',
    category: 'Trabalho',
    dueDate: getFormattedDate(-2), // Vencida
    status: 'todo',
    overdueNote: ''
  },
  {
    id: 'task-4',
    title: 'Comprar materiais de escritório',
    description: 'Papel A4 e canetas para anotações rápidas.',
    category: 'Pessoal',
    dueDate: getFormattedDate(5),
    status: 'done',
    overdueNote: ''
  }
];

// Carregamento inicial de colunas
let columns = [];
try {
  const storedCols = localStorage.getItem(STORAGE_COLUMNS_KEY);
  columns = storedCols ? JSON.parse(storedCols) : defaultColumns;
  // Garante que os 3 quadros fixos sempre existam
  if (!columns.some(c => c.id === 'todo')) columns.unshift(defaultColumns[0]);
  if (!columns.some(c => c.id === 'doing')) columns.splice(1, 0, defaultColumns[1]);
  if (!columns.some(c => c.id === 'done')) columns.push(defaultColumns[2]);
} catch (e) {
  columns = defaultColumns;
}

// Carregamento inicial de tarefas
let tasks = [];
try {
  const storedTasks = localStorage.getItem(STORAGE_TASKS_KEY);
  tasks = storedTasks ? JSON.parse(storedTasks) : defaultTasks;
} catch (e) {
  tasks = defaultTasks;
}

function saveTasks() {
  localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks));
}

function saveColumns() {
  localStorage.setItem(STORAGE_COLUMNS_KEY, JSON.stringify(columns));
}

// Controle de tarefa aguardando nota de atraso
let pendingOverdueAction = null; // { taskId, targetStatus }
let draggedTaskId = null;

// ============================================================================
// 2. UTILITÁRIOS DE DATA E REGRAS DE NEGÓCIO
// ============================================================================

function getDeadlineStatus(dueDateStr) {
  if (!dueDateStr) return { status: 'normal', text: 'Sem prazo', diffDays: 99 };

  const [year, month, day] = dueDateStr.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const diasAtraso = Math.abs(diffDays);
    return {
      status: 'overdue',
      text: `⏰ Vencida (${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'})`,
      diffDays
    };
  } else if (diffDays === 0) {
    return {
      status: 'warning',
      text: '⚠️ Vence Hoje!',
      diffDays
    };
  } else if (diffDays === 1) {
    return {
      status: 'warning',
      text: '⚠️ Vence Amanhã',
      diffDays
    };
  } else {
    return {
      status: 'normal',
      text: `📅 ${diffDays} dias restantes`,
      diffDays
    };
  }
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// 3. RENDERIZAÇÃO DINÂMICA DO QUADRO KANBAN
// ============================================================================
const boardContainer = document.getElementById('kanban-board-container');

function renderBoard() {
  boardContainer.innerHTML = '';

  // Renderiza cada coluna da lista de colunas
  columns.forEach(col => {
    const colElement = document.createElement('div');
    colElement.className = 'kanban-column';
    colElement.id = `col-${col.id}`;
    colElement.dataset.status = col.id;

    // Tarefas desta coluna
    const columnTasks = tasks.filter(t => t.status === col.id);

    // Botão de exclusão para colunas customizadas (as 3 iniciais são fixas)
    const deleteColBtn = !col.isFixed
      ? `<button class="btn-delete-column" data-col-id="${col.id}" title="Excluir este quadro">🗑️</button>`
      : '';

    colElement.innerHTML = `
      <div class="column-header">
        <div class="column-title">
          <span class="column-indicator" style="background-color: ${col.color || '#3b82f6'};"></span>
          <h2>${escapeHtml(col.title)}</h2>
        </div>
        <div class="column-header-right">
          <span class="task-count" id="count-${col.id}">${columnTasks.length}</span>
          ${deleteColBtn}
        </div>
      </div>
      <div class="task-list" id="list-${col.id}"></div>
    `;

    // Dropzone listeners
    setupColumnDropEvents(colElement);

    // Adiciona os cartões de tarefas
    const taskListElement = colElement.querySelector('.task-list');
    columnTasks.forEach(task => {
      const card = createTaskCardElement(task);
      taskListElement.appendChild(card);
    });

    boardContainer.appendChild(colElement);
  });

  // Atualiza lista de opções do select de status no modal
  updateStatusSelectOptions();
  // Atualiza datalist de categorias
  updateCategoryDatalist();
}

/**
 * Cria o elemento do Cartão de Tarefa
 */
function createTaskCardElement(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.id = task.id;

  const deadline = getDeadlineStatus(task.dueDate);
  const isDone = task.status === 'done';

  // RESTRIÇÃO 1: Tarefas concluídas não podem sofrer alteração de status
  if (isDone) {
    card.classList.add('is-done');
    card.setAttribute('draggable', 'false');
  } else {
    card.setAttribute('draggable', 'true');

    if (deadline.status === 'overdue') {
      card.classList.add('card-danger');
    } else if (deadline.status === 'warning') {
      card.classList.add('card-warning');
    }
  }

  // Badge de Prazo
  let deadlineBadgeHtml = '';
  if (isDone) {
    deadlineBadgeHtml = `<span class="badge badge-success">✅ Finalizada</span>`;
  } else if (deadline.status === 'overdue') {
    deadlineBadgeHtml = `<span class="badge badge-danger">${deadline.text}</span>`;
  } else if (deadline.status === 'warning') {
    deadlineBadgeHtml = `<span class="badge badge-warning">${deadline.text}</span>`;
  } else {
    deadlineBadgeHtml = `<span class="badge badge-normal">${deadline.text}</span>`;
  }

  // Badge de Categoria
  const categoryBadgeHtml = task.category
    ? `<span class="badge-category">🏷️ ${escapeHtml(task.category)}</span>`
    : '';

  // Botão de conclusão rápida antes do prazo
  const quickFinishBtn = !isDone
    ? `<button class="btn-finish-quick" data-action="quick-finish" title="Concluir tarefa agora">✓ Concluir</button>`
    : '';

  // Justificativa caso tenha sido finalizada com atraso
  const overdueNoteHtml = (isDone && task.overdueNote)
    ? `<div class="task-overdue-note">
        <strong>📝 Justificativa de atraso:</strong>
        <span>${escapeHtml(task.overdueNote)}</span>
       </div>`
    : '';

  card.innerHTML = `
    <div class="task-card-header">
      <h4 class="task-card-title">${escapeHtml(task.title)}</h4>
      <div class="task-actions">
        <button class="btn-icon btn-edit" data-action="edit" title="Editar tarefa">✏️</button>
        <button class="btn-icon btn-delete" data-action="delete" title="Excluir tarefa">🗑️</button>
      </div>
    </div>

    ${categoryBadgeHtml ? `<div class="task-card-meta">${categoryBadgeHtml}</div>` : ''}

    ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ''}
    
    <div class="task-card-footer">
      <span class="task-due-date">📅 ${formatDateDisplay(task.dueDate)}</span>
      ${deadlineBadgeHtml}
    </div>

    ${quickFinishBtn ? `<div style="margin-top: 0.6rem; display: flex; justify-content: flex-end;">${quickFinishBtn}</div>` : ''}
    ${overdueNoteHtml}
  `;

  // Drag listeners apenas para tarefas ativas
  if (!isDone) {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  }

  // Listener para botões internos
  card.addEventListener('click', handleCardActions);

  return card;
}

// ============================================================================
// 4. DRAG AND DROP
// ============================================================================
function handleDragStart(e) {
  draggedTaskId = this.dataset.id;
  e.dataTransfer.setData('text/plain', draggedTaskId);
  e.dataTransfer.effectAllowed = 'move';
  this.classList.add('dragging');
}

function handleDragEnd() {
  this.classList.remove('dragging');
  draggedTaskId = null;
}

function setupColumnDropEvents(columnElement) {
  columnElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    columnElement.classList.add('drag-over');
  });

  columnElement.addEventListener('dragleave', () => {
    columnElement.classList.remove('drag-over');
  });

  columnElement.addEventListener('drop', (e) => {
    e.preventDefault();
    columnElement.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    const targetStatus = columnElement.dataset.status;

    if (!taskId || !targetStatus) return;
    attemptChangeTaskStatus(taskId, targetStatus);
  });
}

// ============================================================================
// 5. TRANSIÇÕES E REGRAS DE NEGÓCIO
// ============================================================================
function attemptChangeTaskStatus(taskId, targetStatus) {
  const task = tasks.find(t => t.id === taskId);
  if (!task || task.status === targetStatus) return;

  // RESTRIÇÃO 1: Tarefas concluídas não podem sofrer alteração de status
  if (task.status === 'done') {
    alert('🚫 Restrição: Tarefas concluídas não podem sofrer alteração de status!');
    return;
  }

  // RESTRIÇÃO 2: Se o destino é 'Finalizado' e a tarefa está vencida -> Justificativa obrigatória
  if (targetStatus === 'done') {
    const deadline = getDeadlineStatus(task.dueDate);
    if (deadline.status === 'overdue') {
      openOverdueModal(taskId, targetStatus);
      return;
    }
  }

  // Aplica nova coluna/status
  task.status = targetStatus;
  saveTasks();
  renderBoard();
}

// ============================================================================
// 6. MODAL DE NOTA OBRIGATÓRIA (TAREFA VENCIDA)
// ============================================================================
const overdueModal = document.getElementById('overdue-modal');
const overdueNoteInput = document.getElementById('overdue-note-input');
const overdueErrorMsg = document.getElementById('overdue-error-msg');
const btnConfirmOverdue = document.getElementById('btn-confirm-overdue');
const btnCancelOverdue = document.getElementById('btn-cancel-overdue');
const btnCloseOverdue = document.getElementById('btn-close-overdue-modal');

function openOverdueModal(taskId, targetStatus) {
  pendingOverdueAction = { taskId, targetStatus };
  overdueNoteInput.value = '';
  overdueErrorMsg.style.display = 'none';
  overdueModal.classList.add('active');
  overdueNoteInput.focus();
}

function closeOverdueModal() {
  overdueModal.classList.remove('active');
  pendingOverdueAction = null;
  overdueNoteInput.value = '';
}

btnConfirmOverdue.addEventListener('click', () => {
  const note = overdueNoteInput.value.trim();
  if (!note) {
    overdueErrorMsg.style.display = 'block';
    overdueNoteInput.focus();
    return;
  }

  if (pendingOverdueAction) {
    const task = tasks.find(t => t.id === pendingOverdueAction.taskId);
    if (task) {
      task.status = pendingOverdueAction.targetStatus;
      task.overdueNote = note;
      saveTasks();
      renderBoard();
    }
  }

  closeOverdueModal();
});

btnCancelOverdue.addEventListener('click', closeOverdueModal);
btnCloseOverdue.addEventListener('click', closeOverdueModal);

// ============================================================================
// 7. MODAL DE CRIAÇÃO / EDIÇÃO DE TAREFAS
// ============================================================================
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');
const btnOpenModal = document.getElementById('btn-open-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');

const inputId = document.getElementById('task-id');
const inputTitle = document.getElementById('task-title-input');
const inputDesc = document.getElementById('task-desc-input');
const inputCategory = document.getElementById('task-category-input');
const inputDueDate = document.getElementById('task-due-date');
const selectStatus = document.getElementById('task-status-select');
const statusHint = document.getElementById('status-hint');

btnOpenModal.addEventListener('click', () => {
  openTaskModal();
});

function updateStatusSelectOptions() {
  selectStatus.innerHTML = '';
  columns.forEach(col => {
    const option = document.createElement('option');
    option.value = col.id;
    option.textContent = col.title;
    selectStatus.appendChild(option);
  });
}

function updateCategoryDatalist() {
  const datalist = document.getElementById('category-datalist');
  if (!datalist) return;

  const categoriesSet = new Set(['Trabalho', 'Estudo', 'Pessoal', 'Projetos', 'Geral']);
  tasks.forEach(t => {
    if (t.category && t.category.trim()) categoriesSet.add(t.category.trim());
  });

  datalist.innerHTML = '';
  categoriesSet.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    datalist.appendChild(opt);
  });
}

function openTaskModal(task = null) {
  taskForm.reset();
  statusHint.textContent = '';
  selectStatus.disabled = false;
  updateStatusSelectOptions();

  if (task) {
    modalTitle.textContent = 'Editar Tarefa';
    inputId.value = task.id;
    inputTitle.value = task.title;
    inputDesc.value = task.description || '';
    inputCategory.value = task.category || '';
    inputDueDate.value = task.dueDate;
    selectStatus.value = task.status;

    // Se já concluída, status não pode ser alterado
    if (task.status === 'done') {
      selectStatus.disabled = true;
      statusHint.textContent = '⚠️ Tarefas concluídas não podem ter o status alterado.';
    }
  } else {
    modalTitle.textContent = 'Nova Tarefa';
    inputId.value = '';
    inputCategory.value = 'Geral';
    inputDueDate.value = getFormattedDate(0);
    selectStatus.value = 'todo';
  }

  taskModal.classList.add('active');
  inputTitle.focus();
}

function closeTaskModal() {
  taskModal.classList.remove('active');
  taskForm.reset();
}

btnCloseModal.addEventListener('click', closeTaskModal);
btnCancelModal.addEventListener('click', closeTaskModal);

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = inputId.value;
  const title = inputTitle.value.trim();
  const description = inputDesc.value.trim();
  const category = inputCategory.value.trim() || 'Geral';
  const dueDate = inputDueDate.value;
  const newStatus = selectStatus.value;

  if (!title || !dueDate) {
    alert('Preencha os campos obrigatórios (*).');
    return;
  }

  if (id) {
    // Edição
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.title = title;
    task.description = description;
    task.category = category;
    task.dueDate = dueDate;

    if (task.status !== 'done' && newStatus === 'done') {
      const deadline = getDeadlineStatus(dueDate);
      if (deadline.status === 'overdue') {
        closeTaskModal();
        openOverdueModal(task.id, 'done');
        saveTasks();
        renderBoard();
        return;
      } else {
        task.status = 'done';
      }
    } else if (task.status !== 'done') {
      task.status = newStatus;
    }
  } else {
    // Nova Tarefa
    const newTask = {
      id: 'task-' + Date.now(),
      title,
      description,
      category,
      dueDate,
      status: 'todo',
      overdueNote: ''
    };

    if (newStatus === 'done') {
      const deadline = getDeadlineStatus(dueDate);
      if (deadline.status === 'overdue') {
        tasks.push(newTask);
        saveTasks();
        renderBoard();
        closeTaskModal();
        openOverdueModal(newTask.id, 'done');
        return;
      } else {
        newTask.status = 'done';
      }
    } else {
      newTask.status = newStatus;
    }

    tasks.push(newTask);
  }

  saveTasks();
  renderBoard();
  closeTaskModal();
});

// ============================================================================
// 8. MODAL DE NOVO QUADRO (COLUNA PERSONALIZADA)
// ============================================================================
const columnModal = document.getElementById('column-modal');
const columnForm = document.getElementById('column-form');
const btnOpenColumnModal = document.getElementById('btn-open-column-modal');
const btnCloseColumnModal = document.getElementById('btn-close-column-modal');
const btnCancelColumn = document.getElementById('btn-cancel-column');
const inputColumnTitle = document.getElementById('column-title-input');
const selectColumnColor = document.getElementById('column-color-select');

btnOpenColumnModal.addEventListener('click', () => {
  columnForm.reset();
  columnModal.classList.add('active');
  inputColumnTitle.focus();
});

function closeColumnModal() {
  columnModal.classList.remove('active');
  columnForm.reset();
}

btnCloseColumnModal.addEventListener('click', closeColumnModal);
btnCancelColumn.addEventListener('click', closeColumnModal);

columnForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = inputColumnTitle.value.trim();
  const color = selectColumnColor.value;

  if (!title) return;

  const newColId = 'col-' + Date.now();
  const newColumn = {
    id: newColId,
    title,
    color,
    isFixed: false
  };

  // Insere a nova coluna antes de "Finalizado" (para manter Finalizado no final)
  const doneIndex = columns.findIndex(c => c.id === 'done');
  if (doneIndex !== -1) {
    columns.splice(doneIndex, 0, newColumn);
  } else {
    columns.push(newColumn);
  }

  saveColumns();
  renderBoard();
  closeColumnModal();
});

// ============================================================================
// 9. EVENTOS EM CARTÕES E COLUNAS (EDIÇÃO, EXCLUSÃO, FINALIZAÇÃO)
// ============================================================================
function handleCardActions(e) {
  const target = e.target;
  const card = target.closest('.task-card');
  if (!card) return;

  const taskId = card.dataset.id;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  // Excluir Tarefa
  if (target.matches('.btn-delete') || target.closest('.btn-delete')) {
    e.stopPropagation();
    if (confirm(`Deseja realmente excluir a tarefa:\n"${task.title}"?`)) {
      tasks = tasks.filter(t => t.id !== taskId);
      saveTasks();
      renderBoard();
    }
    return;
  }

  // Editar Tarefa
  if (target.matches('.btn-edit') || target.closest('.btn-edit')) {
    e.stopPropagation();
    openTaskModal(task);
    return;
  }

  // Concluir Rápido
  if (target.matches('.btn-finish-quick')) {
    e.stopPropagation();
    attemptChangeTaskStatus(taskId, 'done');
    return;
  }
}

// Exclusão de Colunas Customizadas
boardContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-delete-column');
  if (!btn) return;

  const colId = btn.dataset.colId;
  const col = columns.find(c => c.id === colId);
  if (!col || col.isFixed) return;

  const tasksInCol = tasks.filter(t => t.status === colId);
  const msg = tasksInCol.length > 0
    ? `Excluir o quadro "${col.title}"? As ${tasksInCol.length} tarefas nele serão movidas para "A Fazer".`
    : `Deseja realmente excluir o quadro "${col.title}"?`;

  if (confirm(msg)) {
    // Move tarefas da coluna deletada para 'todo'
    tasks.forEach(t => {
      if (t.status === colId) t.status = 'todo';
    });
    // Remove a coluna
    columns = columns.filter(c => c.id !== colId);

    saveTasks();
    saveColumns();
    renderBoard();
  }
});

// Fecha modais com backdrop
window.addEventListener('click', (e) => {
  if (e.target === taskModal) closeTaskModal();
  if (e.target === columnModal) closeColumnModal();
  if (e.target === overdueModal) closeOverdueModal();
});

// ============================================================================
// 10. INICIALIZAÇÃO
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderBoard();
});
