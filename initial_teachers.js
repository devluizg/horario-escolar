// ==================== PROFESSORES INICIAIS (BANCO DE DADOS LOCAL) ====================
// Este arquivo contém a lista de professores que serão carregados automaticamente
// caso não existam dados salvos no navegador.

const initialTeachersData = [
    {
        name: "Jhonatan",
        subject: "Educação Física",
        classes: ["101", "102", "103", "104", "301", "302", "201", "202", "203", "204"],
        colorIdx: 0, // 🔴 Vermelho
        classHours: {
            "101": 1, "102": 1, "103": 1, "104": 1,
            "301": 1, "302": 1,
            "201": 2, "202": 2, "203": 2, "204": 2
        }
    },
    {
        name: "Kelso",
        subject: "Arte",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 1, // 🟠 Laranja
        classHours: {
            "101": 2, "102": 2, "103": 2, "104": 2,
            "201": 1, "202": 1, "203": 1, "204": 1, "301": 1, "302": 1
        }
    },
    {
        name: "Vanessa",
        subject: "Língua Inglesa",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 2, // 🟡 Âmbar
        classHours: {
            "101": 1, "102": 1, "103": 1, "104": 1,
            "201": 1, "202": 1, "203": 1, "204": 1,
            "301": 2, "302": 2
        }
    },
    {
        name: "Português 1",
        subject: "Língua Portuguesa e suas Literaturas",
        classes: ["101", "102", "103"],
        colorIdx: 3, // 🟡 Amarelo
        classHours: {
            "101": 3, "102": 3, "103": 3
        }
    },
    {
        name: "Português 2",
        subject: "Língua Portuguesa e suas Literaturas",
        classes: ["104", "203"],
        colorIdx: 4, // 🟢 Lima
        classHours: {
            "104": 3, "203": 4
        }
    },
    {
        name: "Eunice",
        subject: "Língua Portuguesa e suas Literaturas",
        classes: ["201", "202", "204"],
        colorIdx: 5, // 🟢 Verde
        classHours: {
            "201": 4, "202": 4, "204": 4
        }
    },
    {
        name: "Eliana",
        subject: "Língua Portuguesa e suas Literaturas",
        classes: ["301", "302"],
        colorIdx: 6, // 🟢 Esmeralda
        classHours: {
            "301": 4, "302": 4
        }
    },
    {
        name: "Lucidalva",
        subject: "Matemática",
        classes: ["101", "102", "103"],
        colorIdx: 7, // 🔵 Teal
        classHours: {
            "101": 3, "102": 3, "103": 3
        }
    },
    {
        name: "Luiz",
        subject: "Matemática",
        classes: ["104", "204", "301"],
        colorIdx: 8, // 🔵 Ciano
        classHours: {
            "104": 3, "204": 5, "301": 4
        }
    },
    {
        name: "Rogério",
        subject: "Matemática",
        classes: ["201", "202"],
        colorIdx: 9, // 🔵 Azul Claro
        classHours: {
            "201": 4, "202": 4
        }
    },
    {
        name: "Milton",
        subject: "Matemática",
        classes: ["203", "302"],
        colorIdx: 10, // 🔵 Azul
        classHours: {
            "203": 4, "302": 4
        }
    },
    {
        name: "Edimundo",
        subject: "Química",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 11, // 🟣 Índigo
        hoursPerClass: 2
    },
    {
        name: "Física",
        subject: "Física",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 12, // 🟣 Violeta
        hoursPerClass: 2
    },
    {
        name: "Biologia",
        subject: "Biologia",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 13, // 🟣 Roxo
        hoursPerClass: 2
    },
    {
        name: "Elenflávia",
        subject: "História",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 14, // 🩷 Fúcsia
        hoursPerClass: 2
    },
    {
        name: "Lucílio",
        subject: "Geografia",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 15, // 🩷 Pink
        hoursPerClass: 2
    },
    {
        name: "Cassiano",
        subject: "Sociologia",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 16, // 🩷 Rosa
        classHours: {
            "101": 2, "102": 2, "103": 2, "104": 2,
            "201": 1, "202": 1, "203": 1, "204": 1, "301": 1, "302": 1
        }
    },
    {
        name: "Elenilson",
        subject: "Filosofia",
        classes: ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"],
        colorIdx: 17, // 🟤 Marrom
        classHours: {
            "101": 2, "102": 2, "103": 2, "104": 2,
            "201": 1, "202": 1, "203": 1, "204": 1, "301": 1, "302": 1
        }
    },
    {
        name: "Marília",
        subject: "Técnico",
        classes: ["104", "204"],
        colorIdx: 18, // ⚫ Cinza
        classHours: {
            "104": 12, "204": 8
        }
    }
];

// Função para injetar os dados iniciais
function loadInitialTeachers() {
    if (teachers.length === 0) {
        console.log('🔄 Carregando professores iniciais (banco de dados local)...');

        // Clonar dados para evitar referência
        const initialTeachers = JSON.parse(JSON.stringify(initialTeachersData));

        // Atribuir cores específicas (colorIdx) para cada professor
        initialTeachers.forEach((teacher) => {
            // Se o professor já tem colorIdx definido, usar ele
            // Caso contrário, atribuir cor padrão
            if (teacher.colorIdx === undefined) {
                teacher.colorIdx = 0; // Cor padrão
            }
        });

        teachers.push(...initialTeachers);

        // Carregar restrições de horário
        if (typeof loadRestrictionsSetup === 'function') {
            loadRestrictionsSetup();
        }

        // Carregar itinerários formativos
        if (typeof loadSpecificSubjectsSetup === 'function') {
            loadSpecificSubjectsSetup();
        }

        // Salvar imediatamente (agora inclui as restrições e itinerários)
        saveToStorage();
        console.log(`✅ ${teachers.length} professores carregados com sucesso!`);
        console.log('🎨 Cada professor tem uma cor única para identificação visual!');

        // Se a interface já estiver carregada, atualizar
        if (typeof renderTeachersList === 'function') {
            renderTeachersList();
        }
    } else {
        console.log('ℹ️ Professores já existem no banco de dados. Pulando carga inicial.');
    }
}
