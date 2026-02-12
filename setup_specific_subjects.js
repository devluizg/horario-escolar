// ==================== CADASTRO AUTOMÁTICO DE ITINERÁRIOS FORMATIVOS ====================
// Este arquivo configura os itinerários formativos para cada professor

function loadSpecificSubjectsSetup() {
    console.log('📚 Configurando itinerários formativos dos professores...');

    // Função auxiliar para encontrar índice do professor
    function findTeacher(name) {
        return teachers.findIndex(t =>
            t.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(t.name.toLowerCase())
        );
    }

    // Função para adicionar itinerário formativo
    function addSpecificSubject(teacherName, subject, classId, hoursPerWeek) {
        const idx = findTeacher(teacherName);
        if (idx === -1) {
            console.warn(`⚠️ Professor não encontrado: ${teacherName}`);
            return false;
        }

        if (!teacherSpecificSubjects[idx]) {
            teacherSpecificSubjects[idx] = [];
        }

        // Verificar se já existe
        const exists = teacherSpecificSubjects[idx].some(s =>
            s.subject === subject && s.class === classId
        );

        if (!exists) {
            teacherSpecificSubjects[idx].push({
                subject: subject,
                class: classId,
                hoursPerWeek: hoursPerWeek
            });
            console.log(`  ✅ ${subject} - Turma ${classId} (${hoursPerWeek}h)`);
            return true;
        }
        return false;
    }

    // ==================== VANESSA ====================
    console.log('\n📘 Professora: Vanessa (Língua Inglesa)');
    addSpecificSubject('Vanessa', 'Aprofundamento de Linguagens', '101', 2);
    addSpecificSubject('Vanessa', 'Aprofundamento de Linguagens', '102', 2);
    addSpecificSubject('Vanessa', 'Aprofundamento de Linguagens', '103', 2);
    addSpecificSubject('Vanessa', 'Eletiva', '102', 2);
    addSpecificSubject('Vanessa', 'Projeto de Vida', '102', 1);
    addSpecificSubject('Vanessa', 'PPA', '102', 2);
    addSpecificSubject('Vanessa', 'Inglês 2', '204', 1);

    // ==================== EDIMUNDO ====================
    console.log('\n📘 Professor: Edimundo (Química)');
    addSpecificSubject('Edimundo', 'Práticas Experimentais', '101', 1);
    addSpecificSubject('Edimundo', 'Práticas Experimentais', '102', 1);
    addSpecificSubject('Edimundo', 'Práticas Experimentais', '103', 1);
    addSpecificSubject('Edimundo', 'Práticas Experimentais', '201', 1);

    // ==================== LUCÍLIO ====================
    console.log('\n📘 Professor: Lucílio (Geografia)');
    addSpecificSubject('Lucílio', 'Educação Ambiental', '101', 1);
    addSpecificSubject('Lucílio', 'Educação Ambiental', '102', 1);
    addSpecificSubject('Lucílio', 'Educação Ambiental', '103', 1);
    addSpecificSubject('Lucílio', 'Educação Ambiental', '104', 1);
    addSpecificSubject('Lucílio', 'Educação Ambiental', '301', 1);
    addSpecificSubject('Lucílio', 'Educação Ambiental', '302', 1);

    // ==================== ELENFLÁVIA ====================
    console.log('\n📘 Professora: Elenflávia (História)');
    addSpecificSubject('Elenflávia', 'Eletiva', '201', 2);
    addSpecificSubject('Elenflávia', 'Projeto de Vida', '301', 1);

    // ==================== ROGÉRIO ====================
    console.log('\n📘 Professor: Rogério (Matemática)');
    addSpecificSubject('Rogério', 'Aprofundamento de Matemática', '103', 2);
    addSpecificSubject('Rogério', 'Aprofundamento de Matemática', '201', 2);
    addSpecificSubject('Rogério', 'Aprofundamento de Matemática', '202', 2);
    addSpecificSubject('Rogério', 'Aprofundamento de Matemática', '301', 2);
    addSpecificSubject('Rogério', 'Estudo Orientado - Matemática', '201', 3);
    addSpecificSubject('Rogério', 'Estudo Orientado - Matemática', '202', 3);
    addSpecificSubject('Rogério', 'Eletiva', '203', 2);
    addSpecificSubject('Rogério', 'PPA', '203', 2);

    // ==================== EUNICE ====================
    console.log('\n📘 Professora: Eunice (Português)');
    addSpecificSubject('Eunice', 'Estudo Orientado - Língua Portuguesa', '201', 3);
    addSpecificSubject('Eunice', 'Estudo Orientado - Língua Portuguesa', '202', 3);
    addSpecificSubject('Eunice', 'Estudo Orientado - Língua Portuguesa', '204', 3);
    addSpecificSubject('Eunice', 'PPA', '301', 2);

    // ==================== ELIANA ====================
    console.log('\n📘 Professora: Eliana (Português)');
    addSpecificSubject('Eliana', 'Projeto de Vida', '101', 1);
    addSpecificSubject('Eliana', 'Aprofundamento de Linguagens', '202', 2);
    addSpecificSubject('Eliana', 'Aprofundamento de Linguagens', '203', 2);
    addSpecificSubject('Eliana', 'Aprofundamento de Linguagens', '301', 2);
    addSpecificSubject('Eliana', 'Estudo Orientado - Língua Portuguesa', '301', 3);
    addSpecificSubject('Eliana', 'Estudo Orientado - Língua Portuguesa', '302', 3);
    addSpecificSubject('Eliana', 'PPA', '302', 2);

    // ==================== KELSO ====================
    console.log('\n📘 Professor: Kelso (Arte)');
    addSpecificSubject('Kelso', 'Aprofundamento de Linguagens', '104', 2);
    addSpecificSubject('Kelso', 'Aprofundamento de Linguagens', '201', 2);
    addSpecificSubject('Kelso', 'Aprofundamento de Linguagens', '302', 2);
    addSpecificSubject('Kelso', 'PPA', '103', 2);
    addSpecificSubject('Kelso', 'Eletiva', '101', 2);

    // ==================== LUIZ ====================
    console.log('\n📘 Professor: Luiz (Matemática)');
    addSpecificSubject('Luiz', 'Aprofundamento de Matemática', '104', 2);
    addSpecificSubject('Luiz', 'Aprofundamento de Ciências da Natureza', '101', 2);
    addSpecificSubject('Luiz', 'PPA', '101', 2);
    addSpecificSubject('Luiz', 'Estudo Orientado - Matemática', '204', 3);
    addSpecificSubject('Luiz', 'Estudo Orientado - Matemática', '301', 3);

    // ==================== CASSIANO ====================
    console.log('\n📘 Professor: Cassiano (Sociologia)');
    addSpecificSubject('Cassiano', 'Aprofundamento de Ciências Humanas', '102', 2);
    addSpecificSubject('Cassiano', 'Aprofundamento de Ciências Humanas', '104', 2);
    addSpecificSubject('Cassiano', 'Aprofundamento de Ciências Humanas', '201', 2);
    addSpecificSubject('Cassiano', 'Aprofundamento de Ciências Humanas', '202', 2);
    addSpecificSubject('Cassiano', 'Aprofundamento de Ciências Humanas', '203', 2);

    // ==================== ELENILSON ====================
    console.log('\n📘 Professor: Elenilson (Filosofia)');
    addSpecificSubject('Elenilson', 'Aprofundamento de Ciências da Natureza', '101', 2);
    addSpecificSubject('Elenilson', 'Aprofundamento de Ciências da Natureza', '103', 2);
    addSpecificSubject('Elenilson', 'Aprofundamento de Ciências da Natureza', '301', 2);
    addSpecificSubject('Elenilson', 'Aprofundamento de Ciências da Natureza', '302', 2);

    // Salvar no localStorage
    saveToStorage();
    console.log('\n✅ Todos os itinerários formativos foram cadastrados com sucesso!');
}
