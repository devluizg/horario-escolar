// ==================== CADASTRO AUTOMÁTICO DE RESTRIÇÕES ====================
// Este arquivo configura as restrições de horário para os professores
// Execute loadRestrictionsSetup() após carregar os professores

function loadRestrictionsSetup() {
    console.log('🚫 Configurando restrições de horário dos professores...');

    // Limpar restrições existentes
    for (let key in teacherRestrictions) {
        delete teacherRestrictions[key];
    }

    // Função auxiliar para encontrar índice do professor
    function findTeacher(name) {
        return teachers.findIndex(t =>
            t.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(t.name.toLowerCase())
        );
    }

    // Função para adicionar restrição de dia inteiro
    function addDayRestriction(teacherName, day) {
        const idx = findTeacher(teacherName);
        if (idx === -1) {
            console.warn(`⚠️ Professor não encontrado: ${teacherName}`);
            return false;
        }

        if (!teacherRestrictions[idx]) {
            teacherRestrictions[idx] = [];
        }

        // Verificar se já existe
        const exists = teacherRestrictions[idx].some(r =>
            r.type === 'day' && r.days && r.days.includes(day)
        );

        if (!exists) {
            teacherRestrictions[idx].push({
                type: 'day',
                days: [day]
            });
            console.log(`✅ ${teachers[idx].name}: não trabalha na ${dayNames[day]}`);
            return true;
        }
        return false;
    }

    // Função para adicionar restrição de horários específicos (manhã/tarde)
    function addTimeRestriction(teacherName, day, period) {
        const idx = findTeacher(teacherName);
        if (idx === -1) {
            console.warn(`⚠️ Professor não encontrado: ${teacherName}`);
            return false;
        }

        if (!teacherRestrictions[idx]) {
            teacherRestrictions[idx] = [];
        }

        // Identificar índices dos horários de tarde (AULA 6, 7, 8, 9)
        // No array timeSlots: 0=AULA1, 1=AULA2, 2=INTERVALO, 3=AULA3, 4=AULA4, 5=AULA5, 6=ALMOÇO, 7=AULA6, 8=AULA7, 9=INTERVALO2, 10=AULA8, 11=AULA9
        const afternoonSlots = [7, 8, 10, 11]; // Índices das AULA 6, 7, 8, 9

        afternoonSlots.forEach(timeIdx => {
            const exists = teacherRestrictions[idx].some(r =>
                r.type === 'dayTime' && r.day === day && r.time === timeIdx
            );

            if (!exists) {
                teacherRestrictions[idx].push({
                    type: 'dayTime',
                    day: day,
                    time: timeIdx
                });
            }
        });

        console.log(`✅ ${teachers[idx].name}: não trabalha na ${dayNames[day]} à tarde`);
        return true;
    }

    // ==================== SEGUNDA-FEIRA ====================
    console.log('\n📅 SEGUNDA-FEIRA - Professores que não trabalham:');
    addDayRestriction('Edimundo', 'segunda');
    addDayRestriction('Cassiano', 'segunda');
    addDayRestriction('Elenflávia', 'segunda');
    addDayRestriction('Eunice', 'segunda');

    // ==================== TERÇA-FEIRA ====================
    console.log('\n📅 TERÇA-FEIRA - Professores que não trabalham:');
    addDayRestriction('Lucílio', 'terca');
    addDayRestriction('Biologia', 'terca');
    addDayRestriction('Rogério', 'terca');
    addDayRestriction('Milton', 'terca');

    // ==================== QUINTA-FEIRA ====================
    console.log('\n📅 QUINTA-FEIRA - Professores que não trabalham:');
    addDayRestriction('Português 1', 'quinta');
    addDayRestriction('Jhonatan', 'quinta');
    addDayRestriction('Vanessa', 'quinta');
    addDayRestriction('Física', 'quinta');
    addDayRestriction('Elenilson', 'quinta');

    // ==================== SEXTA-FEIRA ====================
    console.log('\n📅 SEXTA-FEIRA - Professores que não trabalham:');
    addDayRestriction('Luiz', 'sexta');
    addDayRestriction('Kelso', 'sexta');
    addDayRestriction('Lucidalva', 'sexta');
    addDayRestriction('Português 2', 'sexta');

    // ==================== ELIANA - CASO ESPECIAL ====================
    console.log('\n📅 ELIANA - Restrições específicas (trabalha todas as manhãs, mas não segunda e sexta à tarde):');
    addTimeRestriction('Eliana', 'segunda', 'tarde');
    addTimeRestriction('Eliana', 'sexta', 'tarde');

    // Salvar no localStorage
    saveToStorage();
    console.log('\n✅ Todas as restrições foram cadastradas com sucesso!');
    console.log(`📊 Total de professores com restrições: ${Object.keys(teacherRestrictions).length}`);
}
