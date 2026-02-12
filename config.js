// ==================== CONFIGURAÇÕES E DADOS ====================
// config.js - Todas as configurações estáticas e estruturas de dados

// Disciplinas Regulares (Base Nacional Comum)
const regularSubjects = [
    'Língua Portuguesa e suas Literaturas',
    'Matemática',
    'História',
    'Geografia',
    'Física',
    'Química',
    'Biologia',
    'Língua Inglesa',
    'Educação Física',
    'Arte',
    'Sociologia',
    'Sociologia',
    'Filosofia',
    'Técnico'
];

const specificSubjects = [
    'Projeto de Vida',
    'Estudo Orientado - Língua Portuguesa',
    'Estudo Orientado - Matemática',
    'Eletiva',
    'PPA',
    'Educação Ambiental',
    'Práticas Experimentais',
    'Aprofundamento de Ciências da Natureza',
    'Aprofundamento de Ciências Humanas',
    'Aprofundamento de Linguagens',
    'Aprofundamento de Matemática',
    'Clubes Estudantis',
    'Tutoria',
    'Inglês 2',
    'Clube/Tutoria'
];

// Todas as disciplinas
const allSubjects = [...regularSubjects, ...specificSubjects];

// ==================== MATRIZ CURRICULAR - LIMITES SEMANAIS ====================
// Carga horária semanal máxima por disciplina e série
// Formato: { 'disciplina': { 1: horas_1ano, 2: horas_2ano, 3: horas_3ano } }
const weeklyHoursLimit = {
    // FORMAÇÃO GERAL BÁSICA (FGB)
    'Arte': { 1: 2, 2: 1, 3: 1 },
    'Educação Física': { 1: 1, 2: 2, 3: 1 },
    'Língua Inglesa': { 1: 1, 2: 1, 3: 2 },
    'Língua Portuguesa': { 1: 3, 2: 4, 3: 4 },
    'Língua Portuguesa e suas Literaturas': { 1: 3, 2: 4, 3: 4 },
    'Matemática': { 1: 3, 2: 4, 3: 4 },
    'Química': { 1: 2, 2: 2, 3: 2 },
    'Física': { 1: 2, 2: 2, 3: 2 },
    'Biologia': { 1: 2, 2: 2, 3: 2 },
    'História': { 1: 2, 2: 2, 3: 2 },
    'Geografia': { 1: 2, 2: 2, 3: 2 },
    'Sociologia': { 1: 2, 2: 1, 3: 1 },
    'Filosofia': { 1: 2, 2: 1, 3: 1 },

    // ITINERÁRIOS FORMATIVOS DE APROFUNDAMENTO (IFA)
    'Aprofundamento de Ciências da Natureza': { 1: 2, 2: 2, 3: 2 },
    'Aprofundamento de Ciências Humanas': { 1: 2, 2: 2, 3: 2 },
    'Aprofundamento de Linguagens': { 1: 2, 2: 2, 3: 2 },
    'Aprofundamento de Matemática': { 1: 2, 2: 2, 3: 2 },
    'Aprofundamento Curricular': { 1: 2, 2: 2, 3: 2 }, // Genérico
    'Eletiva': { 1: 2, 2: 2, 3: 2 },
    'Estudo Orientado - Língua Portuguesa': { 1: 3, 2: 3, 3: 3 },
    'Estudo Orientado - Matemática': { 1: 3, 2: 3, 3: 3 },
    'Estudo Orientado': { 1: 3, 2: 3, 3: 3 }, // Genérico
    'Projeto Permanente por Afinidade': { 1: 2, 2: 2, 3: 2 },
    'PPA': { 1: 2, 2: 2, 3: 2 },
    'Projeto Permanente': { 1: 2, 2: 2, 3: 2 },
    'Práticas Experimentais': { 1: 1, 2: 1, 3: 1 },
    'Projeto de Vida': { 1: 1, 2: 1, 3: 1 },
    'Educação Ambiental': { 1: 1, 2: 1, 3: 1 },
    'Técnico': { 1: 12, 2: 8, 3: 0 }
};

const classes = [
    '101', '102', '103', '104',
    '201', '202', '203', '204',
    '301', '302'
];

// Horários padrão (serão sobrescritos pelo localStorage se existir)
const defaultTimeSlots = [
    { id: '1', label: 'AULA 1', time: '7:20 - 8:10', isInterval: false },
    { id: '2', label: 'AULA 2', time: '8:10 - 9:00', isInterval: false },
    { id: 'intervalo1', label: 'INTERVALO', time: '9:00 - 9:25', isInterval: true },
    { id: '3', label: 'AULA 3', time: '9:25 - 10:15', isInterval: false },
    { id: '4', label: 'AULA 4', time: '10:15 - 11:05', isInterval: false },
    { id: '5', label: 'AULA 5', time: '11:05 - 11:45', isInterval: false },
    { id: 'almoco', label: 'ALMOÇO', time: '11:45 - 13:00', isInterval: true },
    { id: '6', label: 'AULA 6', time: '13:00 - 13:50', isInterval: false },
    { id: '7', label: 'AULA 7', time: '13:50 - 14:40', isInterval: false },
    { id: 'intervalo2', label: 'INTERVALO', time: '14:40 - 14:55', isInterval: true },
    { id: '8', label: 'AULA 8', time: '14:55 - 15:45', isInterval: false },
    { id: '9', label: 'AULA 9', time: '15:45 - 16:35', isInterval: false }
];

// Carregar timeSlots do localStorage ou usar padrão
let timeSlots = JSON.parse(localStorage.getItem('customTimeSlots')) || [...defaultTimeSlots];

// Função para salvar os horários personalizados
function saveCustomTimeSlots() {
    localStorage.setItem('customTimeSlots', JSON.stringify(timeSlots));
}

// Função para resetar horários para o padrão
function resetTimeSlots() {
    timeSlots = [...defaultTimeSlots];
    saveCustomTimeSlots();
}

const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
const dayNames = {
    'segunda': 'Segunda-feira',
    'terca': 'Terça-feira',
    'quarta': 'Quarta-feira',
    'quinta': 'Quinta-feira',
    'sexta': 'Sexta-feira'
};

// Paleta de cores para professores
const colorPalette = [
    { name: 'Vermelho Vivo', colors: ['#ef4444', '#b91c1c'] },
    { name: 'Azul Royal', colors: ['#2563eb', '#1d4ed8'] },
    { name: 'Verde Floresta', colors: ['#16a34a', '#15803d'] },
    { name: 'Laranja', colors: ['#f97316', '#c2410c'] },
    { name: 'Roxo Intenso', colors: ['#7c3aed', '#6d28d9'] },
    { name: 'Ciano Oceano', colors: ['#0891b2', '#0e7490'] },
    { name: 'Pink Forte', colors: ['#db2777', '#be185d'] },
    { name: 'Amarelo Ouro', colors: ['#ca8a04', '#a16207'] },
    { name: 'Esmeralda', colors: ['#059669', '#047857'] },
    { name: 'Índigo Noite', colors: ['#4338ca', '#3730a3'] },
    { name: 'Coral', colors: ['#f43f5e', '#e11d48'] },
    { name: 'Turquesa', colors: ['#0d9488', '#0f766e'] },
    { name: 'Fúcsia Neon', colors: ['#c026d3', '#a21caf'] },
    { name: 'Marrom Terra', colors: ['#92400e', '#78350f'] },
    { name: 'Azul Aço', colors: ['#475569', '#334155'] },
    { name: 'Lima Elétrico', colors: ['#4d7c0f', '#3f6212'] },
    { name: 'Vinho', colors: ['#9f1239', '#881337'] },
    { name: 'Azul Petróleo', colors: ['#155e75', '#164e63'] },
    { name: 'Violeta', colors: ['#7e22ce', '#6b21a8'] },
    { name: 'Grafite', colors: ['#57534e', '#44403c'] }
];

// ==================== ESTADO DA APLICAÇÃO ====================
let teachers = [];
let schedule = {};
let currentDay = 'segunda';
let teacherSpecificSubjects = {};
let teacherRestrictions = {}; // ✅ Restrições de horário dos professores

// ==================== SINCRONIZAÇÃO EM NUVEM (OPCIONAL) ====================
// Para ativar:
// 1) Crie um projeto Supabase gratuito
// 2) Preencha os campos abaixo
// 3) Defina enabled: true
const cloudSyncConfig = {
    enabled: false,
    provider: 'supabase',
    supabaseUrl: '',
    supabaseAnonKey: '',
    table: 'school_schedules',
    schoolId: 'escola_padrao',
    autoSync: true,
    syncOnLoad: true,
    debounceMs: 1200
};

// Estado do drag and drop
let draggedTeacherIdx = null;
let draggedLesson = null;
let dragSourceCell = null;
let targetCell = null;
let editingTeacherIdx = null;
