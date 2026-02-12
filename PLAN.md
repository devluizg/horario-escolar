# PLANO DE IMPLEMENTAÇÃO: Melhoria no Download/Impressão de Grade (Modo Provisório)

## 1. Contexto & Problema
A escola opera em tempo integral (9 aulas), mas por restrições operacionais temporárias (falta de professores/merenda), funcionará apenas no turno da manhã (5 aulas) nos primeiros meses.
O sistema atual de impressão gera 1 página por dia, exibindo espaços vazios para o turno da tarde, o que resulta em desperdício de papel e baixa legibilidade (fontes pequenas ou layout espaçado demais).
O usuário deseja um **"Horário Provisório"** que exiba apenas as aulas da manhã e condense a visualização em 1 ou 2 páginas no máximo.

## 2. Solução Proposta
Implementar uma funcionalidade de **"Impressão Compacta / Apenas Manhã"**.
Ao ativar esta opção:
1.  O sistema filtrará os slots de horário, ignorando tudo após a 5ª aula.
2.  A lógica de quebra de página (Page Break) será alterada para permitir que múltiplos dias caibam na mesma página.
3.  O layout será ajustado para maximizar o uso do espaço.

## 3. Análise de Impacto

### Arquivos Afetados:
- `horario.html`: Adição do checkbox/toggle na UI.
- `main.js`: Modificação na função `printSchedule` para respeitar o filtro e alterar a paginação.
- `style.css`: Ajustes de CSS para impressão (media print) se necessário, para garantir que dias não sejam cortados ao meio de forma estranha.

## 4. Estratégia de Implementação (Passo a Passo)

### Passo 1: UI Update (`horario.html`)
Adicionar um checkbox "🖨️ Modo Provisório (Apenas Manhã)" próximo ao botão de Imprimir.

### Passo 2: Lógica de Impressão (`main.js`)
Alterar a função `printSchedule()`:
1.  Ler o estado do checkbox.
2.  Se ativado:
    - Filtrar `timeSlots` para manter apenas até o id '5' (ou antes do 'almoco').
    - Alterar o loop de renderização dos dias.
    - **Remover** a `div.page-break` forçada após cada dia.
    - Adicionar um container flex/grid para tentar colocar dias lado a lado ou em sequência contínua.
    - Adicionar quebra de página forçada apenas se necessário (ex: a cada 3 dias, ou deixar o fluxo natural com `page-break-inside: avoid` nos containers dos dias).

### Passo 3: Estilização (`style.css`)
Adicionar classe `.print-compact` ao body ou container de impressão.
```css
@media print {
    .print-compact .day-container {
        page-break-inside: avoid;
        margin-bottom: 20px;
        /* Possivelmente reduzir padding para caber mais */
    }
}
```

## 5. Algoritmo de Filtragem
Os slots da manhã são identificados pelos IDs: `1`, `2`, `intervalo1`, `3`, `4`, `5`.
O filtro deve excluir: `almoco`, `6`, `7`, `intervalo2`, `8`, `9`.

## 6. Verificação & Testes
1.  Ativar checkbox.
2.  Clicar em "Imprimir".
3.  Verificar no preview de impressão do navegador:
    - Apenas aulas 1-5 aparecem?
    - Os dias seg/ter/qua cabem na página 1? Qui/sex na página 2? (Ou todos em 1, dependendo da escala).
    - Não há slots vazios de tarde ocupando espaço.

---

**MÓDULO ARQUITETO:** Plano aprovado. Pronto para execução.
