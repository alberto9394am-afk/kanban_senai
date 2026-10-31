/**
 * DASHBOARD ANALÍTICO - KANBAN SIMPLES
 * Apresenta indicadores de produtividade, status e gráfico de categorias
 * Fonte de dados: LocalStorage compartilhado com a página principal
 */

const STORAGE_TASKS_KEY = 'antigravity_kanban_tasks';

// Carrega as tarefas salvas
let tasks = [];
try {
  const stored = localStorage.getItem(STORAGE_TASKS_KEY);
  tasks = stored ? JSON.parse(stored) : [];
} catch (e) {
  console.error('Erro ao ler tarefas do localStorage:', e);
  tasks = [];
}

document.addEventListener('DOMContentLoaded', () => {
  renderKPIs();
  renderCategorySummary();
  renderCategoryChart();
});

// ============================================================================
// 1. CÁLCULO E RENDERIZAÇÃO DOS KPIS
// ============================================================================
function renderKPIs() {
  // Tarefas Concluídas (status === 'done')
  const doneTasks = tasks.filter(t => t.status === 'done');
  
  // Tarefas Em Execução (status === 'doing')
  const doingTasks = tasks.filter(t => t.status === 'doing');
  
  // Tarefas Pendentes (qualquer status diferente de 'done')
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  
  // Tarefas Concluídas Fora do Prazo (possuem nota de justificativa de atraso registrada)
  const overdueDoneTasks = tasks.filter(t => {
    return t.status === 'done' && t.overdueNote && t.overdueNote.trim().length > 0;
  });

  document.getElementById('kpi-done').textContent = doneTasks.length;
  document.getElementById('kpi-doing').textContent = doingTasks.length;
  document.getElementById('kpi-pending').textContent = pendingTasks.length;
  document.getElementById('kpi-overdue-done').textContent = overdueDoneTasks.length;
}

// ============================================================================
// 2. AGRUPAMENTO E DETALHAMENTO POR CATEGORIA
// ============================================================================
function getCategoryData() {
  const categoryMap = {};

  tasks.forEach(task => {
    const cat = (task.category && task.category.trim()) ? task.category.trim() : 'Geral';
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        total: 0,
        done: 0,
        pending: 0
      };
    }
    categoryMap[cat].total += 1;
    if (task.status === 'done') {
      categoryMap[cat].done += 1;
    } else {
      categoryMap[cat].pending += 1;
    }
  });

  return categoryMap;
}

function renderCategorySummary() {
  const container = document.getElementById('category-summary-container');
  container.innerHTML = '';

  const categoryMap = getCategoryData();
  const categories = Object.keys(categoryMap);

  if (categories.length === 0) {
    container.innerHTML = '<p class="field-hint" style="padding: 1rem 0;">Nenhuma tarefa encontrada.</p>';
    return;
  }

  // Ordena por quantidade total decrescente
  categories.sort((a, b) => categoryMap[b].total - categoryMap[a].total);

  categories.forEach(cat => {
    const item = categoryMap[cat];
    const el = document.createElement('div');
    el.className = 'category-summary-item';

    el.innerHTML = `
      <div class="category-summary-name">
        <span>🏷️</span>
        <div>
          <span>${escapeHtml(cat)}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">
            ${item.done} concluída(s) • ${item.pending} pendente(s)
          </div>
        </div>
      </div>
      <span class="category-summary-count">${item.total}</span>
    `;

    container.appendChild(el);
  });
}

// ============================================================================
// 3. GRÁFICO COM NÚMERO DE TAREFAS POR CATEGORIA (CHART.JS)
// ============================================================================
function renderCategoryChart() {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  const categoryMap = getCategoryData();
  const labels = Object.keys(categoryMap);
  const data = labels.map(label => categoryMap[label].total);

  // Paleta de cores moderna
  const backgroundColors = [
    '#3b82f6', // Azul
    '#8b5cf6', // Roxo
    '#ec4899', // Rosa
    '#f59e0b', // Âmbar
    '#10b981', // Verde
    '#06b6d4', // Ciano
    '#64748b'  // Cinza
  ];

  // Caso Chart.js não esteja disponível (ex: offline), cria fallback visual
  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
        <p>A biblioteca gráfica requer conexão à internet para ser carregada via CDN.</p>
        <p>Veja os dados detalhados na coluna ao lado.</p>
      </div>
    `;
    return;
  }

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Sem dados'],
      datasets: [{
        label: 'Quantidade de Tarefas',
        data: data.length > 0 ? data : [0],
        backgroundColor: backgroundColors.slice(0, labels.length || 1),
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              return ` ${val} ${val === 1 ? 'tarefa' : 'tarefas'}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          },
          grid: {
            color: '#f1f5f9'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

