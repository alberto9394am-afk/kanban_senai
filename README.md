# 📋 Kanban Simples com Dashboard de Métricas

Projeto desenvolvido com foco didático para aula de **Google Antigravity**, utilizando **HTML5, CSS3 e JavaScript puro (Vanilla)**, com persistência local em `localStorage` (sem necessidade de backend ou banco de dados).

---

## 🚀 Novidades Implementadas

### 1. ➕ Criação de Novos Quadros Dinâmicos
- **3 Quadros Fixos Iniciais:** `A Fazer`, `Em Execução` e `Finalizado` permanecem como pilares fundamentais e não podem ser excluídos.
- **Novos Quadros Personalizados:** O usuário pode criar novos quadros pelo botão **"+ Novo Quadro"** (ex: *Revisão*, *Design*, *Testes*, *Bloqueado*) escolhendo uma cor indicadora.
- Novos quadros são inseridos antes da coluna de encerramento (*Finalizado*) e podem ser excluídos com segurança (as tarefas são remanejadas automaticamente para *A Fazer*).
- O sistema de **Drag and Drop** e a seleção de status no modal reconhecem imediatamente todos os quadros cadastrados.

### 2. 🏷️ Categorias para Tarefas
- Cada tarefa pode receber uma categoria (ex: *Trabalho*, *Estudo*, *Pessoal*, *Projetos*, *Geral* ou categorias personalizadas digitadas pelo usuário com autocompletar).
- Cada cartão exibe uma tag visual destacada com a categoria correspondente.

### 3. 📊 Novo Caminho: Página de Dashboard (`dashboard.html`)
Navegação direta no topo entre o **Quadro Kanban** e o **Dashboard**:
- **Indicadores Principais (KPIs):**
  - ✅ **Tarefas Concluídas:** Total de tarefas finalizadas.
  - ⚡ **Tarefas em Execução:** Tarefas atualmente em andamento.
  - ⏳ **Tarefas Pendentes:** Total de tarefas não concluídas em qualquer coluna ativa.
  - ⚠️ **Tarefas Concluídas Fora do Prazo:** Contagem de tarefas finalizadas com registro obrigatório de atraso.
- **Gráfico Interativo:**
  - 📊 Gráfico de barras com a quantidade de tarefas por categoria (gerado via *Chart.js* com fallback visual).
  - 📋 Painel de detalhamento listando cada categoria, total de tarefas, quantidade concluída e pendente.

---

## 🔒 Regras de Negócio e Restrições Atendidas

1. **Tarefas Concluídas:** O status não pode ser alterado e o cartão não pode ser arrastado de volta.
2. **Tarefas Vencidas:** Só podem ser finalizadas se o usuário preencher a **justificativa obrigatória** no modal. A justificativa fica visível no cartão concluído e alimenta a métrica de tarefas fora do prazo no Dashboard.
3. **Finalização Antecipada:** O usuário pode concluir qualquer tarefa a qualquer momento antes do prazo através de *Drag and Drop* ou do botão *"✓ Concluir"*.

---

## 📂 Estrutura de Arquivos

```text
├── index.html       # Página principal: Quadro Kanban com suporte a quadros dinâmicos
├── dashboard.html   # Nova página: Indicadores, KPIs e Gráfico por Categoria
├── style.css        # Estilos modernos, responsivos, temas de quadros e dashboard
├── script.js        # Lógica do Kanban, Drag and Drop, categorias e persistência
├── dashboard.js     # Lógica analítica de métricas e renderização do gráfico
└── README.md        # Documentação completa
```

---

## 💡 Como Testar na Aula

1. Dê um duplo clique em [index.html](file:///c:/Users/Aluno/Alberto/index.html) para abrir o Kanban.
2. Clique em **"+ Novo Quadro"** e crie uma coluna chamada `"Em Revisão"` com a cor roxa.
3. Crie uma nova tarefa selecionando ou digitando uma categoria personalizada (ex: `"Marketing"`).
4. Arraste a tarefa atrasada para a coluna `"Finalizado"` e preencha a justificativa obrigatória.
5. Clique no menu superior em **"📊 Dashboard"** (ou abra [dashboard.html](file:///c:/Users/Aluno/Alberto/dashboard.html)) para ver todos os números, o gráfico de categorias e a métrica de concluídas fora do prazo atualizados em tempo real!
