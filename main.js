// ==================== ARQUIVO PRINCIPAL ====================
// main.js - Inicialização, grade de horários, UI, relatórios e import/export

// ⚠️ NÃO REDECLARAR - Variáveis já estão no config.js:
// teachers, schedule, currentDay, days, timeSlots, classes, 
// regularSubjects, specificSubjects, allSubjects, colorPalette,
// draggedTeacherIdx, draggedLesson, dragSourceCell, targetCell, editingTeacherIdx

// ==================== ABREVIAÇÃO DE NOMES DE DISCIPLINAS ====================

function abbreviateSubject(subject) {
    const abbreviations = {
        'Língua Portuguesa e suas Literaturas': 'Português',
        'Estudo Orientado - Língua Portuguesa': 'E.O. Português',
        'Estudo Orientado - Matemática': 'E.O. Matemática',
        'Estudo Orientado': 'E.O.',
        'Aprofundamento de Linguagens': 'Aprof. Linguagens',
        'Aprofundamento de Matemática': 'Aprof. Matemática',
        'Aprofundamento de Ciências da Natureza': 'Aprof. Natureza',
        'Aprofundamento de Ciências Humanas': 'Aprof. Humanas',
        'Aprofundamento Curricular': 'Aprof. Curricular',
        'Práticas Experimentais': 'Prát. Experimentais',
        'Educação Ambiental': 'Ed. Ambiental',
        'Educação Física': 'Ed. Física',
        'Língua Inglesa': 'Inglês',
        'Projeto de Vida': 'Proj. de Vida',
        'Projeto Permanente por Afinidade': 'PPA',
        'Projeto Permanente': 'PPA',
        'Clubes Estudantis': 'Clubes',
        'Clube/Tutoria': 'Clube/Tutoria',
    };

    return abbreviations[subject] || subject;
}

// ==================== NOVOS ESTADOS PARA MODO DE VISUALIZAÇÃO ====================
let viewMode = 'general'; // 'general' ou 'class'
let currentSelectedClass = classes[0]; // Padrão: primeira turma
let cloudSyncTimer = null;
let cloudSyncPendingSnapshot = null;
let pendingTimeSlots = null; // Cópia de trabalho para o modal de configuração de horários
let cloudSyncRunning = false;

// ==================== INICIALIZAÇÃO ====================

function initSchedule() {
    console.log('🚀 Iniciando sistema...');

    // Inicializar estrutura de horários
    days.forEach(day => {
        schedule[day] = {};
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                schedule[day][slot.id] = {};
                classes.forEach(cls => {
                    schedule[day][slot.id][cls] = null;
                });
            }
        });
    });

    populateSelects();
    populateColorPicker();
    const loadedFromLocalStorage = loadFromStorage();


    migrateSpecificSubjects(); // ✅ Executar migração de dados
    renderTeachersList();
    renderSchedule();
    updateStats();
    setupEventListeners();
    initCloudSync(loadedFromLocalStorage);

    console.log('✅ Sistema inicializado!');
}

function setupEventListeners() {
    console.log('🔧 Configurando listeners...');

    try {
        document.getElementById('searchTeacher').addEventListener('input', filterTeachers);
        document.querySelector('.sidebar-controls .btn-primary').addEventListener('click', openTeacherModal);
        document.querySelector('.sidebar-controls .btn-secondary').addEventListener('click', openSpecificSubjectsModal);
        document.getElementById('btnDeleteAllTeachers').addEventListener('click', deleteAllTeachers);

        document.getElementById('btnShowReport').addEventListener('click', showReportPage);
        document.getElementById('btnExport').addEventListener('click', exportSchedule);
        document.getElementById('btnImport').addEventListener('click', importSchedule);
        document.getElementById('btnDownloadModel').addEventListener('click', downloadModelJSON);
        document.getElementById('btnDownloadExample').addEventListener('click', downloadExemploCompleto);
        const btnCloudSyncNow = document.getElementById('btnCloudSyncNow');
        if (btnCloudSyncNow) {
            btnCloudSyncNow.addEventListener('click', syncCloudNow);
        }
        document.getElementById('btnPrint').addEventListener('click', printSchedule);
        document.getElementById('btnClear').addEventListener('click', clearSchedule);
        document.getElementById('btnBackToSchedule').addEventListener('click', showSchedulePage);

        // ✅ NOVO: Botões de controle de modo de visualização
        const btnToggleView = document.getElementById('btnToggleView');
        if (btnToggleView) {
            btnToggleView.addEventListener('click', toggleViewMode);
        }

        const classSelector = document.getElementById('classSelectorDropdown');
        if (classSelector) {
            classSelector.addEventListener('change', function () {
                currentSelectedClass = this.value;
                renderSchedule();
            });
        }

        // ✅ NOVO: Botão de gerar PDF
        const btnPDF = document.getElementById('btnGeneratePDF');
        if (btnPDF) {
            btnPDF.addEventListener('click', generatePDFReport);
        }

        const btnDailyPDF = document.getElementById('btnGenerateDailyPDF');
        if (btnDailyPDF) {
            btnDailyPDF.addEventListener('click', generateDailyPDFReport);
        }

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function () {
                showDay(this.dataset.day);
            });
        });

        document.getElementById('btnSaveTeacher').addEventListener('click', saveTeacher);
        document.getElementById('specificTeacher').addEventListener('change', loadTeacherSpecificSubjects);
        document.getElementById('btnAddSpecific').addEventListener('click', addSpecificSubject);
        document.getElementById('btnSaveWorkload').addEventListener('click', saveWorkloadEdit);

        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', function () {
                closeModal(this.dataset.modal);
            });
        });

        document.getElementById('filterSubject').addEventListener('change', filterReport);
        document.getElementById('sortReport').addEventListener('change', filterReport);
        document.getElementById('fileInput').addEventListener('change', handleFileSelect);

        // ✅ NOVO: Listener para configurar horários
        const btnConfigTimeSlots = document.getElementById('btnConfigTimeSlots');
        if (btnConfigTimeSlots) {
            btnConfigTimeSlots.addEventListener('click', openTimeSlotsModal);
        }
        const btnSaveTimeSlots = document.getElementById('btnSaveTimeSlots');
        if (btnSaveTimeSlots) {
            btnSaveTimeSlots.addEventListener('click', saveTimeSlotsConfig);
        }
        const btnResetTimeSlots = document.getElementById('btnResetTimeSlots');
        if (btnResetTimeSlots) {
            btnResetTimeSlots.addEventListener('click', resetTimeSlotsConfig);
        }

        // ✅ NOVO: Listeners para modal de visualização de horário por turma
        const btnClassSchedule = document.getElementById('btnClassSchedule');
        if (btnClassSchedule) {
            btnClassSchedule.addEventListener('click', openClassScheduleModal);
        }
        const classScheduleSelect = document.getElementById('classScheduleSelect');
        if (classScheduleSelect) {
            classScheduleSelect.addEventListener('change', function () {
                const selectedClass = this.value;
                if (selectedClass) {
                    displayClassScheduleInModal(selectedClass);
                }
            });
        }
        const btnPrintClassSchedule = document.getElementById('btnPrintClassSchedule');
        if (btnPrintClassSchedule) {
            btnPrintClassSchedule.addEventListener('click', printClassSchedule);
        }

        // Listeners globais
        document.addEventListener('click', function (e) {
            const selector = document.getElementById('subjectSelector');
            if (selector && selector.classList.contains('active')) {
                if (!selector.contains(e.target) && !e.target.closest('.class-cell') && !e.target.closest('.teacher-item')) {
                    selector.classList.remove('active');
                    resetDragState();
                }
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
                const selector = document.getElementById('subjectSelector');
                if (selector) selector.classList.remove('active');
                resetDragState();
            }

            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                exportSchedule();
            }
        });

        console.log('✅ Listeners configurados!');
    } catch (error) {
        console.error('❌ Erro ao configurar listeners:', error);
    }
}

function populateSelects() {
    const select = document.getElementById('teacherSubject');
    select.innerHTML = '<option value="">Selecione a disciplina...</option>';
    regularSubjects.forEach(subj => {
        const option = document.createElement('option');
        option.value = subj;
        option.textContent = subj;
        select.appendChild(option);
    });

    const filterSelect = document.getElementById('filterSubject');
    filterSelect.innerHTML = '<option value="">Todas</option>';
    allSubjects.forEach(subj => {
        const option = document.createElement('option');
        option.value = subj;
        option.textContent = subj;
        filterSelect.appendChild(option);
    });

    const specificSelect = document.getElementById('specificSubject');
    specificSelect.innerHTML = '<option value="">Selecione...</option>';
    specificSubjects.forEach(subj => {
        const option = document.createElement('option');
        option.value = subj;
        option.textContent = subj;
        specificSelect.appendChild(option);
    });

    const classSelect = document.getElementById('specificClass');
    classSelect.innerHTML = '<option value="all">Todas as Turmas</option>';
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = `Turma ${cls}`;
        classSelect.appendChild(option);
    });

    // ✅ NOVO: Popular dropdown de seleção de turma
    const classSelectorDropdown = document.getElementById('classSelectorDropdown');
    if (classSelectorDropdown) {
        classSelectorDropdown.innerHTML = '';
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = `Turma ${cls}`;
            if (cls === currentSelectedClass) {
                option.selected = true;
            }
            classSelectorDropdown.appendChild(option);
        });
    }
}

function populateColorPicker() {
    const container = document.getElementById('colorPicker');
    let html = '';

    colorPalette.forEach((color, idx) => {
        html += `
            <div class="color-option" 
                 style="width: 35px; height: 35px; border-radius: 50%; 
                 background: linear-gradient(135deg, ${color.colors[0]} 0%, ${color.colors[1]} 100%);
                 cursor: pointer; border: 3px solid transparent; transition: all 0.2s;"
                 data-color-idx="${idx}"
                 title="${color.name}">
            </div>
        `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.color-option').forEach(el => {
        el.addEventListener('click', function () {
            selectColor(parseInt(this.dataset.colorIdx));
        });
    });
}

function selectColor(idx) {
    document.querySelectorAll('.color-option').forEach(el => {
        el.style.border = '3px solid transparent';
        el.style.transform = 'scale(1)';
    });

    const selected = document.querySelector(`[data-color-idx="${idx}"]`);
    if (selected) {
        selected.style.border = '3px solid #000';
        selected.style.transform = 'scale(1.1)';
    }

    document.getElementById('selectedColor').value = idx;
}

// ==================== RENDERIZAÇÃO DA GRADE ====================

// ==================== FUNÇÕES DE ALTERNÂNCIA DE MODO ====================

function toggleViewMode() {
    console.log('🔄 toggleViewMode clicado! Modo anterior:', viewMode);
    viewMode = viewMode === 'general' ? 'class' : 'general';
    console.log('➡️ Novo modo:', viewMode);
    updateViewModeUI();
    renderSchedule();
}

function updateViewModeUI() {
    const btnToggle = document.getElementById('btnToggleView');
    const classSelector = document.getElementById('classSelector');
    const dayTabs = document.querySelector('.tabs');

    if (viewMode === 'class') {
        btnToggle.innerHTML = '🏫 Modo: Por Turma';
        btnToggle.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btnToggle.style.color = 'white';

        if (classSelector) classSelector.style.display = 'flex';
        if (dayTabs) dayTabs.style.display = 'none';
    } else {
        btnToggle.innerHTML = '📅 Modo: Geral';
        btnToggle.style.background = '#e0e7ff';
        btnToggle.style.color = '#4338ca';

        if (classSelector) classSelector.style.display = 'none';
        if (dayTabs) dayTabs.style.display = 'flex';
    }
}

// ==================== RENDERIZAÇÃO DA GRADE (WRAPPER) ====================

function renderSchedule() {
    console.log('🎨 renderSchedule chamado. viewMode:', viewMode);
    if (viewMode === 'general') {
        renderGeneralSchedule();
    } else {
        renderClassSchedule();
    }
}

function generateClassScheduleTableHTML(cls) {
    let html = '<table class="schedule-table"><thead><tr>';
    html += '<th style="min-width: 100px;">HORÁRIO</th>';

    // Headers are Days
    if (!dayNames) {
        throw new Error('dayNames is undefined');
    }

    days.forEach(day => {
        html += `<th>${dayNames[day]}</th>`;
    });
    html += '</tr></thead><tbody>';

    const teacherLessonsCount = {};

    timeSlots.forEach(slot => {
        html += `<tr class="${slot.isInterval ? 'interval-row' : ''}">`;
        html += `<td class="time-cell ${slot.isInterval ? 'interval-cell' : ''}">
                <strong>${slot.label}</strong><br>
                <small>${slot.time}</small>
            </td>`;

        if (slot.isInterval) {
            html += `<td colspan="${days.length}" class="interval-cell">
                    ${slot.label === 'ALMOÇO' ? '🍽️' : '☕'} ${slot.label}
                </td>`;
        } else {
            days.forEach(day => {
                const lesson = schedule[day]?.[slot.id]?.[cls];
                const cellId = `cell-${day}-${slot.id}-${cls}`;

                html += `<td class="class-cell" 
                                 id="${cellId}"
                                 data-day="${day}" 
                                 data-time="${slot.id}" 
                                 data-class="${cls}">`;

                if (lesson) {
                    const teacherName = lesson.teacher;
                    if (!teacherLessonsCount[teacherName]) {
                        teacherLessonsCount[teacherName] = 0;
                    }
                    teacherLessonsCount[teacherName]++;

                    const conflict = checkConflict(day, slot.id, lesson.teacherIdx, cls);
                    const teacher = teachers[lesson.teacherIdx];
                    const colors = teacher ? getTeacherColor(teacher) : ['#667eea', '#764ba2'];

                    const isClubeTutoria = lesson.subject === 'Clube/Tutoria';
                    const cardStyle = isClubeTutoria
                        ? 'background: #f8f9fa; border: 2px dashed #cbd5e1;'
                        : `background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);`;
                    const textClass = isClubeTutoria ? 'clube-tutoria' : '';

                    html += `
                            <div class="lesson-card ${conflict ? 'conflict' : ''} ${textClass}" 
                                 style="${cardStyle}"
                                 draggable="true"
                                 data-day="${day}"
                                 data-time="${slot.id}"
                                 data-class="${cls}">
                                <div class="teacher-name-main">${isClubeTutoria ? 'Clubes' : lesson.teacher}</div>
                                <div class="subject-name-sub">${abbreviateSubject(lesson.subject)}</div>
                                <button class="remove-btn" data-remove-lesson="${day}-${slot.id}-${cls}">×</button>
                            </div>`;
                }
                html += '</td>';
            });
        }
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

function renderClassSchedule() {
    try {
        const container = document.getElementById('schedule-content');
        if (!container) {
            return;
        }

        let html = generateClassScheduleTableHTML(currentSelectedClass);

        html += renderClassWorkloadReport(currentSelectedClass);

        container.innerHTML = html;

        setupCellEventListeners();
        updateStats();

        // ✅ NOVO: Renderizar cadeados
        if (typeof renderLockButtons === 'function') {
            renderLockButtons();
        }

    } catch (error) {
        console.error('Erro ao renderizar horário por turma:', error);
        alert('Erro ao renderizar horário por turma: ' + error.message);
    }
}

function renderWeeklyTeacherSummary(teacherLessonsCount) {
    const sortedTeachers = Object.entries(teacherLessonsCount)
        .sort((a, b) => b[1] - a[1]);

    if (sortedTeachers.length === 0) {
        return '';
    }

    const totalAulas = Object.values(teacherLessonsCount).reduce((a, b) => a + b, 0);

    let html = `
        <div class="daily-teacher-summary" style="margin-top: 30px; padding: 25px; background: linear-gradient(135deg, #f8f9fc 0%, #e9ecf5 100%); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.8);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <h3 style="margin: 0; color: #333; font-size: 18px; display: flex; align-items: center; gap: 12px;">
                    <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 18px; border-radius: 25px; font-size: 14px; font-weight: 600; box-shadow: 0 3px 10px rgba(102,126,234,0.3);">
                        📊 Resumo Semanal: Turma ${currentSelectedClass}
                    </span>
                </h3>
                 <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="font-size: 14px; color: #666; background: white; padding: 8px 15px; border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        👥 <strong>${sortedTeachers.length}</strong> professores
                    </span>
                    <span style="font-size: 14px; color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 8px 15px; border-radius: 20px; font-weight: 600; box-shadow: 0 3px 10px rgba(102,126,234,0.3);">
                        📚 Total: <strong>${totalAulas}</strong> aulas
                    </span>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">`;

    sortedTeachers.forEach(([teacherName, count]) => {
        const teacherIdx = teachers.findIndex(t => t.name === teacherName);
        const teacher = teacherIdx >= 0 ? teachers[teacherIdx] : null;
        const colors = teacher ? getTeacherColor(teacher) : ['#667eea', '#764ba2'];
        const displayName = teacherName.length > 18 ? teacherName.substring(0, 16) + '...' : teacherName;
        const displaySubject = teacher && teacher.subject ?
            (teacher.subject.length > 20 ? teacher.subject.substring(0, 18) + '...' : teacher.subject) : '';

        html += `
            <div style="display: flex; align-items: center; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s;" 
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)';" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.06)';">
                <div style="width: 6px; height: 45px; background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%); border-radius: 3px; margin-right: 12px; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <div style="font-weight: 600; color: #333; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${teacherName}">${displayName}</div>
                    <div style="color: #888; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${teacher ? teacher.subject : ''}">${displaySubject}</div>
                </div>
                <div style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%); color: white; min-width: 42px; height: 42px; border-radius: 10px; font-weight: bold; font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                    ${count}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    return html;
}

// ==================== RELATÓRIO DE LOTAÇÃO POR TURMA ====================

function renderClassWorkloadReport(cls) {
    const year = parseInt(cls[0]);

    // ==================== MATRIZ COMPLETA DE DISCIPLINAS ====================
    // FGB - 12 disciplinas (carga varia por ano)
    const fgbMatrix = [
        { subject: 'Língua Portuguesa e suas Literaturas', hours: { 1: 3, 2: 4, 3: 4 } },
        { subject: 'Matemática', hours: { 1: 3, 2: 4, 3: 4 } },
        { subject: 'Química', hours: { 1: 2, 2: 2, 3: 2 } },
        { subject: 'Física', hours: { 1: 2, 2: 2, 3: 2 } },
        { subject: 'Biologia', hours: { 1: 2, 2: 2, 3: 2 } },
        { subject: 'História', hours: { 1: 2, 2: 2, 3: 2 } },
        { subject: 'Geografia', hours: { 1: 2, 2: 2, 3: 2 } },
        { subject: 'Língua Inglesa', hours: { 1: 1, 2: 1, 3: 2 } },
        { subject: 'Educação Física', hours: { 1: 1, 2: 2, 3: 1 } },
        { subject: 'Arte', hours: { 1: 2, 2: 1, 3: 1 } },
        { subject: 'Sociologia', hours: { 1: 2, 2: 1, 3: 1 } },
        { subject: 'Filosofia', hours: { 1: 2, 2: 1, 3: 1 } }
    ];

    const itineraryMatrix = [
        { subject: 'Projeto de Vida', hours: 1 },
        { subject: 'Aprofundamento de Linguagens', hours: 2 },
        { subject: 'Aprofundamento de Matemática', hours: 2 },
        { subject: 'Aprofundamento de Ciências da Natureza', hours: 2 },
        { subject: 'Aprofundamento de Ciências Humanas', hours: 2 },
        { subject: 'Estudo Orientado - Língua Portuguesa', hours: 3 },
        { subject: 'Estudo Orientado - Matemática', hours: 3 },
        { subject: 'Práticas Experimentais', hours: 1 },
        { subject: 'Educação Ambiental', hours: 1 },
        { subject: 'Eletiva', hours: 2 },
        { subject: 'PPA', hours: 2 },
        { subject: 'Clube/Tutoria', hours: 1 }
    ];

    // ==================== BUSCAR DADOS DE CADA DISCIPLINA FGB ====================
    const fgbData = [];
    let totalFgbExpected = 0;
    let totalFgbRegistered = 0;
    let fgbMissingCount = 0;
    let fgbCompleteCount = 0;

    fgbMatrix.forEach(item => {
        const expectedHours = item.hours[year] || 0;
        totalFgbExpected += expectedHours;

        // Buscar professor cadastrado para esta disciplina nesta turma
        let registeredTeacher = null;
        let registeredHours = 0;
        let teacherIdx = -1;

        teachers.forEach((teacher, idx) => {
            if (teacher.subject === item.subject) {
                const teacherClasses = teacher.classes || [];
                if (teacherClasses.includes(cls)) {
                    registeredTeacher = teacher.name;
                    teacherIdx = idx;
                    if (teacher.classHours && teacher.classHours[cls] !== undefined) {
                        registeredHours = teacher.classHours[cls];
                    } else if (teacher.hoursPerClass) {
                        registeredHours = teacher.hoursPerClass;
                    } else {
                        registeredHours = expectedHours;
                    }
                }
            }
        });

        totalFgbRegistered += registeredHours;

        // Contar aulas já na grade
        let gradeLessons = 0;
        days.forEach(day => {
            timeSlots.forEach(slot => {
                if (!slot.isInterval) {
                    const lesson = schedule[day] && schedule[day][slot.id] && schedule[day][slot.id][cls];
                    if (lesson && lesson.subject === item.subject) {
                        gradeLessons++;
                    }
                }
            });
        });

        let status;
        if (!registeredTeacher) {
            status = 'missing';
            fgbMissingCount++;
        } else if (registeredHours < expectedHours) {
            status = 'partial';
        } else {
            status = 'complete';
            fgbCompleteCount++;
        }

        fgbData.push({
            subject: item.subject,
            expectedHours: expectedHours,
            registeredTeacher: registeredTeacher,
            registeredHours: registeredHours,
            gradeLessons: gradeLessons,
            teacherIdx: teacherIdx,
            status: status
        });
    });

    // ==================== BUSCAR DADOS DE CADA ITINERÁRIO ====================
    const itineraryData = [];
    let totalItExpected = 0;
    let totalItRegistered = 0;
    let itMissingCount = 0;
    let itCompleteCount = 0;

    itineraryMatrix.forEach(item => {
        const expectedHours = item.hours;
        totalItExpected += expectedHours;

        // Buscar professor cadastrado para este itinerário nesta turma
        let registeredTeacher = null;
        let registeredHours = 0;
        let foundTeacherIdx = -1;

        // Procurar em todos os professores nos itinerários
        teachers.forEach((teacher, idx) => {
            const specificList = teacherSpecificSubjects[idx] || [];
            specificList.forEach(specific => {
                if (specific.subject === item.subject && (specific.class === cls || specific.class === 'all')) {
                    registeredTeacher = teacher.name;
                    registeredHours = specific.hoursPerWeek || 1;
                    foundTeacherIdx = idx;
                }
            });
        });

        totalItRegistered += registeredHours;

        // Contar aulas já na grade
        let gradeLessons = 0;
        days.forEach(day => {
            timeSlots.forEach(slot => {
                if (!slot.isInterval) {
                    const lesson = schedule[day] && schedule[day][slot.id] && schedule[day][slot.id][cls];
                    if (lesson && lesson.subject === item.subject) {
                        gradeLessons++;
                    }
                }
            });
        });

        let status;
        if (!registeredTeacher) {
            status = 'missing';
            itMissingCount++;
        } else if (registeredHours < expectedHours) {
            status = 'partial';
        } else {
            status = 'complete';
            itCompleteCount++;
        }

        itineraryData.push({
            subject: item.subject,
            expectedHours: expectedHours,
            registeredTeacher: registeredTeacher,
            registeredHours: registeredHours,
            gradeLessons: gradeLessons,
            teacherIdx: foundTeacherIdx,
            status: status
        });
    });

    // ==================== TOTAIS GERAIS ====================
    const totalExpected = totalFgbExpected + totalItExpected;
    const totalRegistered = totalFgbRegistered + totalItRegistered;
    const totalMissing = fgbMissingCount + itMissingCount;

    // Contar total de aulas na grade
    let totalGradeLessons = 0;
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                const lesson = schedule[day] && schedule[day][slot.id] && schedule[day][slot.id][cls];
                if (lesson) totalGradeLessons++;
            }
        });
    });

    const slotsPerDay = timeSlots.filter(s => !s.isInterval).length;
    const totalSlots = slotsPerDay * days.length;
    const percentComplete = totalExpected > 0 ? Math.round((totalRegistered / totalExpected) * 100) : 0;

    // ==================== RENDERIZAR HTML ====================
    let html = `
        <div style="margin-top: 30px; padding: 0;">

            <!-- CABEÇALHO -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 25px; border-radius: 16px 16px 0 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h3 style="margin: 0 0 5px 0; font-size: 20px; color: white;">
                            📋 Lotação da Turma ${cls} (${year}º Ano)
                        </h3>
                        <p style="margin: 0; opacity: 0.9; font-size: 13px; color: white;">
                            Todas as disciplinas obrigatórias — Meta: <strong>45 aulas semanais</strong>
                        </p>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <div style="background: rgba(255,255,255,0.2); padding: 10px 18px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: white;">${totalExpected}</div>
                            <div style="font-size: 10px; color: white; opacity: 0.9;">Esperadas</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 10px 18px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: white;">${totalRegistered}</div>
                            <div style="font-size: 10px; color: white; opacity: 0.9;">Cadastradas</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 10px 18px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: white;">${totalGradeLessons}</div>
                            <div style="font-size: 10px; color: white; opacity: 0.9;">Na Grade</div>
                        </div>
                        <div style="background: ${totalMissing === 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}; padding: 10px 18px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: white;">${totalMissing}</div>
                            <div style="font-size: 10px; color: white; opacity: 0.9;">Sem Professor</div>
                        </div>
                    </div>
                </div>

                <!-- Barra de progresso geral -->
                <div style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; opacity: 0.9; margin-bottom: 4px; color: white;">
                        <span>Progresso de cadastro</span>
                        <span>${totalRegistered}/${totalExpected} aulas (${percentComplete}%)</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); border-radius: 8px; height: 10px; overflow: hidden;">
                        <div style="background: ${percentComplete === 100 ? '#22c55e' : 'rgba(255,255,255,0.8)'}; height: 100%; width: ${percentComplete}%; border-radius: 8px; transition: width 0.5s;"></div>
                    </div>
                </div>
            </div>

            <!-- INDICADORES RÁPIDOS -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border-bottom: 2px solid #e5e7eb;">
                <div style="padding: 12px; text-align: center; background: #f0fdf4; border-right: 1px solid #e5e7eb;">
                    <div style="font-size: 20px; font-weight: bold; color: #22c55e;">${fgbCompleteCount}</div>
                    <div style="font-size: 10px; color: #666;">✅ FGB OK</div>
                </div>
                <div style="padding: 12px; text-align: center; background: ${fgbMissingCount > 0 ? '#fef2f2' : '#f0fdf4'}; border-right: 1px solid #e5e7eb;">
                    <div style="font-size: 20px; font-weight: bold; color: ${fgbMissingCount > 0 ? '#ef4444' : '#22c55e'};">${fgbMissingCount}</div>
                    <div style="font-size: 10px; color: #666;">${fgbMissingCount > 0 ? '❌' : '✅'} FGB Faltando</div>
                </div>
                <div style="padding: 12px; text-align: center; background: #f0fdf4; border-right: 1px solid #e5e7eb;">
                    <div style="font-size: 20px; font-weight: bold; color: #22c55e;">${itCompleteCount}</div>
                    <div style="font-size: 10px; color: #666;">✅ Itinerários OK</div>
                </div>
                <div style="padding: 12px; text-align: center; background: ${itMissingCount > 0 ? '#fef2f2' : '#f0fdf4'}; border-right: 1px solid #e5e7eb;">
                    <div style="font-size: 20px; font-weight: bold; color: ${itMissingCount > 0 ? '#ef4444' : '#22c55e'};">${itMissingCount}</div>
                    <div style="font-size: 10px; color: #666;">${itMissingCount > 0 ? '❌' : '✅'} Itin. Faltando</div>
                </div>
                <div style="padding: 12px; text-align: center; background: #f0f9ff;">
                    <div style="font-size: 20px; font-weight: bold; color: #667eea;">22</div>
                    <div style="font-size: 10px; color: #666;">📚 Total Disciplinas</div>
                </div>
            </div>
    `;

    // ==================== TABELA FGB ====================
    html += `
            <div style="background: white; overflow: hidden;">
                <div style="padding: 15px 20px; background: #f8f9fc; border-bottom: 2px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; color: #333; font-size: 15px;">
                            📚 Formação Geral Básica (FGB) — ${fgbMatrix.length} disciplinas
                        </h4>
                        <span style="background: ${fgbMissingCount === 0 ? '#dcfce7' : '#fef2f2'}; color: ${fgbMissingCount === 0 ? '#166534' : '#991b1b'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${totalFgbRegistered}/${totalFgbExpected} aulas
                        </span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 10px 15px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Disciplina</th>
                            <th style="padding: 10px 15px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Professor</th>
                            <th style="padding: 10px 15px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Esperado</th>
                            <th style="padding: 10px 15px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Cadastrado</th>
                            <th style="padding: 10px 15px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Na Grade</th>
                            <th style="padding: 10px 15px; text-align: center; font-size: 12px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    fgbData.forEach((item, idx) => {
        const rowBg = item.status === 'missing' ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#fafbfc');

        let statusIcon, statusColor, statusText, statusBg;
        if (item.status === 'complete') {
            statusIcon = '✅'; statusColor = '#22c55e'; statusText = 'OK'; statusBg = '#f0fdf4';
        } else if (item.status === 'partial') {
            statusIcon = '⚠️'; statusColor = '#f59e0b'; statusText = 'Parcial'; statusBg = '#fef3c7';
        } else {
            statusIcon = '❌'; statusColor = '#ef4444'; statusText = 'SEM PROFESSOR'; statusBg = '#fef2f2';
        }

        let teacherColor = '#ccc';
        if (item.teacherIdx >= 0) {
            const colors = getTeacherColor(teachers[item.teacherIdx]);
            teacherColor = colors[0];
        }

        const gradeProgress = item.registeredHours > 0
            ? Math.min(Math.round((item.gradeLessons / item.registeredHours) * 100), 100) : 0;

        html += `
            <tr style="background: ${rowBg}; border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 15px;">
                    <span style="font-weight: 600; color: #333; font-size: 13px;">${item.subject}</span>
                </td>
                <td style="padding: 12px 15px;">
                    ${item.registeredTeacher ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${teacherColor}; flex-shrink: 0;"></div>
                            <span style="font-size: 13px; color: #333; font-weight: 500;">${item.registeredTeacher}</span>
                        </div>
                    ` : `
                        <span style="color: #ef4444; font-weight: 600; font-size: 12px;">⚠️ Nenhum professor cadastrado</span>
                    `}
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <span style="font-weight: 600; color: #64748b; font-size: 14px;">${item.expectedHours}h</span>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <span style="font-weight: 700; color: ${item.registeredHours >= item.expectedHours ? '#22c55e' : (item.registeredHours > 0 ? '#f59e0b' : '#ef4444')}; font-size: 14px;">
                        ${item.registeredHours}h
                    </span>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <div style="display: flex; align-items: center; gap: 6px; justify-content: center;">
                        <span style="font-size: 12px; font-weight: 600; color: ${item.gradeLessons >= item.registeredHours && item.registeredHours > 0 ? '#22c55e' : '#64748b'};">
                            ${item.gradeLessons}/${item.registeredHours}
                        </span>
                        <div style="width: 35px; height: 5px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${gradeProgress}%; height: 100%; background: ${item.gradeLessons >= item.registeredHours && item.registeredHours > 0 ? '#22c55e' : '#667eea'}; border-radius: 3px;"></div>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap;">
                        ${statusIcon} ${statusText}
                    </span>
                </td>
            </tr>
        `;
    });

    // Total FGB
    html += `
                    <tr style="background: #f1f5f9; font-weight: 700; border-top: 2px solid #e2e8f0;">
                        <td style="padding: 12px 15px; font-size: 13px; color: #333;">TOTAL FGB</td>
                        <td style="padding: 12px 15px; font-size: 12px; color: #666;">${fgbData.filter(d => d.registeredTeacher).length} de ${fgbMatrix.length} professores</td>
                        <td style="padding: 12px 15px; text-align: center; font-size: 14px; color: #333;">${totalFgbExpected}h</td>
                        <td style="padding: 12px 15px; text-align: center; font-size: 14px; color: ${totalFgbRegistered >= totalFgbExpected ? '#22c55e' : '#ef4444'};">${totalFgbRegistered}h</td>
                        <td style="padding: 12px 15px; text-align: center; font-size: 12px; color: #666;">
                            ${fgbData.reduce((sum, d) => sum + d.gradeLessons, 0)}/${totalFgbRegistered}
                        </td>
                        <td style="padding: 12px 15px; text-align: center;">
                            ${fgbMissingCount === 0 ?
            '<span style="color: #22c55e; font-weight: 700; font-size: 12px;">✅ Completo</span>' :
            `<span style="color: #ef4444; font-weight: 700; font-size: 12px;">❌ ${fgbMissingCount} faltando</span>`
        }
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // ==================== TABELA ITINERÁRIOS ====================
    html += `
            <div style="background: white; overflow: hidden; border-top: 3px solid #f59e0b;">
                <div style="padding: 15px 20px; background: #fffbeb; border-bottom: 2px solid #fde68a;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; color: #92400e; font-size: 15px;">
                            🎯 Itinerários Formativos — ${itineraryMatrix.length} disciplinas
                        </h4>
                        <span style="background: ${itMissingCount === 0 ? '#dcfce7' : '#fef2f2'}; color: ${itMissingCount === 0 ? '#166534' : '#991b1b'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${totalItRegistered}/${totalItExpected} aulas
                        </span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #fffbeb;">
                            <th style="padding: 10px 15px; text-align: left; font-size: 12px; color: #92400e; font-weight: 600; border-bottom: 1px solid #fde68a;">Itinerário</th>
                            <th style="padding: 10px 15px; text-align: left; font-size: 12px; color: #92400e; font-weight: 600; border-bottom: 1px solid #fde68a;">Professor</th>
                            <th style="padding: 10px 15px; text-align: center; font-size: 12px; color: #92400e; font-weight: 600; border-bottom: 1px solid #fde68a;">Esperado</th>
                            <th style="padding: 10px 15px; text-align: center; font-size: 12px; color: #92400e; font-weight: 600; border-bottom: 1px solid #fde68a;">Cadastrado</th>
                            <th style="padding: 10px 15px; text-align: center; font-size: 12px; color: #92400e; font-weight: 600; border-bottom: 1px solid #fde68a;">Na Grade</th>
                            <th style="padding: 10px 15px; text-align: center; font-size: 12px; color: #92400e; font-weight: 600; border-bottom: 1px solid #fde68a;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    itineraryData.forEach((item, idx) => {
        const rowBg = item.status === 'missing' ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#fffdf7');

        let statusIcon, statusColor, statusText, statusBg;
        if (item.status === 'complete') {
            statusIcon = '✅'; statusColor = '#22c55e'; statusText = 'OK'; statusBg = '#f0fdf4';
        } else if (item.status === 'partial') {
            statusIcon = '⚠️'; statusColor = '#f59e0b'; statusText = 'Parcial'; statusBg = '#fef3c7';
        } else {
            statusIcon = '❌'; statusColor = '#ef4444'; statusText = 'SEM PROFESSOR'; statusBg = '#fef2f2';
        }

        let teacherColor = '#ccc';
        if (item.teacherIdx >= 0) {
            const colors = getTeacherColor(teachers[item.teacherIdx]);
            teacherColor = colors[0];
        }

        const gradeProgress = item.registeredHours > 0
            ? Math.min(Math.round((item.gradeLessons / item.registeredHours) * 100), 100) : 0;

        html += `
            <tr style="background: ${rowBg}; border-bottom: 1px solid #f5f0e0;">
                <td style="padding: 12px 15px;">
                    <span style="font-weight: 600; color: #333; font-size: 13px;">${item.subject}</span>
                </td>
                <td style="padding: 12px 15px;">
                    ${item.registeredTeacher ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${teacherColor}; flex-shrink: 0;"></div>
                            <span style="font-size: 13px; color: #333; font-weight: 500;">${item.registeredTeacher}</span>
                        </div>
                    ` : `
                        <span style="color: #ef4444; font-weight: 600; font-size: 12px;">⚠️ Nenhum professor cadastrado</span>
                    `}
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <span style="font-weight: 600; color: #92400e; font-size: 14px;">${item.expectedHours}h</span>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <span style="font-weight: 700; color: ${item.registeredHours >= item.expectedHours ? '#22c55e' : (item.registeredHours > 0 ? '#f59e0b' : '#ef4444')}; font-size: 14px;">
                        ${item.registeredHours}h
                    </span>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <div style="display: flex; align-items: center; gap: 6px; justify-content: center;">
                        <span style="font-size: 12px; font-weight: 600; color: ${item.gradeLessons >= item.registeredHours && item.registeredHours > 0 ? '#22c55e' : '#64748b'};">
                            ${item.gradeLessons}/${item.registeredHours}
                        </span>
                        <div style="width: 35px; height: 5px; background: #fde68a; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${gradeProgress}%; height: 100%; background: ${item.gradeLessons >= item.registeredHours && item.registeredHours > 0 ? '#22c55e' : '#f59e0b'}; border-radius: 3px;"></div>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap;">
                        ${statusIcon} ${statusText}
                    </span>
                </td>
            </tr>
        `;
    });

    // Total Itinerários
    html += `
                    <tr style="background: #fffbeb; font-weight: 700; border-top: 2px solid #fde68a;">
                        <td style="padding: 12px 15px; font-size: 13px; color: #92400e;">TOTAL ITINERÁRIOS</td>
                        <td style="padding: 12px 15px; font-size: 12px; color: #666;">${itineraryData.filter(d => d.registeredTeacher).length} de ${itineraryMatrix.length} professores</td>
                        <td style="padding: 12px 15px; text-align: center; font-size: 14px; color: #92400e;">${totalItExpected}h</td>
                        <td style="padding: 12px 15px; text-align: center; font-size: 14px; color: ${totalItRegistered >= totalItExpected ? '#22c55e' : '#ef4444'};">${totalItRegistered}h</td>
                        <td style="padding: 12px 15px; text-align: center; font-size: 12px; color: #666;">
                            ${itineraryData.reduce((sum, d) => sum + d.gradeLessons, 0)}/${totalItRegistered}
                        </td>
                        <td style="padding: 12px 15px; text-align: center;">
                            ${itMissingCount === 0 ?
            '<span style="color: #22c55e; font-weight: 700; font-size: 12px;">✅ Completo</span>' :
            `<span style="color: #ef4444; font-weight: 700; font-size: 12px;">❌ ${itMissingCount} faltando</span>`
        }
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // ==================== RODAPÉ - RESUMO GERAL ====================
    html += `
            <div style="background: linear-gradient(135deg, ${totalMissing === 0 ? '#22c55e' : '#ef4444'} 0%, ${totalMissing === 0 ? '#16a34a' : '#dc2626'} 100%);
                        color: white; padding: 20px; border-radius: 0 0 16px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <div style="font-size: 18px; font-weight: 700; color: white;">
                            ${totalMissing === 0 ? '✅ Turma com lotação COMPLETA!' : `⚠️ ${totalMissing} disciplina(s) sem professor cadastrado`}
                        </div>
                        <div style="font-size: 13px; opacity: 0.9; margin-top: 4px; color: white;">
                            FGB: ${totalFgbRegistered}/${totalFgbExpected}h | Itinerários: ${totalItRegistered}/${totalItExpected}h | Grade: ${totalGradeLessons}/${totalSlots} slots
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <div style="background: rgba(255,255,255,0.25); padding: 12px 20px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 30px; font-weight: bold; color: white;">${totalRegistered}</div>
                            <div style="font-size: 10px; color: white; opacity: 0.9;">CADASTRADAS</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.15); padding: 12px 20px; border-radius: 10px; text-align: center; font-size: 30px; color: white; font-weight: bold; display: flex; align-items: center;">
                            /
                        </div>
                        <div style="background: rgba(255,255,255,0.25); padding: 12px 20px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 30px; font-weight: bold; color: white;">${totalExpected}</div>
                            <div style="font-size: 10px; color: white; opacity: 0.9;">META (45h)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return html;
}
function getGeneralScheduleHTML(targetDay) {
    let html = '<table class="schedule-table"><thead><tr>';
    html += '<th style="min-width: 100px;">HORÁRIO</th>';

    classes.forEach(cls => {
        const year = cls[0];
        html += `<th>${year}º ANO - ${cls}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Contador de aulas por professor no dia
    const teacherLessonsCount = {};

    timeSlots.forEach(slot => {
        html += `<tr class="${slot.isInterval ? 'interval-row' : ''}">`;
        html += `<td class="time-cell ${slot.isInterval ? 'interval-cell' : ''}">
            <strong>${slot.label}</strong><br>
            <small>${slot.time}</small>
        </td>`;

        if (slot.isInterval) {
            html += `<td colspan="${classes.length}" class="interval-cell">
                ${slot.label === 'ALMOÇO' ? '🍽️' : '☕'} ${slot.label}
            </td>`;
        } else {
            classes.forEach(cls => {
                const lesson = schedule[targetDay]?.[slot.id]?.[cls];
                const cellId = `cell-${targetDay}-${slot.id}-${cls}`;

                html += `<td class="class-cell" 
                             id="${cellId}"
                             data-day="${targetDay}" 
                             data-time="${slot.id}" 
                             data-class="${cls}">`;

                if (lesson) {
                    // Contar aulas do professor
                    const teacherName = lesson.teacher;
                    if (!teacherLessonsCount[teacherName]) {
                        teacherLessonsCount[teacherName] = 0;
                    }
                    teacherLessonsCount[teacherName]++;

                    const conflict = checkConflict(targetDay, slot.id, lesson.teacherIdx, cls);
                    const teacher = teachers[lesson.teacherIdx];
                    const colors = teacher ? getTeacherColor(teacher) : ['#667eea', '#764ba2'];

                    const isClubeTutoria = lesson.subject === 'Clube/Tutoria';
                    const cardStyle = isClubeTutoria
                        ? 'background: #f8f9fa; border: 2px dashed #cbd5e1;'
                        : `background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);`;
                    const textClass = isClubeTutoria ? 'clube-tutoria' : '';

                    html += `
                        <div class="lesson-card ${conflict ? 'conflict' : ''} ${textClass}" 
                             style="${cardStyle}"
                             draggable="true"
                             data-day="${targetDay}"
                             data-time="${slot.id}"
                             data-class="${cls}">
                            <div class="teacher-name-main">${isClubeTutoria ? 'Clubes' : lesson.teacher}</div>
                            <div class="subject-name-sub">${abbreviateSubject(lesson.subject)}</div>
                            <button class="remove-btn" data-remove-lesson="${targetDay}-${slot.id}-${cls}">×</button>
                        </div>`;
                }
                html += '</td>';
            });
        }
        html += '</tr>';
    });

    html += '</tbody></table>';

    // Adicionar resumo de aulas por professor no dia
    html += renderDailyTeacherSummary(teacherLessonsCount, targetDay);

    return html;
}

function renderGeneralSchedule() {
    const container = document.getElementById('schedule-content');
    container.innerHTML = getGeneralScheduleHTML(currentDay);

    setupCellEventListeners();
    updateStats();

    // ✅ NOVO: Renderizar cadeados
    if (typeof renderLockButtons === 'function') {
        renderLockButtons();
    }
}

// Função para renderizar o resumo de aulas por professor no dia
function renderDailyTeacherSummary(teacherLessonsCount, targetDay) {
    const dayNames = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira'
    };

    // Ordenar professores por número de aulas (decrescente)
    const sortedTeachers = Object.entries(teacherLessonsCount)
        .sort((a, b) => b[1] - a[1]);

    if (sortedTeachers.length === 0) {
        return '';
    }

    const totalAulas = Object.values(teacherLessonsCount).reduce((a, b) => a + b, 0);

    let html = `
        <div class="daily-teacher-summary" style="margin-top: 30px; padding: 25px; background: linear-gradient(135deg, #f8f9fc 0%, #e9ecf5 100%); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.8);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                <h3 style="margin: 0; color: #333; font-size: 18px; display: flex; align-items: center; gap: 12px;">
                    <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 18px; border-radius: 25px; font-size: 14px; font-weight: 600; box-shadow: 0 3px 10px rgba(102,126,234,0.3);">
                        📊 Resumo do Dia: ${dayNames[targetDay] || targetDay}
                    </span>
                </h3>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="font-size: 14px; color: #666; background: white; padding: 8px 15px; border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        👥 <strong>${sortedTeachers.length}</strong> professores
                    </span>
                    <span style="font-size: 14px; color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 8px 15px; border-radius: 20px; font-weight: 600; box-shadow: 0 3px 10px rgba(102,126,234,0.3);">
                        📚 Total: <strong>${totalAulas}</strong> aulas
                    </span>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
    `;

    sortedTeachers.forEach(([teacherName, count]) => {
        // Encontrar o professor para pegar a cor
        const teacherIdx = teachers.findIndex(t => t.name === teacherName);
        const teacher = teacherIdx >= 0 ? teachers[teacherIdx] : null;
        const colors = teacher ? getTeacherColor(teacher) : ['#667eea', '#764ba2'];

        // Truncar nome longo
        const displayName = teacherName.length > 18 ? teacherName.substring(0, 16) + '...' : teacherName;
        const displaySubject = teacher && teacher.subject ?
            (teacher.subject.length > 20 ? teacher.subject.substring(0, 18) + '...' : teacher.subject) : '';

        html += `
            <div style="display: flex; align-items: center; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s;" 
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)';" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.06)';">
                <div style="width: 6px; height: 45px; background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%); border-radius: 3px; margin-right: 12px; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <div style="font-weight: 600; color: #333; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${teacherName}">${displayName}</div>
                    <div style="color: #888; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${teacher ? teacher.subject : ''}">${displaySubject}</div>
                </div>
                <div style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%); color: white; min-width: 42px; height: 42px; border-radius: 10px; font-weight: bold; font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                    ${count}
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

function setupCellEventListeners() {
    document.querySelectorAll('.class-cell').forEach(cell => {
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('dragleave', handleDragLeave);
        cell.addEventListener('drop', handleDrop);
    });

    document.querySelectorAll('.lesson-card').forEach(card => {
        card.addEventListener('dragstart', handleLessonDragStart);
        card.addEventListener('dragend', handleLessonDragEnd);
    });

    document.querySelectorAll('[data-remove-lesson]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            const [day, time, cls] = this.dataset.removeLesson.split('-');
            removeLesson(day, time, cls);
        });
    });
}// ==================== DRAG AND DROP ====================

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');

    const cell = e.currentTarget;
    const day = cell.dataset.day;
    const time = cell.dataset.time;
    const cls = cell.dataset.class;

    if (draggedTeacherIdx !== null && draggedLesson === null) {
        targetCell = { day, time, cls };
        showSubjectSelector(e, draggedTeacherIdx, cls);
        return;
    }

    if (draggedLesson && dragSourceCell) {
        const lesson = draggedLesson;

        if (checkConflict(day, time, lesson.teacherIdx, cls)) {
            showAlert('⚠️ CONFLITO: Este professor já tem aula neste horário!', 'error');
            resetDragState();
            return;
        }

        if (schedule[day][time][cls]) {
            if (!confirm('Esta célula já possui uma aula. Deseja substituir?')) {
                resetDragState();
                return;
            }
        }

        schedule[dragSourceCell.day][dragSourceCell.time][dragSourceCell.cls] = null;
        schedule[day][time][cls] = { ...lesson };

        renderSchedule();
        saveToStorage();
        showAlert('Aula movida com sucesso!', 'success');
        resetDragState();
    }
}

function handleLessonDragStart(e) {
    e.stopPropagation();
    const card = e.currentTarget;
    const day = card.dataset.day;
    const time = card.dataset.time;
    const cls = card.dataset.class;

    draggedLesson = { ...schedule[day][time][cls] };
    dragSourceCell = { day, time, cls };
    draggedTeacherIdx = null;

    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'lesson');
}

function handleLessonDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
}

// ==================== SELETOR DE DISCIPLINA ====================

function showSubjectSelector(e, teacherIdx, targetClass) {
    e.stopPropagation(); // Evita que o clique se propague para o documento
    hideSubjectSelector(); // Esconde qualquer seletor aberto

    targetCell = {
        day: e.currentTarget.dataset.day,
        time: e.currentTarget.dataset.time,
        cls: e.currentTarget.dataset.class
    };

    draggedTeacherIdx = teacherIdx; // Define o professor arrastado para uso em assignSubjectToCell

    const selector = document.getElementById('subjectSelector');
    selector.innerHTML = ''; // Limpa o conteúdo anterior

    const teacher = teachers[teacherIdx];
    if (!teacher) {
        showAlert('Erro: Professor não encontrado', 'error');
        return;
    }

    let html = `<h3>Disciplinas para ${teacher.name}</h3>`;

    // Adicionar a disciplina principal do professor (SOMENTE SE ELE LECIONA NESTA TURMA)
    const principalSubjects = [];
    if (teacher.classes && teacher.classes.includes(targetClass)) {
        principalSubjects.push({
            subject: teacher.subject,
            isPrincipal: true
        });
    }

    // Adicionar disciplinas específicas do professor (itinerários formativos)
    const specificSubjects = teacherSpecificSubjects[teacherIdx]
        ? teacherSpecificSubjects[teacherIdx].filter(s => s.class === targetClass || s.class === 'all')
        : [];

    const allSubjects = [...principalSubjects, ...specificSubjects];

    if (allSubjects.length === 0) {
        html += `
            <div style="padding: 20px; text-align: center; color: #ef4444;">
                <p style="font-weight: 600; margin-bottom: 10px;">⚠️ Professor não leciona nesta turma</p>
                <p style="font-size: 13px; color: #666;">
                    ${teacher.name} não está cadastrado para lecionar na turma ${targetClass}.<br>
                    <br>
                    Para adicionar esta turma, edite o professor e inclua a turma ${targetClass} nas configurações.
                </p>
            </div>
        `;
    } else {
        allSubjects.forEach(item => {
            const classInfo = item.class && item.class !== 'all' ? ` (${item.class})` : '';
            const badge = item.isPrincipal ? '<span class="badge principal-badge">P</span>' : '';

            // Verificar limite de carga horária
            const limitCheck = checkTeacherAllocation(teacherIdx, targetClass, item.subject);
            const isLimitReached = limitCheck.exceeded;

            // Criar badge de progresso
            let progressBadge = '';
            if (limitCheck.limit > 0) {
                const progressColor = isLimitReached ? '#ef4444' : (limitCheck.current >= limitCheck.limit - 1 ? '#f59e0b' : '#22c55e');
                progressBadge = `<span style="background: ${progressColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px;">${limitCheck.current}/${limitCheck.limit}</span>`;
            }

            if (isLimitReached) {
                // Disciplina com limite atingido - desabilitada
                html += `<div class="subject-option disabled" style="color: #999; cursor: not-allowed; opacity: 0.6; background: #f3f4f6;">
                    ${badge}${item.subject}${item.isPrincipal ? ' (Principal)' : classInfo}
                    ${progressBadge}
                    <span style="display: block; font-size: 10px; color: #ef4444; margin-top: 3px;">⚠️ Limite do professor atingido</span>
                </div>`;
            } else {
                const className = item.isPrincipal ? 'subject-option principal' : 'subject-option specific';
                html += `<div class="${className}" data-subject="${item.subject}">
                    ${badge}${item.subject}${item.isPrincipal ? ' (Principal)' : classInfo}
                    ${progressBadge}
                </div>`;
            }
        });
    }

    selector.innerHTML = html;

    selector.querySelectorAll('[data-subject]').forEach(opt => {
        opt.addEventListener('click', function () {
            assignSubjectToCell(this.dataset.subject);
        });
    });

    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 5;

    if (left + 260 > window.innerWidth) {
        left = window.innerWidth - 270;
    }
    if (top + 310 > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - 310;
    }

    selector.style.left = Math.max(10, left) + 'px';
    selector.style.top = Math.max(10, top) + 'px';
    selector.classList.add('active');
}

function assignSubjectToCell(subject) {
    const selector = document.getElementById('subjectSelector');
    selector.classList.remove('active');

    if (draggedTeacherIdx === null || !targetCell) {
        resetDragState();
        return;
    }

    const teacher = teachers[draggedTeacherIdx];
    if (!teacher) {
        showAlert('Erro: Professor não encontrado', 'error');
        resetDragState();
        return;
    }

    // ✅ NOVA VALIDAÇÃO: Verificar restrições de horário do professor
    const restrictionViolation = checkRestrictionViolation(draggedTeacherIdx, targetCell.day, targetCell.time);
    if (restrictionViolation && restrictionViolation.violated) {
        showAlert(`🚫 RESTRIÇÃO DE HORÁRIO!\n\n${restrictionViolation.message}`, 'error');
        resetDragState();
        return;
    }

    if (checkConflict(targetCell.day, targetCell.time, draggedTeacherIdx, targetCell.cls)) {
        showAlert('⚠️ CONFLITO: Este professor já tem aula neste horário em outra turma!', 'error');
        resetDragState();
        return;
    }

    // ✅ NOVA VALIDAÇÃO: Verificar se já existe outro professor ensinando esta disciplina nesta turma
    const duplicateCheck = checkDuplicateSubjectInClass(subject, targetCell.cls, draggedTeacherIdx);
    if (duplicateCheck.hasDuplicate) {
        showAlert(`⚠️ PROFESSOR DUPLICADO!\n\n📚 Disciplina: ${subject}\n🏫 Turma: ${targetCell.cls}\n👤 Professor já atribuído: ${duplicateCheck.existingTeacher}\n\nNão é permitido ter dois professores diferentes ensinando a mesma disciplina na mesma turma.`, 'error');
        resetDragState();
        return;
    }

    // ✅ NOVA VALIDAÇÃO: Verificar limite de carga horária do PROFESSOR
    const limitCheck = checkTeacherAllocation(draggedTeacherIdx, targetCell.cls, subject);
    if (limitCheck.exceeded) {
        showAlert(`⚠️ LIMITE DO PROFESSOR EXCEDIDO!\n\n📚 Disciplina: ${subject}\n🏫 Turma: ${targetCell.cls}\n📊 Limite definido: ${limitCheck.limit}h\n✅ Já atribuídas: ${limitCheck.current}h\n\nEste professor já atingiu sua cota de aulas para esta turma.`, 'error');
        resetDragState();
        return;
    }

    const lesson = {
        subject: subject,
        teacher: teacher.name,
        teacherIdx: draggedTeacherIdx
    };

    schedule[targetCell.day][targetCell.time][targetCell.cls] = lesson;

    renderSchedule();
    renderTeachersList();
    saveToStorage();

    // Mostrar alerta com informação de progresso
    const remaining = limitCheck.limit - limitCheck.current - 1;
    const progressMsg = remaining > 0
        ? `\n(${limitCheck.current + 1}/${limitCheck.limit} aulas - faltam ${remaining})`
        : `\n(${limitCheck.limit}/${limitCheck.limit} aulas - COMPLETO! ✅)`;

    showAlert(`✅ ${subject} com ${teacher.name} atribuído!${progressMsg}`, 'success');
    resetDragState();
}

function hideSubjectSelector() {
    document.getElementById('subjectSelector').classList.remove('active');
}


// ==================== VALIDAÇÃO DE CARGA HORÁRIA SEMANAL ====================

// Função para verificar se já existe outro professor ensinando a mesma disciplina nesta turma
function checkDuplicateSubjectInClass(subject, cls, currentTeacherIdx) {
    // Percorrer toda a grade semanal desta turma
    for (let day of days) {
        for (let slot of timeSlots) {
            if (!slot.isInterval) {
                const lesson = schedule[day]?.[slot.id]?.[cls];
                if (lesson && lesson.subject === subject && lesson.teacherIdx !== currentTeacherIdx) {
                    return {
                        hasDuplicate: true,
                        existingTeacher: lesson.teacher,
                        day: day,
                        time: slot.id
                    };
                }
            }
        }
    }
    return { hasDuplicate: false };
}

// Função para verificar se o professor atingiu seu limite para a turma
function checkTeacherAllocation(teacherIdx, cls, subject) {
    const teacher = teachers[teacherIdx];
    if (!teacher) return { exceeded: false, current: 0, limit: 0 };

    let limit = 0;

    // Verificar se é a disciplina principal
    if (teacher.subject === subject) {
        if (teacher.classHours && teacher.classHours[cls] !== undefined) {
            limit = teacher.classHours[cls];
        } else {
            limit = teacher.hoursPerClass || 2;
        }
    } else {
        // Verificar disciplinas específicas
        const specific = teacherSpecificSubjects[teacherIdx];
        if (specific) {
            const item = specific.find(s => s.subject === subject && (s.class === cls || s.class === 'all'));
            if (item) {
                limit = item.hoursPerWeek || 1;
            }
        }
    }

    // Contar aulas já atribuídas para este professor, nesta turma e disciplina
    let current = 0;
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval && schedule[day]?.[slot.id]?.[cls]) {
                const lesson = schedule[day][slot.id][cls];
                if (lesson && lesson.teacherIdx == teacherIdx && lesson.subject === subject) {
                    current++;
                }
            }
        });
    });

    return {
        exceeded: current >= limit,
        current: current,
        limit: limit
    };
}

// Função para contar quantas aulas de uma disciplina já existem para uma turma na semana
function countSubjectInClass(subject, cls) {
    let count = 0;

    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval && schedule[day]?.[slot.id]?.[cls]) {
                const lesson = schedule[day][slot.id][cls];
                if (lesson && lesson.subject === subject) {
                    count++;
                }
            }
        });
    });

    return count;
}

// Função para obter o ano da turma (1, 2 ou 3)
function getClassYear(cls) {
    return parseInt(cls[0]);
}

// Função para verificar se o limite semanal foi atingido (MANTIDA PARA COMPATIBILIDADE VISUAL)
function checkWeeklyHoursLimit(subject, cls) {
    const year = getClassYear(cls);
    const currentCount = countSubjectInClass(subject, cls);

    // Verificar se a disciplina tem limite definido
    let limit = null;

    // Primeiro, tentar encontrar correspondência exata
    if (weeklyHoursLimit[subject]) {
        limit = weeklyHoursLimit[subject][year];
    }

    // Se não encontrar, tentar correspondência parcial (para disciplinas genéricas)
    if (limit === null) {
        for (const [key, value] of Object.entries(weeklyHoursLimit)) {
            if (subject.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(subject.toLowerCase())) {
                limit = value[year];
                break;
            }
        }
    }

    // Se ainda não encontrou, não tem limite definido (permitir)
    if (limit === null) {
        return { exceeded: false, current: currentCount, limit: '∞' };
    }

    return {
        exceeded: currentCount >= limit,
        current: currentCount,
        limit: limit
    };
}

function resetDragState() {
    draggedTeacherIdx = null;
    draggedLesson = null;
    dragSourceCell = null;
    targetCell = null;
}

// ==================== VERIFICAÇÃO DE CONFLITOS ====================

function checkConflict(day, time, teacherIdx, excludeClass = null) {
    if (teacherIdx === null || teacherIdx === undefined) return false;

    for (let cls of classes) {
        if (cls === excludeClass) continue;
        const lesson = schedule[day]?.[time]?.[cls];
        if (lesson && lesson.teacherIdx === teacherIdx) {
            return true;
        }
    }
    return false;
}

function countAllConflicts() {
    let conflicts = 0;
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                classes.forEach(cls => {
                    const lesson = schedule[day]?.[slot.id]?.[cls];
                    if (lesson && checkConflict(day, slot.id, lesson.teacherIdx, cls)) {
                        conflicts++;
                    }
                });
            }
        });
    });
    return conflicts;
}

function removeLesson(day, time, cls) {
    const lesson = schedule[day][time][cls];
    if (lesson && confirm(`Remover aula de ${lesson.subject} com ${lesson.teacher}?`)) {
        schedule[day][time][cls] = null;
        renderSchedule();
        renderTeachersList();
        saveToStorage();
        showAlert('Aula removida!', 'success');
    }
}

// ==================== NAVEGAÇÃO ====================

function showDay(day) {
    currentDay = day;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.dataset.day === day) {
            tab.classList.add('active');
        }
    });
    renderSchedule();
}

function showSchedulePage() {
    document.getElementById('schedulePage').classList.add('active');
    document.getElementById('reportPage').classList.remove('active');
}

function showReportPage() {
    document.getElementById('schedulePage').classList.remove('active');
    document.getElementById('reportPage').classList.add('active');
    renderReport();
}

// ==================== MODAIS ====================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ==================== MODAL DE VISUALIZAÇÃO POR TURMA ====================

function openClassScheduleModal() {
    const modal = document.getElementById('classScheduleModal');
    const select = document.getElementById('classScheduleSelect');

    // Popular o dropdown com as turmas
    select.innerHTML = '<option value="">Selecione...</option>';
    classes.forEach(cls => {
        const year = cls[0];
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = `${year}º ANO - Turma ${cls}`;
        select.appendChild(option);
    });

    // Limpar container
    document.getElementById('classScheduleContainer').innerHTML = `
        <div style="text-align: center; color: #666; padding: 40px;">
            Selecione uma turma acima para visualizar o horário completo.
        </div>
    `;

    modal.classList.add('active');
}

function displayClassScheduleInModal(selectedClass) {
    const container = document.getElementById('classScheduleContainer');

    try {
        let html = '<table class="schedule-table"><thead><tr>';
        html += '<th style="min-width: 100px;">HORÁRIO</th>';

        // Headers são os dias da semana
        days.forEach(day => {
            html += `<th>${dayNames[day]}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Contador de aulas por professor na semana
        const teacherLessonsCount = {};

        timeSlots.forEach(slot => {
            html += `<tr class="${slot.isInterval ? 'interval-row' : ''}">`;
            html += `<td class="time-cell ${slot.isInterval ? 'interval-cell' : ''}">
                <strong>${slot.label}</strong><br>
                <small>${slot.time}</small>
            </td>`;

            if (slot.isInterval) {
                html += `<td colspan="${days.length}" class="interval-cell">
                    ${slot.label === 'ALMOÇO' ? '🍽️' : '☕'} ${slot.label}
                </td>`;
            } else {
                days.forEach(day => {
                    const lesson = schedule[day]?.[slot.id]?.[selectedClass];

                    html += `<td class="class-cell-readonly" style="padding: 8px; border: 1px solid #e0e0e0;">`;

                    if (lesson) {
                        const teacherName = lesson.teacher;
                        if (!teacherLessonsCount[teacherName]) {
                            teacherLessonsCount[teacherName] = 0;
                        }
                        teacherLessonsCount[teacherName]++;

                        const teacher = teachers[lesson.teacherIdx];
                        const colors = teacher ? getTeacherColor(teacher) : ['#667eea', '#764ba2'];

                        const isClubeTutoria = lesson.subject === 'Clube/Tutoria';
                        if (isClubeTutoria) {
                            html += `
                                <div class="lesson-card-readonly"
                                     style="background: #f8f9fa; border: 2px dashed #cbd5e1;
                                            color: #64748b; padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">Clubes</div>
                                    <div style="font-size: 10px; opacity: 0.7;">Clube/Tutoria</div>
                                </div>`;
                        } else {
                            html += `
                                <div class="lesson-card-readonly"
                                     style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%);
                                            color: white; padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">${lesson.teacher}</div>
                                    <div style="font-size: 10px; opacity: 0.85;">${abbreviateSubject(lesson.subject)}</div>
                                </div>`;
                        }
                    }
                    html += '</td>';
                });
            }
            html += '</tr>';
        });

        html += '</tbody></table>';

        // Adicionar resumo semanal de professores
        const sortedTeachers = Object.entries(teacherLessonsCount).sort((a, b) => b[1] - a[1]);

        if (sortedTeachers.length > 0) {
            const totalAulas = Object.values(teacherLessonsCount).reduce((a, b) => a + b, 0);

            html += `
                <div class="daily-teacher-summary" style="margin-top: 30px; padding: 25px; background: linear-gradient(135deg, #f8f9fc 0%, #e9ecf5 100%); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                        <h3 style="margin: 0; color: #333; font-size: 18px;">
                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 18px; border-radius: 25px; font-size: 14px; font-weight: 600;">
                                📊 Resumo Semanal: Turma ${selectedClass}
                            </span>
                        </h3>
                        <div style="display: flex; gap: 20px; align-items: center;">
                            <span style="font-size: 14px; color: #666; background: white; padding: 8px 15px; border-radius: 20px;">
                                👥 <strong>${sortedTeachers.length}</strong> professores
                            </span>
                            <span style="font-size: 14px; color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 8px 15px; border-radius: 20px; font-weight: 600;">
                                📚 Total: <strong>${totalAulas}</strong> aulas
                            </span>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">`;

            sortedTeachers.forEach(([teacherName, count]) => {
                const teacherIdx = teachers.findIndex(t => t.name === teacherName);
                const teacher = teacherIdx >= 0 ? teachers[teacherIdx] : null;
                const colors = teacher ? getTeacherColor(teacher) : ['#667eea', '#764ba2'];

                html += `
                    <div style="display: flex; align-items: center; background: white; padding: 12px 15px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06);">
                        <div style="width: 6px; height: 30px; background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%); border-radius: 3px; margin-right: 12px;"></div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 13px;">${teacherName}</div>
                            <div style="font-size: 11px; color: #666;">${teacher ? teacher.subject : ''}</div>
                        </div>
                        <div style="font-weight: bold; font-size: 16px; color: #667eea;">${count}</div>
                    </div>
                `;
            });

            html += `</div></div>`;
        }

        container.innerHTML = html;
    } catch (error) {
        console.error('Erro ao exibir horário da turma:', error);
        container.innerHTML = `<div style="text-align: center; color: red;">Erro ao exibir horário: ${error.message}</div>`;
    }
}

function printClassSchedule() {
    const selectedClass = document.getElementById('classScheduleSelect').value;
    if (!selectedClass) {
        showAlert('Selecione uma turma para imprimir!', 'warning');
        return;
    }

    // Implementação simplificada de impressão
    const printContent = document.getElementById('classScheduleContainer').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');

    printWindow.document.write('<html><head><title>Horário da Turma ' + selectedClass + '</title>');
    printWindow.document.write('<link rel="stylesheet" href="style.css">');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h1>Horário da Turma ' + selectedClass + '</h1>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function renderReport() {
    const container = document.getElementById('report-content');
    if (!container) return;

    let html = `<h2>Relatório de Professores</h2><div class="report-grid">`;

    teachers.forEach((teacher, idx) => {
        const workload = calculateTotalWorkload(idx);
        const colors = getTeacherColor(teacher);

        html += `
            <div class="teacher-report-card" style="border-left: 5px solid ${colors[0]}; padding: 15px; background: white; margin-bottom: 10px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3>${teacher.name}</h3>
                <p><strong>Disciplina:</strong> ${teacher.subject}</p>
                <p><strong>Carga Horária Total:</strong> ${workload.totalHours} aulas</p>
                <p><strong>Turmas:</strong> ${(teacher.classes || []).join(', ')}</p>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function filterReport() {
    // Função para filtrar/ordenar relatório
    // Por enquanto apenas re-renderiza o relatório
    renderReport();
}

function showTeacherDetails(teacherIdx) {
    const teacher = teachers[teacherIdx];
    if (!teacher) return;

    const workload = calculateTotalWorkload(teacherIdx);
    const specificList = teacherSpecificSubjects[teacherIdx] || [];
    const teacherClasses = teacher.classes || classes;

    // Construção do HTML do modal de detalhes
    // (Reconstruído baseado em logs anteriores e lógica de loadTeacherSpecificSubjects)

    let html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="margin: 0;">${teacher.name}</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${teacher.subject}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; color: #666;">Carga Horária Principal</div>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${workload.principalHours}h</div>
            </div>
             <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; color: #666;">Carga Horária Extra</div>
                <div style="font-size: 24px; font-weight: bold; color: #333;">${workload.extraHours}h</div>
            </div>
             <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; color: #666;">Total Semanal</div>
                <div style="font-size: 24px; font-weight: bold; color: #667eea;">${workload.totalHours}h</div>
            </div>
        </div>
    `;

    // Detalhes da Carga Horária (Principal)
    html += `<h4 style="color: #667eea; margin-bottom: 10px;">📚 Disciplina Principal</h4>`;

    if (teacher.classHours && Object.keys(teacher.classHours).length > 0) {
        const grouped = {};
        Object.entries(teacher.classHours).forEach(([cls, hours]) => {
            if (!grouped[hours]) grouped[hours] = [];
            grouped[hours].push(cls);
        });

        html += `<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">`;
        Object.entries(grouped).sort((a, b) => b[0] - a[0]).forEach(([hours, classList]) => {
            const subtotal = parseInt(hours) * classList.length;
            html += `
                <div style="background: white; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee;">
                    <div>
                        <strong>${hours} aula(s)/semana:</strong> 
                        <span style="color: #666;">${classList.join(', ')}</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    } else {
        html += `<p class="text-muted">Configuração padrão: ${teacher.hoursPerClass || 2} aulas por turma.</p>`;
    }

    // Itinerários Formativos
    if (specificList.length > 0) {
        html += `<h4 style="color: #667eea; margin-bottom: 10px;">📌 Itinerários Formativos</h4>
                 <ul style="list-style: none; padding: 0;">`;
        specificList.forEach(item => {
            html += `<li style="padding: 8px; background: #f8f9fa; margin-bottom: 5px; border-radius: 4px;">
                        <strong>${item.subject}</strong> - ${item.class === 'all' ? 'Todas as turmas' : 'Turma ' + item.class} (${item.hoursPerWeek}h)
                      </li>`;
        });
        html += `</ul>`;
    }

    // Schedule Grid - Calcular total de aulas deste professor
    let totalTeacherLessons = 0;
    days.forEach(d => {
        timeSlots.forEach(s => {
            if (!s.isInterval) {
                classes.forEach(c => {
                    const l = schedule[d]?.[s.id]?.[c];
                    if (l && l.teacherIdx === teacherIdx) {
                        totalTeacherLessons++;
                    }
                });
            }
        });
    });

    html += `<h4 style="color: #667eea; margin-top: 20px; margin-bottom: 15px;">📅 Aulas Atribuídas na Grade (${totalTeacherLessons} aulas):</h4>`;

    let hasLessons = false;
    days.forEach(day => {
        // Recalculando aulas deste professor para o dia
        const teacherLessons = [];
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                classes.forEach(cls => {
                    const l = schedule[day]?.[slot.id]?.[cls];
                    if (l && l.teacherIdx === teacherIdx) {
                        teacherLessons.push({
                            timeLabel: slot.label,
                            timeRange: slot.time,
                            class: cls,
                            subject: l.subject
                        });
                    }
                });
            }
        });

        if (teacherLessons.length > 0) {
            hasLessons = true;
            html += `
                <div class="day-schedule" style="margin-bottom: 10px;">
                    <div class="day-schedule-header" style="font-weight: bold; background: #eee; padding: 5px 10px; border-radius: 4px;">${dayNames[day]} (${teacherLessons.length} aulas)</div>
                    <div class="day-schedule-items" style="padding: 10px;">
                        ${teacherLessons.map(l => `
                            <div class="schedule-item" style="margin-bottom: 5px; font-size: 13px;">
                                <span>${l.timeLabel} - Turma ${l.class} - ${l.subject}</span>
                                <span class="time" style="color: #666; font-size: 11px; margin-left: 10px;">${l.timeRange}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });

    if (!hasLessons) {
        html += `
            <div style="text-align: center; padding: 20px; color: #6c757d; background: #f8f9fa; border-radius: 8px;">
                <p>Nenhuma aula atribuída na grade de horários ainda.</p>
            </div>
        `;
    }

    // Adicionar botões de editar no final
    html += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button onclick="openTeacherModalForEdit(${teacherIdx})"
                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                           color: white; border: none; padding: 12px 30px; border-radius: 8px;
                           font-size: 15px; font-weight: 600; cursor: pointer;
                           box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transition: transform 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.transform='translateY(0)'">
                ✏️ Editar Professor
            </button>
            <button onclick="openItinerariosForTeacher(${teacherIdx})"
                    style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                           color: white; border: none; padding: 12px 30px; border-radius: 8px;
                           font-size: 15px; font-weight: 600; cursor: pointer;
                           box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); transition: transform 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.transform='translateY(0)'">
                📚 Editar Itinerários
            </button>
        </div>
    `;

    document.getElementById('teacherDetailContent').innerHTML = html;
    document.getElementById('teacherDetailModal').classList.add('active');

    // Adicionar listener para o botão de edição
    const editBtn = document.querySelector('[data-edit-teacher]'); // Botão no modal?
    // O modal HTML original tinha um botão de editar?
    // Se não tiver, não tem problema.
}

// ==================== EXPORTAR / IMPORTAR ====================

function exportSchedule() {
    const data = {
        schedule: schedule,
        teachers: teachers,
        teacherSpecificSubjects: teacherSpecificSubjects,
        lockedCells: lockedCells || {},
        timeSlots: timeSlots,
        currentDay: currentDay
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'horario-escolar-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importSchedule() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.teachers && Array.isArray(data.teachers)) {
                // Formato completo
                if (validateImportData(data)) {
                    teachers.length = 0;
                    teachers.push(...data.teachers);

                    // Importar configuration de workloads
                    if (data.teacherSpecificSubjects) {
                        // Limpar e copiar
                        for (let k in teacherSpecificSubjects) delete teacherSpecificSubjects[k];
                        Object.assign(teacherSpecificSubjects, data.teacherSpecificSubjects);
                    }

                    // Importar cadeados
                    if (typeof lockedCells !== 'undefined') {
                        for (let k in lockedCells) delete lockedCells[k];
                        if (data.lockedCells) {
                            Object.assign(lockedCells, data.lockedCells);
                        }
                    }

                    // Importar timeSlots se existirem
                    if (data.timeSlots) {
                        timeSlots.length = 0;
                        timeSlots.push(...data.timeSlots);
                    }

                    // Resetar schedule
                    days.forEach(day => {
                        schedule[day] = {};
                        timeSlots.forEach(slot => {
                            if (!slot.isInterval) {
                                schedule[day][slot.id] = {};
                                classes.forEach(cls => {
                                    schedule[day][slot.id][cls] = null;
                                });
                            }
                        });
                    });

                    // Copiar schedule
                    Object.assign(schedule, data.schedule);

                    saveToStorage();
                    renderTeachersList(); // Re-renderizar lista de professores
                    renderSchedule();
                    showAlert('✅ Dados importados com sucesso!', 'success');
                } else {
                    showAlert('❌ Arquivo inválido ou corrompido!', 'error');
                }
            } else if (Array.isArray(data)) {
                // Formato simples (lista de professores)
                importFromSimpleFormat(data);
            } else {
                showAlert('❌ Formato de arquivo desconhecido!', 'error');
            }

        } catch (error) {
            console.error('Erro ao importar:', error);
            showAlert('❌ Erro ao ler o arquivo JSON: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Limpar input
}

function validateImportData(data) {
    if (!data.schedule || !data.teachers) return false;
    return true;
}

function findTeacherIdx(name) {
    return teachers.findIndex(t => t.name === name);
}

function importFromSimpleFormat(simpleData) {
    if (!confirm('Este arquivo parece conter apenas uma lista de professores/aulas. Deseja importar e SOBRESCREVER os dados atuais?')) {
        return;
    }

    // Resetar tudo
    teachers.length = 0;
    days.forEach(day => {
        schedule[day] = {};
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                schedule[day][slot.id] = {};
                classes.forEach(cls => {
                    schedule[day][slot.id][cls] = null;
                });
            }
        });
    });

    // Tentar reconstruir
    // Assumindo formato: [{name: 'Prof', subject: 'Mat', lessons: [...]}, ...]
    // Implementação básica se necessário
    showAlert('Importação de formato simples não totalmente implementada.', 'warning');
}

function downloadModelJSON() {
    const model = {
        teachers: [
            { name: "Professor Exemplo", subject: "Matemática", classes: ["1A", "1B"], color: "#FF5733" }
        ],
        schedule: {} // Estrutura vazia
    };

    // Preencher estrutura vazia
    days.forEach(day => {
        model.schedule[day] = {};
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                model.schedule[day][slot.id] = {};
                classes.forEach(cls => {
                    model.schedule[day][slot.id][cls] = null;
                });
            }
        });
    });

    const json = JSON.stringify(model, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-horario.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadExemploCompleto() {
    // Gerar dados de exemplo
    const exemploTeachers = [
        { name: "Silva", subject: "Matemática", classes: ["1A", "1B", "1C"], color: "#FF5733" },
        { name: "Santos", subject: "Português", classes: ["1A", "1B", "2A"], color: "#33FF57" },
        // ... mais professores
    ];

    const data = {
        teachers: exemploTeachers,
        schedule: schedule, // Atual (pode estar vazio)
        teacherSpecificSubjects: {}
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemplo-completo.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==================== LIMPAR / IMPRIMIR ====================

function clearSchedule() {
    if (confirm('Tem certeza que deseja limpar toda a grade de horários? Esta ação não pode ser desfeita.')) {
        days.forEach(day => {
            timeSlots.forEach(slot => {
                if (!slot.isInterval) {
                    classes.forEach(cls => {
                        schedule[day][slot.id][cls] = null;
                    });
                }
            });
        });

        renderSchedule();
        saveToStorage();
        showAlert('Grade limpa com sucesso!', 'success');
    }
}

function printSchedule() {
    // 1. Criar ou obter container de impressão
    let printContainer = document.getElementById('print-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        document.body.appendChild(printContainer);
    }

    // 2. Limpar conteúdo anterior
    printContainer.innerHTML = '';

    // 3. Map de nomes de dias
    const dayNamesPrint = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira'
    };

    if (viewMode === 'class') {
        // MODO POR TURMA: Imprimir todas as turmas
        classes.forEach(cls => {
            const classHTML = generateClassScheduleTableHTML(cls);

            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'print-day-page page-break';
            pageWrapper.innerHTML = `
                <div class="print-header" style="text-align: center; margin-bottom: 20px;">
                    <h1>Escola de Ensino Médio - Turno Integral</h1>
                    <h2>Grade Horária - Turma ${cls}</h2>
                </div>
                ${classHTML}
            `;
            printContainer.appendChild(pageWrapper);
        });

    } else {
        // MODO GERAL: Imprimir por dias
        days.forEach(day => {
            const dayHTML = getGeneralScheduleHTML(day);

            const dayWrapper = document.createElement('div');
            dayWrapper.className = 'print-day-page page-break';
            dayWrapper.innerHTML = `
                <div class="print-header" style="text-align: center; margin-bottom: 20px;">
                    <h1>Escola de Ensino Médio - Turno Integral</h1>
                    <h2>Grade Horária - ${dayNamesPrint[day] || day}</h2>
                </div>
                ${dayHTML}
            `;

            printContainer.appendChild(dayWrapper);
        });
    }

    // 4. Imprimir
    window.print();
}

// ==================== PERSISTÊNCIA ====================

function hasCloudSyncEnabled() {
    return typeof cloudSyncConfig !== 'undefined'
        && cloudSyncConfig
        && cloudSyncConfig.enabled === true
        && cloudSyncConfig.provider === 'supabase';
}

function hasValidCloudSyncConfig() {
    return hasCloudSyncEnabled()
        && typeof cloudSyncConfig.supabaseUrl === 'string'
        && cloudSyncConfig.supabaseUrl.trim() !== ''
        && typeof cloudSyncConfig.supabaseAnonKey === 'string'
        && cloudSyncConfig.supabaseAnonKey.trim() !== ''
        && typeof cloudSyncConfig.table === 'string'
        && cloudSyncConfig.table.trim() !== ''
        && typeof cloudSyncConfig.schoolId === 'string'
        && cloudSyncConfig.schoolId.trim() !== '';
}

function getCloudSyncEndpoint() {
    const baseUrl = cloudSyncConfig.supabaseUrl.replace(/\/+$/, '');
    return `${baseUrl}/rest/v1/${cloudSyncConfig.table}`;
}

function buildPersistedData() {
    return {
        schedule: schedule,
        teachers: teachers,
        teacherSpecificSubjects: teacherSpecificSubjects,
        teacherRestrictions: teacherRestrictions || {},
        lockedCells: lockedCells || {},
        timeSlots: timeSlots,
        slotDuration: slotDuration,
        viewMode: viewMode,
        currentSelectedClass: currentSelectedClass,
        lastUpdatedAt: new Date().toISOString()
    };
}

function persistLocally(data) {
    localStorage.setItem('schoolScheduleData', JSON.stringify(data));
    localStorage.setItem('customTimeSlots', JSON.stringify(data.timeSlots || timeSlots));
}

function applyPersistedData(data) {
    if (!data || typeof data !== 'object') return false;

    if (Array.isArray(data.teachers)) {
        teachers.length = 0;
        teachers.push(...data.teachers);
    }

    if (data.schedule && typeof data.schedule === 'object') {
        Object.assign(schedule, data.schedule);
    }

    if (data.teacherSpecificSubjects && typeof data.teacherSpecificSubjects === 'object') {
        for (let k in teacherSpecificSubjects) delete teacherSpecificSubjects[k];
        Object.assign(teacherSpecificSubjects, data.teacherSpecificSubjects);
    }

    if (data.teacherRestrictions && typeof data.teacherRestrictions === 'object') {
        for (let k in teacherRestrictions) delete teacherRestrictions[k];
        Object.assign(teacherRestrictions, data.teacherRestrictions);
    }

    if (data.lockedCells && typeof data.lockedCells === 'object' && typeof lockedCells !== 'undefined') {
        for (let k in lockedCells) delete lockedCells[k];
        Object.assign(lockedCells, data.lockedCells);
    }

    if (Array.isArray(data.timeSlots)) {
        timeSlots.length = 0;
        timeSlots.push(...data.timeSlots);
    }

    if (typeof data.slotDuration === 'number' && data.slotDuration > 0) {
        slotDuration = data.slotDuration;
    }

    if (data.viewMode === 'general' || data.viewMode === 'class') {
        viewMode = data.viewMode;
        updateViewModeUI();
    }

    if (data.currentSelectedClass && classes.includes(data.currentSelectedClass)) {
        currentSelectedClass = data.currentSelectedClass;
    }

    return true;
}

function getSnapshotTimestamp(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.lastUpdatedAt) return 0;
    const parsed = Date.parse(snapshot.lastUpdatedAt);
    return Number.isNaN(parsed) ? 0 : parsed;
}

async function fetchCloudSnapshot() {
    const encodedSchoolId = encodeURIComponent(cloudSyncConfig.schoolId);
    const endpoint = `${getCloudSyncEndpoint()}?school_id=eq.${encodedSchoolId}&select=school_id,data&limit=1`;

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            apikey: cloudSyncConfig.supabaseAnonKey,
            Authorization: `Bearer ${cloudSyncConfig.supabaseAnonKey}`
        }
    });

    if (!response.ok) {
        throw new Error(`Falha ao consultar nuvem (${response.status})`);
    }

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0 || !rows[0].data) return null;
    return rows[0].data;
}

async function pushCloudSnapshot(snapshot) {
    const endpoint = `${getCloudSyncEndpoint()}?on_conflict=school_id`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            apikey: cloudSyncConfig.supabaseAnonKey,
            Authorization: `Bearer ${cloudSyncConfig.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
            school_id: cloudSyncConfig.schoolId,
            data: snapshot
        })
    });

    if (!response.ok) {
        throw new Error(`Falha ao salvar na nuvem (${response.status})`);
    }
}

function scheduleCloudSync(snapshot) {
    if (!hasValidCloudSyncConfig()) return;
    if (cloudSyncConfig.autoSync !== true) return;

    cloudSyncPendingSnapshot = snapshot;
    clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(() => {
        void syncCloudSnapshot(cloudSyncPendingSnapshot, false);
    }, cloudSyncConfig.debounceMs || 1200);
}

async function syncCloudSnapshot(snapshot, showFeedback) {
    if (!hasValidCloudSyncConfig()) return false;
    if (cloudSyncRunning) return false;

    cloudSyncRunning = true;
    try {
        await pushCloudSnapshot(snapshot);
        if (showFeedback) {
            showAlert('☁️ Dados sincronizados com sucesso.', 'success');
        }
        return true;
    } catch (error) {
        console.error('Erro na sincronização em nuvem:', error);
        if (showFeedback) {
            showAlert('Erro ao sincronizar com a nuvem. Verifique a configuração.', 'error');
        }
        return false;
    } finally {
        cloudSyncRunning = false;
    }
}

async function initCloudSync(hasLocalData) {
    if (!hasCloudSyncEnabled()) return;
    if (!hasValidCloudSyncConfig()) {
        showAlert('Cloud Sync ativo, mas faltam dados de configuração (URL/KEY/TABLE/ID).', 'warning');
        return;
    }

    try {
        const localRaw = localStorage.getItem('schoolScheduleData');
        const localData = localRaw ? JSON.parse(localRaw) : null;
        const cloudData = cloudSyncConfig.syncOnLoad ? await fetchCloudSnapshot() : null;

        if (!localData && cloudData) {
            applyPersistedData(cloudData);
            persistLocally(cloudData);
            populateSelects();
            renderTeachersList();
            renderSchedule();
            updateStats();
            showAlert('☁️ Dados carregados da nuvem.', 'info');
            return;
        }

        if (localData && cloudData) {
            const localTs = getSnapshotTimestamp(localData);
            const cloudTs = getSnapshotTimestamp(cloudData);

            if (cloudTs > localTs) {
                applyPersistedData(cloudData);
                persistLocally(cloudData);
                populateSelects();
                renderTeachersList();
                renderSchedule();
                updateStats();
                showAlert('☁️ Versão mais recente carregada da nuvem.', 'info');
                return;
            }
        }

        if (hasLocalData && localData) {
            scheduleCloudSync(localData);
        }
    } catch (error) {
        console.error('Erro ao inicializar sincronização em nuvem:', error);
    }
}

async function syncCloudNow() {
    if (!hasValidCloudSyncConfig()) {
        showAlert('Configure a sincronização em nuvem no arquivo config.js.', 'warning');
        return;
    }

    const snapshot = buildPersistedData();
    persistLocally(snapshot);
    await syncCloudSnapshot(snapshot, true);
}

function saveToStorage() {
    const data = buildPersistedData();
    persistLocally(data);
    scheduleCloudSync(data);
}

function loadFromStorage() {
    const saved = localStorage.getItem('schoolScheduleData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            applyPersistedData(data);
            return true;

        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            showAlert('Erro ao carregar dados salvos.', 'error');
        }
    } else {
        // Se não houver dados salvos, tentar carregar do arquivo inicial
        if (typeof loadInitialTeachers === 'function') {
            loadInitialTeachers();
        }
    }

    // Se carregou mas a lista de professores está vazia (ex: limpou storage mas manteve estrutura)
    if (teachers.length === 0 && typeof loadInitialTeachers === 'function') {
        loadInitialTeachers();
    }

    return false;
}

function migrateSpecificSubjects() {
    // Migração de dados legados se necessário
    // (Implementação vazia se já estiver atualizado)
}


// ==================== GERAR RELATÓRIO PDF ====================

function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Relatório de Carga Horária - Professores", 105, 15, null, null, "center");

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 105, 22, null, null, "center");

    let yPos = 35;

    teachers.forEach((teacher, idx) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        const workload = calculateTotalWorkload(idx);

        // Cabeçalho do professor
        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPos - 5, 182, 10, 'F');
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${teacher.name} (${teacher.subject})`, 16, yPos + 2);

        // Carga horária
        doc.setFont("helvetica", "normal");
        doc.text(`${workload.totalHours} aulas`, 180, yPos + 2, null, null, "right");

        yPos += 12;

        // Detalhes
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);

        // Principal
        if (workload.principalHours > 0) {
            doc.text(`• Principal: ${workload.principalHours}h`, 20, yPos);
            yPos += 6;
        }

        // Extras / Itinerários
        if (workload.extraHours > 0) {
            doc.text(`• Itinerários/Extras: ${workload.extraHours}h`, 20, yPos);
            yPos += 6;
        }

        yPos += 4; // Espaço extra
        doc.setFontSize(12);
    });

    doc.save("relatorio-carga-horaria.pdf");
}

// ==================== PDF AULAS POR DIA ====================

function generateDailyPDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    const dayNames = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira'
    };

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Aulas por Professor por Dia", 148, 14, null, null, "center");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 148, 21, null, null, "center");

    // Calcular aulas de cada professor por dia
    const teacherDayCounts = teachers.map((teacher, idx) => {
        const dayCounts = {};
        let weekTotal = 0;
        days.forEach(day => {
            let count = 0;
            timeSlots.forEach(slot => {
                if (!slot.isInterval) {
                    classes.forEach(cls => {
                        const lesson = schedule[day]?.[slot.id]?.[cls];
                        if (lesson && lesson.teacherIdx === idx) count++;
                    });
                }
            });
            dayCounts[day] = count;
            weekTotal += count;
        });
        return { teacher, dayCounts, weekTotal };
    });

    // Ordenar por nome
    teacherDayCounts.sort((a, b) => a.teacher.name.localeCompare(b.teacher.name, 'pt-BR'));

    // Cabeçalho da tabela
    const colX = {
        name: 14,
        subject: 95,
        segunda: 145,
        terca: 163,
        quarta: 181,
        quinta: 199,
        sexta: 217,
        total: 240
    };

    let y = 32;

    const drawTableHeader = () => {
        doc.setFillColor(60, 90, 160);
        doc.rect(14, y - 5, 266, 9, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text("Professor", colX.name + 1, y + 1);
        doc.text("Disciplina", colX.subject + 1, y + 1);
        doc.text("Seg", colX.segunda + 3, y + 1);
        doc.text("Ter", colX.terca + 3, y + 1);
        doc.text("Qua", colX.quarta + 3, y + 1);
        doc.text("Qui", colX.quinta + 3, y + 1);
        doc.text("Sex", colX.sexta + 3, y + 1);
        doc.text("Total", colX.total + 1, y + 1);
        doc.setTextColor(0, 0, 0);
        y += 10;
    };

    drawTableHeader();

    teacherDayCounts.forEach(({ teacher, dayCounts, weekTotal }, i) => {
        if (y > 185) {
            doc.addPage();
            y = 20;
            drawTableHeader();
        }

        // Linha zebrada
        if (i % 2 === 0) {
            doc.setFillColor(245, 247, 255);
            doc.rect(14, y - 4, 266, 8, 'F');
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(20, 20, 20);

        // Truncar nome se muito longo
        const nameText = teacher.name.length > 28 ? teacher.name.substring(0, 26) + '…' : teacher.name;
        const subjectText = (teacher.subject || '').length > 22 ? (teacher.subject || '').substring(0, 20) + '…' : (teacher.subject || '');

        doc.text(nameText, colX.name + 1, y + 1);
        doc.text(subjectText, colX.subject + 1, y + 1);

        days.forEach(day => {
            const count = dayCounts[day];
            const xPos = colX[day] + 5;
            if (count === 0) {
                doc.setTextColor(180, 180, 180);
            } else {
                doc.setTextColor(20, 20, 20);
            }
            doc.text(String(count), xPos, y + 1, null, null, "center");
        });

        // Total semanal em destaque
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 90, 160);
        doc.text(String(weekTotal), colX.total + 4, y + 1, null, null, "center");

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        y += 8;
    });

    // Linha de total geral
    if (y > 185) {
        doc.addPage();
        y = 20;
    }
    y += 2;
    doc.setFillColor(60, 90, 160);
    doc.rect(14, y - 4, 266, 9, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL GERAL", colX.name + 1, y + 2);

    let grandTotal = 0;
    days.forEach(day => {
        const dayTotal = teacherDayCounts.reduce((sum, t) => sum + t.dayCounts[day], 0);
        grandTotal += dayTotal;
        doc.text(String(dayTotal), colX[day] + 5, y + 2, null, null, "center");
    });
    doc.text(String(grandTotal), colX.total + 4, y + 2, null, null, "center");

    doc.save("aulas-por-dia.pdf");
}


// ==================== CONFIGURAÇÃO DE HORÁRIOS ====================

// ==================== HELPERS DE TEMPO ====================

function timeStringToMinutes(timeStr) {
    const [h, m] = timeStr.trim().split(':').map(Number);
    return h * 60 + m;
}

function minutesToTimeString(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getCurrentSlotDuration() {
    const input = document.getElementById('slotDurationInput');
    const val = input ? parseInt(input.value) : NaN;
    return (isNaN(val) || val <= 0) ? slotDuration : val;
}

// ==================== CONFIGURAÇÃO DE HORÁRIOS ====================

function openTimeSlotsModal() {
    pendingTimeSlots = JSON.parse(JSON.stringify(timeSlots));
    renderTimeSlotsConfig();
    document.getElementById('timeSlotsModal').classList.add('active');
}

function renderTimeSlotsConfig() {
    const container = document.getElementById('timeSlotsConfigList');
    if (!container) {
        console.error('Elemento timeSlotsConfigList não encontrado no DOM');
        showAlert('Erro ao abrir configuração de horários', 'error');
        return;
    }

    const dur = getCurrentSlotDuration();

    const insertBtn = (pos) => `
        <div style="text-align:center; margin:4px 0;">
            <button onclick="addSlotAt(${pos})"
                style="background:#e0f2fe;color:#0284c7;border:1px dashed #0284c7;padding:3px 14px;border-radius:20px;cursor:pointer;font-size:12px;">
                ➕ Adicionar Aula aqui
            </button>
        </div>`;

    let html = `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <label style="font-weight:600;color:#166534;white-space:nowrap;">⏱️ Duração padrão das aulas:</label>
            <div style="display:flex;align-items:center;gap:6px;">
                <input type="number" id="slotDurationInput" value="${dur}" min="10" max="120" step="5"
                    onchange="onDurationChange()"
                    style="width:70px;padding:5px 8px;border:1px solid #86efac;border-radius:6px;font-size:15px;font-weight:600;color:#166534;text-align:center;">
                <span style="color:#166534;font-weight:500;">minutos</span>
            </div>
            <span style="color:#15803d;font-size:12px;">Ao digitar o início de uma aula, o fim é preenchido automaticamente. Ao inserir uma aula, os horários seguintes são recalculados.</span>
        </div>`;

    html += insertBtn(0);

    pendingTimeSlots.forEach((slot, index) => {
        const [start, end] = slot.time.split(' - ');

        if (slot.isInterval) {
            html += `
                <div style="background:#e0e7ff;border-left:4px solid #4338ca;padding:10px 15px;border-radius:8px;margin:2px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <strong>${slot.label}</strong>
                        <span style="background:#4338ca;color:#fff;padding:2px 10px;border-radius:10px;font-size:12px;">Intervalo</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <input type="time" id="time-start-${index}" value="${convertToTimeInput(start)}"
                            onchange="onEndTimeChange(${index})"
                            style="padding:4px;border:1px solid #ccc;border-radius:4px;">
                        <span>até</span>
                        <input type="time" id="time-end-${index}" value="${convertToTimeInput(end)}"
                            onchange="onEndTimeChange(${index})"
                            style="padding:4px;border:1px solid #ccc;border-radius:4px;">
                    </div>
                </div>`;
        } else {
            html += `
                <div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid #2563eb;padding:10px 15px;border-radius:8px;margin:2px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <strong style="color:#1e40af;">${slot.label}</strong>
                        <button onclick="removeSlotAt(${index})" title="Remover"
                            style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:2px 10px;cursor:pointer;font-size:12px;">
                            🗑️ Remover
                        </button>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <input type="time" id="time-start-${index}" value="${convertToTimeInput(start)}"
                            onchange="onStartTimeChange(${index})"
                            style="padding:4px;border:1px solid #ccc;border-radius:4px;">
                        <span>até</span>
                        <input type="time" id="time-end-${index}" value="${convertToTimeInput(end)}"
                            onchange="onEndTimeChange(${index})"
                            style="padding:4px;border:1px solid #ccc;border-radius:4px;">
                    </div>
                </div>`;
        }

        html += insertBtn(index + 1);
    });

    container.innerHTML = html;
}

function collectPendingInputValues() {
    if (!pendingTimeSlots) return;
    pendingTimeSlots.forEach((slot, index) => {
        const startInput = document.getElementById(`time-start-${index}`);
        const endInput = document.getElementById(`time-end-${index}`);
        if (startInput && endInput) {
            slot.time = `${startInput.value} - ${endInput.value}`;
        }
    });
}

// Recalcula start+end de todos os slots a partir de startIndex,
// usando o fim do slot anterior como novo início e preservando durações.
function cascadeTimesFrom(startIndex) {
    if (!pendingTimeSlots || startIndex <= 0 || startIndex >= pendingTimeSlots.length) return;
    const duration = getCurrentSlotDuration();

    for (let i = startIndex; i < pendingTimeSlots.length; i++) {
        const prevEnd = pendingTimeSlots[i - 1].time.split(' - ')[1].trim();
        const prevEndMins = timeStringToMinutes(prevEnd);
        const slot = pendingTimeSlots[i];

        let slotMins;
        if (slot.isInterval) {
            const [cs, ce] = slot.time.split(' - ');
            slotMins = timeStringToMinutes(ce.trim()) - timeStringToMinutes(cs.trim());
            if (slotMins <= 0) slotMins = 20;
        } else {
            slotMins = duration;
        }

        slot.time = `${minutesToTimeString(prevEndMins)} - ${minutesToTimeString(prevEndMins + slotMins)}`;
    }
}

// Atualiza apenas os inputs DOM afetados pela cascata (sem re-renderizar o HTML todo).
function updateTimesInDOM(fromIndex) {
    if (!pendingTimeSlots) return;
    for (let i = fromIndex; i < pendingTimeSlots.length; i++) {
        const [start, end] = pendingTimeSlots[i].time.split(' - ');
        const si = document.getElementById(`time-start-${i}`);
        const ei = document.getElementById(`time-end-${i}`);
        if (si) si.value = start.trim();
        if (ei) ei.value = end.trim();
    }
}

function onDurationChange() {
    // Reaplica a duração padrão a todos os slots a partir do primeiro,
    // mantendo o início do primeiro slot.
    collectPendingInputValues();
    cascadeTimesFrom(1);
    updateTimesInDOM(1);
}

function onStartTimeChange(index) {
    if (!pendingTimeSlots) return;
    const startInput = document.getElementById(`time-start-${index}`);
    if (!startInput || !startInput.value) return;

    const duration = getCurrentSlotDuration();
    const startMins = timeStringToMinutes(startInput.value);
    const endTime = minutesToTimeString(startMins + duration);

    // Atualiza o fim desta aula diretamente no DOM e em pendingTimeSlots
    const endInput = document.getElementById(`time-end-${index}`);
    if (endInput) endInput.value = endTime;
    pendingTimeSlots[index].time = `${startInput.value} - ${endTime}`;

    // Coleta os outros inputs sem sobrescrever o que acabamos de definir
    pendingTimeSlots.forEach((slot, i) => {
        if (i === index) return;
        const si = document.getElementById(`time-start-${i}`);
        const ei = document.getElementById(`time-end-${i}`);
        if (si && ei) slot.time = `${si.value} - ${ei.value}`;
    });

    cascadeTimesFrom(index + 1);
    updateTimesInDOM(index + 1);
}

function onEndTimeChange(index) {
    if (!pendingTimeSlots) return;
    collectPendingInputValues();
    cascadeTimesFrom(index + 1);
    updateTimesInDOM(index + 1);
}

function addSlotAt(position) {
    collectPendingInputValues();

    const duration = getCurrentSlotDuration();
    const prevSlot = position > 0 ? pendingTimeSlots[position - 1] : null;
    let startTime = '07:20';
    if (prevSlot) {
        startTime = prevSlot.time.split(' - ')[1].trim();
    }
    const startMins = timeStringToMinutes(startTime);
    const endTime = minutesToTimeString(startMins + duration);

    const existingAulas = pendingTimeSlots.filter(s => !s.isInterval);
    let maxNum = existingAulas.length;
    existingAulas.forEach(s => {
        const match = s.label.match(/AULA (\d+)/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
    });

    const newSlot = {
        id: 'custom_' + Date.now(),
        label: 'AULA ' + (maxNum + 1),
        time: `${startTime} - ${endTime}`,
        isInterval: false
    };

    pendingTimeSlots.splice(position, 0, newSlot);
    cascadeTimesFrom(position + 1);
    renderTimeSlotsConfig();
}

function removeSlotAt(index) {
    collectPendingInputValues();
    const slot = pendingTimeSlots[index];

    if (slot.isInterval) return;

    const hasLessons = days.some(day =>
        schedule[day] && schedule[day][slot.id] &&
        classes.some(cls => schedule[day][slot.id][cls] !== null)
    );

    if (hasLessons) {
        if (!confirm(`⚠️ O horário "${slot.label}" possui aulas atribuídas.\n\nRemovê-lo apagará essas aulas da grade. Deseja continuar?`)) return;
    }

    pendingTimeSlots.splice(index, 1);
    renderTimeSlotsConfig();
}

function convertToTimeInput(displayTime) {
    return displayTime.trim();
}

function convertToDisplayTime(inputTime) {
    return inputTime;
}

function saveTimeSlotsConfig() {
    try {
        collectPendingInputValues();

        const existingIds = new Set(timeSlots.filter(s => !s.isInterval).map(s => s.id));
        const pendingIds = new Set(pendingTimeSlots.filter(s => !s.isInterval).map(s => s.id));

        const removedIds = [...existingIds].filter(id => !pendingIds.has(id));
        const addedSlots = pendingTimeSlots.filter(s => !s.isInterval && !existingIds.has(s.id));

        const slotsWithLessons = removedIds.filter(id =>
            days.some(day =>
                schedule[day] && schedule[day][id] &&
                classes.some(cls => schedule[day][id][cls] !== null)
            )
        );

        if (slotsWithLessons.length > 0) {
            const names = slotsWithLessons.map(id => {
                const s = timeSlots.find(t => t.id === id);
                return s ? s.label : id;
            }).join(', ');
            if (!confirm(`⚠️ Os horários removidos (${names}) contêm aulas atribuídas que serão perdidas.\n\nDeseja continuar?`)) return;
        }

        // Salvar duração padrão
        slotDuration = getCurrentSlotDuration();

        timeSlots.length = 0;
        timeSlots.push(...pendingTimeSlots);

        addedSlots.forEach(slot => {
            days.forEach(day => {
                if (!schedule[day]) schedule[day] = {};
                schedule[day][slot.id] = {};
                classes.forEach(cls => { schedule[day][slot.id][cls] = null; });
            });
        });

        removedIds.forEach(id => {
            days.forEach(day => {
                if (schedule[day]) delete schedule[day][id];
            });
        });

        saveToStorage();
        document.getElementById('timeSlotsModal').classList.remove('active');
        renderSchedule();
        showAlert('✅ Horários salvos com sucesso!', 'success');
        pendingTimeSlots = null;
    } catch (error) {
        console.error('Erro ao salvar horários:', error);
        showAlert('❌ Erro ao salvar horários: ' + error.message, 'error');
    }
}

function resetTimeSlotsConfig() {
    if (confirm('⚠️ Tem certeza que deseja restaurar os horários padrão?\n\nTodas as suas configurações personalizadas de horários serão perdidas.')) {
        pendingTimeSlots = JSON.parse(JSON.stringify(defaultTimeSlots));
        renderTimeSlotsConfig();
        showAlert('✅ Horários padrão restaurados. Clique em Salvar para confirmar.', 'success');
    }
}

// ==================== FUNÇÕES AUXILIARES ====================

function updateStats() {
    // Atualizar estatísticas da aplicação
    const totalLessons = countTotalLessons();
    const conflicts = countAllConflicts();

    // Atualizar elementos da UI se existirem
    const statsElement = document.getElementById('stats-lessons');
    if (statsElement) {
        statsElement.textContent = totalLessons;
    }

    const conflictsElement = document.getElementById('stats-conflicts');
    if (conflictsElement) {
        conflictsElement.textContent = conflicts;
        conflictsElement.style.color = conflicts > 0 ? '#ef4444' : '#22c55e';
    }

    const teachersElement = document.getElementById('stats-teachers');
    if (teachersElement) {
        teachersElement.textContent = teachers.length;
    }
}

function countTotalLessons() {
    let total = 0;
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                classes.forEach(cls => {
                    if (schedule[day]?.[slot.id]?.[cls]) {
                        total++;
                    }
                });
            }
        });
    });
    return total;
}

function showAlert(message, type = 'info') {
    // Criar elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
        font-size: 14px;
        font-weight: 500;
    `;

    // Definir cores baseadas no tipo
    const colors = {
        'success': { bg: '#22c55e', color: 'white' },
        'error': { bg: '#ef4444', color: 'white' },
        'warning': { bg: '#f59e0b', color: 'white' },
        'info': { bg: '#3b82f6', color: 'white' }
    };

    const style = colors[type] || colors.info;
    alertDiv.style.backgroundColor = style.bg;
    alertDiv.style.color = style.color;

    // Converter quebras de linha em <br>
    const formattedMessage = message.replace(/\n/g, '<br>');
    alertDiv.innerHTML = formattedMessage;

    // Adicionar ao body
    document.body.appendChild(alertDiv);

    // Remover após 3 segundos
    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 300);
    }, 3000);
}

// Adicionar animações CSS se não existirem
if (!document.getElementById('alert-animations')) {
    const style = document.createElement('style');
    style.id = 'alert-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ==================== INICIAR ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSchedule);
} else {
    initSchedule();
}
