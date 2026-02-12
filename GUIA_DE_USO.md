# 🎯 GUIA DE USO - Modo "Perspectiva por Turma"

## 📖 Introdução

Este guia explica como usar as duas formas de visualização do sistema de grade de horários.

---

## 🎨 Interface Principal

### Barra de Controles

Você verá os seguintes controles no topo da página:

```
┌─────────────────────────────────────────────────────────────────────┐
│  [📅 Modo: Geral] [🏫 Turma: ___] [📊 Relatório] [💾 Exportar] ...  │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- **[📅 Modo: Geral/Por Turma]**: Botão para alternar entre modos
- **[🏫 Turma: ___]**: Seletor de turma (aparece apenas no modo por turma)
- **[📅 Horário por Turma]**: Abre modal de visualização completa

---

## 1️⃣ MODO GERAL (Padrão)

### Quando Usar
- Quando você quer ver todas as turmas de um dia específico
- Para organizar um dia completo de aulas
- Para visualizar carga de trabalho diária dos professores

### Layout
```
┌──────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ HORÁRIO  │  101    │  102    │  103    │  104    │  ...    │
├──────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ AULA 1   │  Mat.   │  Port.  │  Hist.  │  Fís.   │  ...    │
│ 7:20-8:10│  Prof A │  Prof B │  Prof C │  Prof D │  ...    │
├──────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ AULA 2   │         │         │         │         │  ...    │
│ 8:10-9:00│         │         │         │         │  ...    │
├──────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│   ...    │   ...   │   ...   │   ...   │   ...   │  ...    │
└──────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

         📊 Resumo do Dia: Segunda-feira
    👥 5 professores | 📚 Total: 25 aulas
```

### Como Usar

1. **Selecionar Dia**
   - Clique em uma das tabs: Segunda | Terça | Quarta | Quinta | Sexta
   - A grade mostrará todas as turmas daquele dia

2. **Adicionar Aula**
   - Arraste um professor da sidebar
   - Solte na célula desejada (turma + horário)
   - Selecione a disciplina no popup
   - ✅ Aula adicionada!

3. **Visualizar Resumo**
   - Role até o final da tabela
   - Veja quantas aulas cada professor tem no dia
   - Cores correspondem às cores dos professores

---

## 2️⃣ MODO POR TURMA

### Quando Usar
- Quando você quer ver a semana completa de uma turma
- Para verificar se uma turma tem aulas distribuídas equilibradamente
- Para visualizar carga semanal de professores em uma turma específica

### Como Ativar

1. Clique no botão **"📅 Modo: Geral"**
2. O botão mudará para **"🏫 Modo: Por Turma"**
3. Um seletor de turma aparecerá ao lado
4. As tabs de dias desaparecerão

### Layout
```
┌──────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ HORÁRIO  │  SEG    │  TER    │  QUA    │  QUI    │  SEX    │
├──────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ AULA 1   │  Mat.   │  Port.  │  Mat.   │  Hist.  │  Mat.   │
│ 7:20-8:10│  Prof A │  Prof B │  Prof A │  Prof C │  Prof A │
├──────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ AULA 2   │  Port.  │  Mat.   │  Port.  │  Geo.   │  Port.  │
│ 8:10-9:00│  Prof B │  Prof A │  Prof B │  Prof D │  Prof B │
├──────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│   ...    │   ...   │   ...   │   ...   │   ...   │   ...   │
└──────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

         📊 Resumo Semanal: Turma 101
    👥 8 professores | 📚 Total: 45 aulas

    Prof A (Matemática) ................ 12 aulas
    Prof B (Português) .................. 10 aulas
    Prof C (História) ................... 6 aulas
    ...
```

### Como Usar

1. **Selecionar Turma**
   - Use o dropdown **"🏫 Turma:"**
   - Escolha a turma (ex: Turma 101)
   - A grade mostrará os 5 dias da semana

2. **Adicionar Aula**
   - Arraste um professor da sidebar
   - Solte na célula desejada (dia + horário)
   - Selecione a disciplina no popup
   - ✅ Aula adicionada!

3. **Trocar de Turma**
   - Basta selecionar outra turma no dropdown
   - A grade será atualizada automaticamente

4. **Voltar ao Modo Geral**
   - Clique novamente no botão (agora mostra "🏫 Modo: Por Turma")
   - Voltará ao modo geral

---

## 3️⃣ MODAL DE VISUALIZAÇÃO COMPLETA

### Quando Usar
- Para visualizar sem editar
- Para imprimir horário de uma turma
- Para apresentar o horário para coordenação/direção
- Para enviar por e-mail/WhatsApp (após imprimir como PDF)

### Como Usar

1. **Abrir Modal**
   - Clique no botão **"📅 Horário por Turma"** (disponível em qualquer modo)
   - Uma janela modal abrirá

2. **Selecionar Turma**
   - Use o dropdown no topo do modal
   - Escolha a turma desejada
   - A grade semanal completa aparecerá

3. **Visualizar**
   - Veja toda a semana em uma única tela
   - Cores dos professores facilitam identificação
   - Resumo semanal mostra estatísticas

4. **Imprimir**
   - Clique em **"🖨️ Imprimir"**
   - Uma janela de impressão abrirá
   - Configure e imprima (ou salve como PDF)

5. **Fechar**
   - Clique no **X** no canto superior direito
   - Ou pressione **ESC** no teclado

---

## 🔄 Sincronização Entre Modos

### Como Funciona

Todos os modos compartilham os mesmos dados. Isso significa:

✅ **Alterações no Modo Geral aparecem no Modo Por Turma**
   - Adicione aula na Segunda-feira para Turma 101
   - Mude para Modo Por Turma e selecione Turma 101
   - A aula estará lá na coluna Segunda-feira

✅ **Alterações no Modo Por Turma aparecem no Modo Geral**
   - Adicione aula na Quarta-feira para a turma selecionada
   - Mude para Modo Geral e selecione Quarta-feira
   - A aula estará lá na coluna da turma

✅ **Visualização Modal sempre reflete dados atuais**
   - Qualquer alteração é imediatamente visível no modal

---

## 🎨 Dicas Visuais

### Identificação de Professores
- Cada professor tem uma cor única (gradiente)
- As cores são consistentes em todos os modos
- Nomes longos são truncados com "..."

### Indicadores de Status
- ✅ **Verde**: Sem conflitos
- ⚠️ **Vermelho**: Conflito detectado (professor em duas turmas no mesmo horário)
- 📊 **Resumos**: Mostram estatísticas úteis

### Intervalos
- Almoço e Intervalos têm fundo diferenciado
- Não podem receber aulas (somente leitura)

---

## ⌨️ Atalhos de Teclado

- **ESC**: Fecha modais e seletores abertos
- **Ctrl + S**: Exporta JSON da grade
- **Arrastar + Soltar**: Adiciona ou move aulas

---

## 🚨 Validações Automáticas

### Conflitos
O sistema detecta automaticamente:
- Professor em duas turmas no mesmo horário
- Cards de aula ficam vermelhos quando há conflito
- Alerta visual no topo da página

### Restrições
Se um professor tem restrição de horário:
- 🚫 Não pode ser alocado nos horários bloqueados
- Alerta é exibido ao tentar alocar

### Limites de Carga Horária
Se uma disciplina atingiu o limite semanal para uma turma:
- ⚠️ Opção fica desabilitada no seletor de disciplinas
- Badge mostra progresso (ex: 3/3)

---

## 📊 Resumos e Relatórios

### Resumo Diário (Modo Geral)
- Aparece no final da tabela
- Mostra professores que dão aula naquele dia
- Número de aulas por professor

### Resumo Semanal (Modo Por Turma)
- Aparece no final da tabela
- Mostra todos os professores da turma
- Total de aulas semanais por professor

### Relatório Completo
- Clique em **"📊 Relatório de Professores"**
- Veja estatísticas detalhadas de todos os professores
- Filtre por disciplina
- Ordene por nome ou carga horária

---

## 🎯 Casos de Uso Reais

### 📝 Caso 1: Organizar Segunda-feira
1. Fique no Modo Geral
2. Selecione tab "Segunda-feira"
3. Arraste professores para preencher todas as turmas
4. Verifique resumo diário no final

### 📝 Caso 2: Completar Horário da Turma 101
1. Mude para Modo Por Turma
2. Selecione "Turma 101"
3. Preencha todos os dias da semana
4. Verifique resumo semanal

### 📝 Caso 3: Verificar Distribuição de Professor
1. Use qualquer modo
2. Clique em "📊 Relatório de Professores"
3. Encontre o professor
4. Veja distribuição por dias e turmas

### 📝 Caso 4: Imprimir para Afixar na Sala
1. Clique em "📅 Horário por Turma"
2. Selecione a turma
3. Clique em "🖨️ Imprimir"
4. Salve como PDF ou imprima

---

## ❓ Perguntas Frequentes

### P: Posso editar no modal de visualização?
**R:** Não, o modal é apenas para visualização e impressão. Use os modos Geral ou Por Turma para editar.

### P: As alterações são salvas automaticamente?
**R:** Sim! Toda alteração é salva automaticamente no navegador (localStorage).

### P: Posso desfazer uma ação?
**R:** Atualmente não há função de desfazer. Para remover uma aula, clique no **X** no card da aula.

### P: Quantas turmas posso ter?
**R:** Ilimitado! O sistema se adapta automaticamente.

### P: Posso personalizar os horários das aulas?
**R:** Sim! Clique em **"⏰ Configurar Horários"** na sidebar.

---

## 🎉 Conclusão

Agora você tem duas formas poderosas de visualizar e editar sua grade de horários:

- **Modo Geral**: Perfeito para organizar dia por dia
- **Modo Por Turma**: Perfeito para visualizar semanas completas

Use o que fizer mais sentido para a tarefa do momento! 🚀

---

**Desenvolvido com ❤️ para facilitar a gestão escolar**
