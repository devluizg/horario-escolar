# Walkthrough: Melhoria na Impressão de Horário (Modo Provisório)

## O que foi feito
Implementamos a funcionalidade de "Modo Provisório" na impressão da grade horária, atendendo à necessidade da escola de operar com apenas o turno da manhã (5 aulas) temporariamente.

### Alterações Principais
1.  **Nova Opção na UI**:
    - Adicionado um checkbox **"☀️ Apenas Manhã"** no topo da tela, ao lado do botão de Imprimir.
2.  **Lógica de Impressão (`printSchedule`)**:
    - Quando a opção "Apenas Manhã" está marcada:
        - O sistema filtra automaticamente as aulas, removendo o Almoço e o turno da Tarde.
        - A quebra de página forçada após cada dia (segunda, terça, etc.) é removida.
        - Os dias são empilhados na mesma página, permitindo visualizar **2 a 3 dias por página** (dependendo do layout e impressora), em vez de 1 dia por página.
        - O estilo visual é ajustado para separar os dias com uma linha tracejada e reduzir margens desnecessárias.

## Como Verificar
1.  Abra a página da Grade de Horários.
2.  Localize o checkbox **"☀️ Apenas Manhã"** no menu de controles.
3.  **Marque** o checkbox.
4.  Clique no botão **"🖨️ Imprimir"**.
5.  Na janela de visualização de impressão do navegador:
    - Confirme que apenas as aulas 1 a 5 (turno da manhã) estão visíveis.
    - Confirme que múltiplos dias (ex: Segunda e Terça) aparecem na primeira página.
    - O consumo de papel deve ser reduzido de 5 páginas para aproximadamente 2 páginas.

## Arquivos Modificados
- `horario.html`: Adição do checkbox.
- `main.js`: Implementação da lógica de filtragem e layout compacto na função `printSchedule`.
