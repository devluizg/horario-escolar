// ==================== GERENCIAMENTO DE PROFESSORES ====================
// teachers.js - Todas as funções relacionadas a professores, carga horária e disciplinas

// ==================== VARIÁVEIS GLOBAIS PARA O MODAL ====================

let workloadConfigs = []; // Array de configurações de carga horária
let configIdCounter = 0;  // Contador para IDs únicos

// ==================== RESTRIÇÕES DE HORÁRIO ====================
// Estrutura: { teacherIdx: [{ type: 'day'|'time'|'dayTime'|'consecutive', ... }] }
// teacherRestrictions agora é declarado em config.js

// ==================== CÁLCULO DE CARGA HORÁRIA ====================

function calculatePrincipalHours(teacherIdx) {
    const teacher = teachers[teacherIdx];
    if (!teacher) return 0;

    // Se tem classHours (novo formato com horas por turma), usar ele
    if (teacher.classHours && Object.keys(teacher.classHours).length > 0) {
        return Object.values(teacher.classHours).reduce((a, b) => a + b, 0);
    }

    // Fallback para formato antigo
    const hoursPerClass = teacher.hoursPerClass || 2;
    const teacherClasses = teacher.classes || classes;

    return hoursPerClass * teacherClasses.length;
}

function calculateExtraHours(teacherIdx) {
    const specificList = teacherSpecificSubjects[teacherIdx] || [];
    let totalExtra = 0;

    specificList.forEach(item => {
        if (item.class === 'all') {
            totalExtra += (item.hoursPerWeek || 1) * classes.length;
        } else {
            totalExtra += (item.hoursPerWeek || 1);
        }
    });

    return totalExtra;
}

function calculateTotalWorkload(teacherIdx) {
    const principalHours = calculatePrincipalHours(teacherIdx);
    const extraHours = calculateExtraHours(teacherIdx);

    return {
        principalHours: principalHours,
        extraHours: extraHours,
        totalHours: principalHours + extraHours
    };
}

function updateWorkloadSummary(teacherIdx) {
    const summaryDiv = document.getElementById('teacherWorkloadSummary');

    if (teacherIdx === '' || teacherIdx === null || teacherIdx === undefined) {
        summaryDiv.style.display = 'none';
        return;
    }

    const teacher = teachers[teacherIdx];
    if (!teacher) {
        summaryDiv.style.display = 'none';
        return;
    }

    const workload = calculateTotalWorkload(teacherIdx);

    document.getElementById('summaryTeacherName').textContent = teacher.name;
    document.getElementById('summaryTeacherSubject').textContent = `📚 ${teacher.subject} (${(teacher.classes || classes).length} turmas)`;
    document.getElementById('summaryPrincipalHours').textContent = workload.principalHours;
    document.getElementById('summaryExtraHours').textContent = workload.extraHours;
    document.getElementById('summaryTotalHours').textContent = workload.totalHours;

    summaryDiv.style.display = 'block';
}

// ==================== DISCIPLINAS ESPECÍFICAS ====================

function openSpecificSubjectsModal() {
    const teacherSelect = document.getElementById('specificTeacher');
    teacherSelect.innerHTML = '<option value="">Selecione o professor...</option>';

    teachers.forEach((teacher, idx) => {
        const workload = calculateTotalWorkload(idx);
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = `${teacher.name} (${teacher.subject}) - ${workload.totalHours}h/sem`;
        teacherSelect.appendChild(option);
    });

    document.getElementById('specificSubjectsList').innerHTML =
        '<p style="text-align: center; color: #999;">Selecione um professor para ver suas disciplinas específicas</p>';

    document.getElementById('teacherWorkloadSummary').style.display = 'none';
    document.getElementById('specificSubjectsModal').classList.add('active');
}

function loadTeacherSpecificSubjects() {
    const teacherIdx = document.getElementById('specificTeacher').value;
    const container = document.getElementById('specificSubjectsList');

    updateWorkloadSummary(teacherIdx);

    if (teacherIdx === '') {
        container.innerHTML = '<p style="text-align: center; color: #999;">Selecione um professor para ver suas disciplinas específicas</p>';
        return;
    }

    const teacher = teachers[teacherIdx];
    const specificList = teacherSpecificSubjects[teacherIdx] || [];
    const principalHours = calculatePrincipalHours(teacherIdx);

    // Mostrar configurações de carga horária da disciplina principal
    let html = `
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
            <h4 style="margin: 0 0 10px 0; color: #1e40af;">⭐ Disciplina Principal: ${teacher.subject}</h4>
    `;

    // Se tem classHours, mostrar agrupado
    if (teacher.classHours && Object.keys(teacher.classHours).length > 0) {
        const grouped = {};
        Object.entries(teacher.classHours).forEach(([cls, hours]) => {
            if (!grouped[hours]) grouped[hours] = [];
            grouped[hours].push(cls);
        });

        html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
        Object.entries(grouped).sort((a, b) => b[0] - a[0]).forEach(([hours, classList]) => {
            const subtotal = parseInt(hours) * classList.length;
            html += `
                <div style="background: white; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${hours} aula(s)/semana:</strong> 
                        <span style="color: #666;">${classList.join(', ')}</span>
                    </div>
                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 15px; font-size: 13px;">
                        ${classList.length} turmas = ${subtotal}h
                    </span>
                </div>
            `;
        });
        html += `</div>`;
    } else {
        html += `
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div><strong>Aulas/semana por turma:</strong> ${teacher.hoursPerClass || 2}</div>
                <div><strong>Turmas:</strong> ${(teacher.classes || classes).length}</div>
            </div>
        `;
    }

    html += `
            <div style="margin-top: 10px;"><strong>Total:</strong> <span style="background: #3b82f6; color: white; padding: 2px 10px; border-radius: 10px;">${principalHours} aulas</span></div>
            <button class="btn btn-secondary btn-sm" style="margin-top: 10px; padding: 6px 12px; font-size: 12px;" data-edit-workload="${teacherIdx}">
                ⚙️ Editar Carga Horária Principal
            </button>
        </div>
    `;

    if (specificList.length === 0) {
        html += `
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <p style="color: #666; margin-bottom: 10px;">📭 ${teacher.name} não possui disciplinas específicas extras cadastradas.</p>
                <p style="color: #999; font-size: 14px;">Use o formulário acima para adicionar disciplinas como Projeto de Vida, Tutoria, Eletiva, PPA, etc.</p>
            </div>
        `;
        container.innerHTML = html;

        container.querySelector('[data-edit-workload]').addEventListener('click', function () {
            openEditWorkloadModal(parseInt(this.dataset.editWorkload));
        });
        return;
    }

    let totalExtraHours = 0;

    html += `
        <h4 style="margin: 15px 0 10px 0; color: #667eea;">📌 Itinerários Formativos (Extras):</h4>
        <table class="specific-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #667eea; color: white;">
                    <th style="padding: 12px; text-align: left;">Disciplina</th>
                    <th style="padding: 12px; text-align: left;">Turma(s)</th>
                    <th style="padding: 12px; text-align: center;">Aulas/Semana</th>
                    <th style="padding: 12px; text-align: center;">Total Aulas</th>
                    <th style="padding: 12px; text-align: center; width: 80px;">Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    specificList.forEach((item, idx) => {
        let itemTotal = 0;
        if (item.class === 'all') {
            itemTotal = (item.hoursPerWeek || 1) * classes.length;
        } else {
            itemTotal = (item.hoursPerWeek || 1);
        }
        totalExtraHours += itemTotal;

        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px;">
                    <span style="background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                        ${item.subject}
                    </span>
                </td>
                <td style="padding: 12px;">
                    ${item.class === 'all' ?
                `<span style="color: #059669;">✓ Todas (${classes.length})</span>` :
                `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 4px;">Turma ${item.class}</span>`
            }
                </td>
                <td style="padding: 12px; text-align: center;">
                    <strong>${item.hoursPerWeek || 1}</strong>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 4px; font-weight: bold;">
                        ${itemTotal}
                    </span>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <button class="btn btn-danger btn-sm" style="padding: 6px 10px; font-size: 11px;" data-remove-specific="${teacherIdx}-${idx}">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
            <tfoot>
                <tr style="background: #f0f9ff; font-weight: bold;">
                    <td colspan="3" style="padding: 12px; text-align: right;">Total de Aulas Extras:</td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="background: #3b82f6; color: white; padding: 6px 14px; border-radius: 6px; font-size: 16px;">
                            ${totalExtraHours}
                        </span>
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    `;

    container.innerHTML = html;

    container.querySelector('[data-edit-workload]').addEventListener('click', function () {
        openEditWorkloadModal(parseInt(this.dataset.editWorkload));
    });

    container.querySelectorAll('[data-remove-specific]').forEach(btn => {
        btn.addEventListener('click', function () {
            const [tIdx, iIdx] = this.dataset.removeSpecific.split('-').map(Number);
            removeSpecificSubject(tIdx, iIdx);
        });
    });
}

function addSpecificSubject() {
    const teacherIdx = document.getElementById('specificTeacher').value;
    const subject = document.getElementById('specificSubject').value;
    const classValue = document.getElementById('specificClass').value;
    const hoursPerWeek = parseInt(document.getElementById('specificHours').value) || 1;

    if (teacherIdx === '') {
        showAlert('Selecione um professor!', 'warning');
        return;
    }

    if (subject === '') {
        showAlert('Selecione uma disciplina específica!', 'warning');
        return;
    }

    if (hoursPerWeek < 1 || hoursPerWeek > 20) {
        showAlert('A quantidade de aulas deve ser entre 1 e 20!', 'warning');
        return;
    }

    if (!teacherSpecificSubjects[teacherIdx]) {
        teacherSpecificSubjects[teacherIdx] = [];
    }

    const exists = teacherSpecificSubjects[teacherIdx].some(
        item => item.subject === subject && item.class === classValue
    );

    if (exists) {
        showAlert('Esta disciplina já está cadastrada para esta turma!', 'warning');
        return;
    }

    teacherSpecificSubjects[teacherIdx].push({
        subject: subject,
        class: classValue,
        hoursPerWeek: hoursPerWeek
    });

    loadTeacherSpecificSubjects();
    saveToStorage();
    renderTeachersList();

    const teacher = teachers[teacherIdx];
    const classText = classValue === 'all' ? 'todas as turmas' : `turma ${classValue}`;
    showAlert(`✅ ${subject} (${hoursPerWeek} aula${hoursPerWeek > 1 ? 's' : ''}/semana) adicionado para ${teacher.name} (${classText})`, 'success');

    document.getElementById('specificSubject').value = '';
    document.getElementById('specificClass').value = 'all';
    document.getElementById('specificHours').value = '1';
}

function removeSpecificSubject(teacherIdx, itemIdx) {
    if (!teacherSpecificSubjects[teacherIdx]) return;

    const item = teacherSpecificSubjects[teacherIdx][itemIdx];
    if (confirm(`Remover ${item.subject} do professor?`)) {
        teacherSpecificSubjects[teacherIdx].splice(itemIdx, 1);
        loadTeacherSpecificSubjects();
        saveToStorage();
        renderTeachersList();
        showAlert('Disciplina específica removida!', 'success');
    }
}

// ==================== EDITAR CARGA HORÁRIA PRINCIPAL ====================

function openEditWorkloadModal(teacherIdx) {
    editingTeacherIdx = teacherIdx;
    const teacher = teachers[teacherIdx];

    // Resetar configurações e popular com dados existentes
    workloadConfigs = [];
    configIdCounter = 0;

    if (teacher.classHours && Object.keys(teacher.classHours).length > 0) {
        // Agrupar turmas por quantidade de horas
        const grouped = {};
        Object.entries(teacher.classHours).forEach(([cls, hours]) => {
            if (!grouped[hours]) grouped[hours] = [];
            grouped[hours].push(cls);
        });

        // Criar uma configuração para cada grupo
        Object.entries(grouped).forEach(([hours, classList]) => {
            workloadConfigs.push({
                id: configIdCounter++,
                hoursPerClass: parseInt(hours),
                classes: classList
            });
        });
    } else {
        // Formato antigo - criar uma única configuração
        workloadConfigs.push({
            id: configIdCounter++,
            hoursPerClass: teacher.hoursPerClass || 2,
            classes: teacher.classes || [...classes]
        });
    }

    document.getElementById('editWorkloadContent').innerHTML = `
        <div style="padding: 10px 0;">
            <div class="form-group">
                <label><strong>Professor:</strong> ${teacher.name}</label>
            </div>
            <div class="form-group">
                <label><strong>Disciplina:</strong> ${teacher.subject}</label>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">
            
            <h4 style="color: #667eea; margin-bottom: 15px;">📚 Configurações de Carga Horária</h4>
            
            <div id="editWorkloadConfigsContainer"></div>
            
            <button type="button" class="btn btn-secondary" onclick="addEditWorkloadConfig()" 
                    style="width: 100%; margin-top: 10px; padding: 10px;">
                ➕ Adicionar outra configuração
            </button>
            
            <div id="editTotalPreview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                 color: white; padding: 15px; border-radius: 10px; margin-top: 15px; text-align: center;">
                <div style="font-size: 13px; opacity: 0.9;">Carga Horária Total:</div>
                <div style="font-size: 28px; font-weight: bold;" id="editTotalHours">0h</div>
            </div>
        </div>
    `;

    renderEditWorkloadConfigs();
    document.getElementById('editWorkloadModal').classList.add('active');
}

function addEditWorkloadConfig() {
    workloadConfigs.push({
        id: configIdCounter++,
        hoursPerClass: 1,
        classes: []
    });
    renderEditWorkloadConfigs();
}

function removeEditWorkloadConfig(configId) {
    if (workloadConfigs.length <= 1) {
        showAlert('Você precisa ter pelo menos uma configuração!', 'warning');
        return;
    }
    workloadConfigs = workloadConfigs.filter(c => c.id !== configId);
    renderEditWorkloadConfigs();
}

function renderEditWorkloadConfigs() {
    const container = document.getElementById('editWorkloadConfigsContainer');
    let html = '';

    workloadConfigs.forEach((config, index) => {
        const subtotal = config.hoursPerClass * config.classes.length;

        html += `
            <div class="workload-config-card" style="background: #f8f9fa; border: 2px solid #e0e0e0; 
                 border-radius: 10px; padding: 15px; margin-bottom: 15px; position: relative;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: bold; color: #667eea;">📋 Configuração ${index + 1}</span>
                    ${workloadConfigs.length > 1 ? `
                        <button type="button" class="btn btn-danger btn-sm" 
                                onclick="removeEditWorkloadConfig(${config.id})"
                                style="padding: 5px 10px; font-size: 12px;">🗑️</button>
                    ` : ''}
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: #555; display: block; margin-bottom: 5px;">
                        Aulas por semana:
                    </label>
                    <input type="number" min="1" max="10" value="${config.hoursPerClass}"
                           onchange="updateEditConfigHours(${config.id}, this.value)"
                           style="width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; 
                                  font-size: 16px; font-weight: bold; text-align: center;">
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: #555; display: block; margin-bottom: 8px;">
                        Turmas:
                    </label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${classes.map(cls => {
            const isSelected = config.classes.includes(cls);
            const isUsedElsewhere = isClassUsedInOtherConfig(cls, config.id);
            return `
                                <label style="display: flex; align-items: center; gap: 5px; padding: 6px 10px; 
                                              background: ${isSelected ? '#e0e7ff' : '#fff'}; 
                                              border: 2px solid ${isSelected ? '#667eea' : '#ddd'}; 
                                              border-radius: 6px; cursor: ${isUsedElsewhere ? 'not-allowed' : 'pointer'}; 
                                              opacity: ${isUsedElsewhere ? '0.4' : '1'};">
                                    <input type="checkbox" 
                                           data-config-id="${config.id}"
                                           value="${cls}" 
                                           ${isSelected ? 'checked' : ''} 
                                           ${isUsedElsewhere ? 'disabled' : ''}
                                           onchange="updateEditConfigClasses(${config.id})">
                                    <span>${cls}</span>
                                </label>
                            `;
        }).join('')}
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                    <button type="button" onclick="selectEditClassesByYear(${config.id}, '1')"
                            style="padding: 4px 8px; font-size: 11px; background: #fef3c7; border: 1px solid #f59e0b; 
                                   color: #92400e; border-radius: 4px; cursor: pointer;">1º Anos</button>
                    <button type="button" onclick="selectEditClassesByYear(${config.id}, '2')"
                            style="padding: 4px 8px; font-size: 11px; background: #dbeafe; border: 1px solid #3b82f6; 
                                   color: #1e40af; border-radius: 4px; cursor: pointer;">2º Anos</button>
                    <button type="button" onclick="selectEditClassesByYear(${config.id}, '3')"
                            style="padding: 4px 8px; font-size: 11px; background: #dcfce7; border: 1px solid #22c55e; 
                                   color: #166534; border-radius: 4px; cursor: pointer;">3º Anos</button>
                    <button type="button" onclick="clearEditClassesForConfig(${config.id})"
                            style="padding: 4px 8px; font-size: 11px; background: #fee2e2; border: 1px solid #ef4444; 
                                   color: #991b1b; border-radius: 4px; cursor: pointer;">Limpar</button>
                </div>
                
                <div style="background: ${subtotal > 0 ? '#e0e7ff' : '#f0f0f0'}; padding: 8px 12px; border-radius: 6px; 
                            display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #4338ca; font-size: 13px;">${config.classes.length} turma(s) × ${config.hoursPerClass} aula(s)</span>
                    <span style="font-size: 16px; font-weight: bold; color: #4338ca;">= ${subtotal}h</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    updateEditTotalPreview();
}

function updateEditConfigHours(configId, value) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (config) {
        config.hoursPerClass = parseInt(value) || 1;
        renderEditWorkloadConfigs();
    }
}

function updateEditConfigClasses(configId) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (!config) return;

    const checkboxes = document.querySelectorAll(`input[data-config-id="${configId}"]:checked`);
    config.classes = Array.from(checkboxes).map(cb => cb.value);

    renderEditWorkloadConfigs();
}

function selectEditClassesByYear(configId, year) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (!config) return;

    const yearClasses = classes.filter(cls => cls.startsWith(year));
    const availableClasses = yearClasses.filter(cls => !isClassUsedInOtherConfig(cls, configId));

    availableClasses.forEach(cls => {
        if (!config.classes.includes(cls)) {
            config.classes.push(cls);
        }
    });

    renderEditWorkloadConfigs();
}

function clearEditClassesForConfig(configId) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (config) {
        config.classes = [];
        renderEditWorkloadConfigs();
    }
}

function updateEditTotalPreview() {
    let total = 0;
    workloadConfigs.forEach(config => {
        total += config.hoursPerClass * config.classes.length;
    });
    document.getElementById('editTotalHours').textContent = total + 'h';
}

function isClassUsedInOtherConfig(cls, currentConfigId) {
    return workloadConfigs.some(config =>
        config.id !== currentConfigId && config.classes.includes(cls)
    );
}

function saveWorkloadEdit() {
    if (editingTeacherIdx === null) return;

    // Validar que tem pelo menos uma turma selecionada
    const allClasses = [];
    const classHours = {};

    workloadConfigs.forEach(config => {
        config.classes.forEach(cls => {
            if (!allClasses.includes(cls)) {
                allClasses.push(cls);
                classHours[cls] = config.hoursPerClass;
            }
        });
    });

    if (allClasses.length === 0) {
        showAlert('Selecione pelo menos uma turma!', 'warning');
        return;
    }

    // Atualizar professor com novo formato
    teachers[editingTeacherIdx].classes = allClasses;
    teachers[editingTeacherIdx].classHours = classHours;

    // Calcular média para compatibilidade
    const totalHours = Object.values(classHours).reduce((a, b) => a + b, 0);
    teachers[editingTeacherIdx].hoursPerClass = allClasses.length > 0 ?
        Math.round(totalHours / allClasses.length) : 2;

    closeModal('editWorkloadModal');
    loadTeacherSpecificSubjects();
    renderTeachersList();
    saveToStorage();
    showAlert(`Carga horária atualizada! Total: ${totalHours}h/semana`, 'success');
    editingTeacherIdx = null;
}

function getTeacherSubjectsForClass(teacherIdx, targetClass) {
    const teacher = teachers[teacherIdx];
    if (!teacher) return [];

    let subjects = [];

    const teacherClasses = teacher.classes || classes;
    if (teacherClasses.includes(targetClass)) {
        subjects.push({
            subject: teacher.subject,
            isPrincipal: true,
            forClass: 'all'
        });
    }

    const specificList = teacherSpecificSubjects[teacherIdx] || [];
    specificList.forEach(item => {
        if (item.class === 'all' || item.class === targetClass) {
            if (!subjects.some(s => s.subject === item.subject)) {
                subjects.push({
                    subject: item.subject,
                    isPrincipal: false,
                    forClass: item.class
                });
            }
        }
    });

    return subjects;
}

function countTeacherSpecificSubjects(teacherIdx) {
    return (teacherSpecificSubjects[teacherIdx] || []).length;
}

// ==================== CONTAGEM DE AULAS ATRIBUÍDAS ====================

function countAssignedLessons(teacherIdx) {
    let count = 0;
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                classes.forEach(cls => {
                    const lesson = schedule[day]?.[slot.id]?.[cls];
                    if (lesson && lesson.teacherIdx === teacherIdx) {
                        count++;
                    }
                });
            }
        });
    });
    return count;
}

function getMissingAssignments(teacherIdx) {
    const teacher = teachers[teacherIdx];
    if (!teacher) return [];

    const missing = [];
    const teacherClasses = teacher.classes || classes;

    // 1. Disciplinas Regulares
    teacherClasses.forEach(cls => {
        let expected = 2;
        if (teacher.classHours && teacher.classHours[cls] !== undefined) {
            expected = teacher.classHours[cls];
        } else if (teacher.hoursPerClass) {
            expected = teacher.hoursPerClass;
        }

        // Contar aulas já atribuídas para esta turma e matéria
        let actual = 0;
        days.forEach(day => {
            timeSlots.forEach(slot => {
                if (!slot.isInterval) {
                    const lesson = schedule[day]?.[slot.id]?.[cls];
                    if (lesson && lesson.teacherIdx === teacherIdx && lesson.subject === teacher.subject) {
                        actual++;
                    }
                }
            });
        });

        if (actual < expected) {
            missing.push({
                class: cls,
                subject: teacher.subject,
                count: expected - actual,
                type: 'regular'
            });
        }
    });

    // 2. Disciplinas Específicas
    const specificSubjects = teacherSpecificSubjects[teacherIdx] || [];
    specificSubjects.forEach(item => {
        const expected = item.hoursPerWeek || 1;
        let actual = 0;

        days.forEach(day => {
            timeSlots.forEach(slot => {
                if (!slot.isInterval) {
                    const lesson = schedule[day]?.[slot.id]?.[item.class];
                    if (lesson && lesson.teacherIdx === teacherIdx && lesson.subject === item.subject) {
                        actual++;
                    }
                }
            });
        });

        if (actual < expected) {
            missing.push({
                class: item.class,
                subject: item.subject,
                count: expected - actual,
                type: 'specific'
            });
        }
    });

    return missing;
}

// ==================== LISTA E CRUD DE PROFESSORES ====================

function renderTeachersList(filter = '') {
    const container = document.getElementById('teachersList');
    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.subject.toLowerCase().includes(filter.toLowerCase())
    );

    document.getElementById('teacherCount').textContent = teachers.length;

    if (filteredTeachers.length === 0) {
        container.innerHTML = `
            <div class="empty-teachers">
                ${teachers.length === 0
                ? '📭 Nenhum professor cadastrado.<br><br>Clique em "Cadastrar Novo Professor" para começar.'
                : '🔍 Nenhum professor encontrado.'}
            </div>`;
        return;
    }

    let html = '';
    filteredTeachers.forEach((teacher) => {
        const realIdx = teachers.indexOf(teacher);
        const colors = getTeacherColor(teacher);
        const workload = calculateTotalWorkload(realIdx);
        const specificCount = countTeacherSpecificSubjects(realIdx);
        const teacherClasses = teacher.classes || classes;

        // Verificar se tem múltiplas configurações
        let configInfo = '';
        if (teacher.classHours && Object.keys(teacher.classHours).length > 0) {
            const grouped = {};
            Object.entries(teacher.classHours).forEach(([cls, hours]) => {
                if (!grouped[hours]) grouped[hours] = 0;
                grouped[hours]++;
            });
            const configParts = Object.entries(grouped)
                .sort((a, b) => b[0] - a[0])
                .map(([hours, count]) => `${hours}h×${count}`)
                .join(' + ');
            configInfo = configParts;
        } else {
            configInfo = `${teacher.hoursPerClass || 2} aulas × ${teacherClasses.length} turmas`;
        }

        const assignedLessons = countAssignedLessons(realIdx);
        const progressColor = assignedLessons > workload.totalHours ? '#ef4444' :
            (assignedLessons === workload.totalHours ? '#22c55e' : '#3b82f6');

        html += `
            <div class="teacher-item" 
                 style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%); cursor: pointer; position: relative;"
                 draggable="true" 
                 data-teacher-idx="${realIdx}"
                 title="👆 Clique para ver detalhes | 🖐️ Arraste para a grade">
                <button class="delete-btn" data-delete-teacher="${realIdx}" 
                        style="position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; 
                               font-size: 14px; background: rgba(255,255,255,0.9); color: #dc2626; 
                               border: none; border-radius: 6px; cursor: pointer; z-index: 10;
                               display: flex; align-items: center; justify-content: center; padding: 0;"
                        title="Remover professor">🗑️</button>
                <div class="name" style="padding-right: 35px;">${teacher.name}</div>
                <div class="subject">${teacher.subject}</div>
                <div style="font-size: 10px; opacity: 0.9; margin-top: 3px;">
                    ${configInfo} = ${workload.principalHours}h
                </div>
                ${specificCount > 0 ? `
                    <div style="font-size: 10px; background: rgba(255,255,255,0.25); padding: 2px 8px; border-radius: 10px; margin-top: 4px; display: inline-block;">
                        +${specificCount} itinerários (+${workload.extraHours}h)
                    </div>
                ` : ''
            }
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 11px; opacity: 0.9;">Atribuídas:</span>
                        <span style="background: rgba(255,255,255,0.9); color: ${progressColor}; padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 11px;">
                            ${assignedLessons} / ${workload.totalHours}
                        </span>
                    </div>
                    <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.2); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${Math.min((assignedLessons / workload.totalHours) * 100, 100)}%; height: 100%; background: rgba(255,255,255,0.9);"></div>
                    </div>
                    ${(() => {
                const missing = getMissingAssignments(realIdx);
                if (missing.length > 0) {
                    const missingText = missing.map(m => `${m.class}(${m.count})`).join(', ');
                    return `
                                <div style="font-size: 10px; color: #ffe4e6; margin-top: 4px; line-height: 1.2; font-weight: 500;" 
                                     title="Aulas pendentes: ${missingText}">
                                     ⚠️ Pendente: ${missingText}
                                </div>
                            `;
                }
                return '';
            })()
            }
                </div>
                <div style="margin-top: 8px;">
                    <button class="itinerary-btn" data-itinerary-teacher="${realIdx}" 
                            style="width: 100%; padding: 8px 10px; font-size: 12px; background: rgba(255,255,255,0.9); 
                                   color: #6b21a8; border: none; border-radius: 6px; cursor: pointer; 
                                   font-weight: 600; transition: all 0.2s;"
                            title="Cadastrar Itinerários Formativos">
                        📚 Itinerários Formativos
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.teacher-item').forEach(item => {
        item.addEventListener('dragstart', handleTeacherDragStart);
        item.addEventListener('dragend', handleTeacherDragEnd);

        item.addEventListener('click', function (e) {
            if (e.target.closest('.delete-btn') || e.target.closest('.itinerary-btn')) return;
            const teacherIdx = parseInt(this.dataset.teacherIdx);
            showTeacherDetails(teacherIdx);
        });
    });

    container.querySelectorAll('[data-delete-teacher]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            deleteTeacher(parseInt(this.dataset.deleteTeacher));
        });
    });

    // Listener para botão de Itinerários Formativos
    container.querySelectorAll('[data-itinerary-teacher]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            const teacherIdx = parseInt(this.dataset.itineraryTeacher);
            openItineraryModalForTeacher(teacherIdx);
        });
    });
}

// Variável global para armazenar o professor atual no modal de itinerários
let currentItineraryTeacherIdx = null;

// Função para abrir modal de Itinerários Formativos para um professor específico
function openItineraryModalForTeacher(teacherIdx) {
    currentItineraryTeacherIdx = teacherIdx;
    const teacher = teachers[teacherIdx];

    if (!teacher) {
        showAlert('Professor não encontrado!', 'error');
        return;
    }

    const colors = getTeacherColor(teacher);
    const workload = calculateTotalWorkload(teacherIdx);
    const specificList = teacherSpecificSubjects[teacherIdx] || [];

    let html = `
            <!-- Cabeçalho do Professor -->
        <div style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%); 
                    color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 5px 0; font-size: 20px;">${teacher.name}</h3>
            <p style="margin: 0; opacity: 0.9;">📚 ${teacher.subject}</p>
            <div style="display: flex; gap: 20px; margin-top: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold;">${workload.principalHours}</div>
                    <div style="font-size: 11px; opacity: 0.9;">FGB</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold;">${workload.extraHours}</div>
                    <div style="font-size: 11px; opacity: 0.9;">Itinerários</div>
                </div>
                <div style="background: rgba(255,255,255,0.25); padding: 8px 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold;">${workload.totalHours}h</div>
                    <div style="font-size: 10px;">TOTAL</div>
                </div>
            </div>
        </div>
        
        <!-- Formulário de Adição -->
        <div style="background: #f8f9fc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 2px solid #e0e0e0;">
            <h4 style="margin: 0 0 15px 0; color: #667eea;">➕ Adicionar Itinerário Formativo</h4>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                    📚 Itinerário Formativo:
                </label>
                <select id="itinerarySubject" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    <option value="">Selecione o itinerário...</option>
                    ${specificSubjects.map(subj => `<option value="${subj}">${subj}</option>`).join('')}
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                    🏫 Selecione as turmas:
                </label>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                    ${classes.map(cls => `
                        <label style="display: flex; align-items: center; gap: 5px; padding: 10px 14px; 
                                      background: #fff; border: 2px solid #ddd; border-radius: 8px; 
                                      cursor: pointer; transition: all 0.2s;"
                               onmouseover="this.style.borderColor='#667eea'"
                               onmouseout="if(!this.querySelector('input').checked) this.style.borderColor='#ddd'">
                            <input type="checkbox" class="itinerary-class-checkbox" value="${cls}"
                                   onchange="updateItineraryClassStyle(this)">
                            <span style="font-weight: 500;">${cls}</span>
                        </label>
                    `).join('')}
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button type="button" onclick="selectItineraryClassesByYear('1')"
                            style="padding: 6px 12px; font-size: 12px; background: #fef3c7; border: 1px solid #f59e0b; 
                                   color: #92400e; border-radius: 6px; cursor: pointer;">1º Anos</button>
                    <button type="button" onclick="selectItineraryClassesByYear('2')"
                            style="padding: 6px 12px; font-size: 12px; background: #dbeafe; border: 1px solid #3b82f6; 
                                   color: #1e40af; border-radius: 6px; cursor: pointer;">2º Anos</button>
                    <button type="button" onclick="selectItineraryClassesByYear('3')"
                            style="padding: 6px 12px; font-size: 12px; background: #dcfce7; border: 1px solid #22c55e; 
                                   color: #166534; border-radius: 6px; cursor: pointer;">3º Anos</button>
                    <button type="button" onclick="selectAllItineraryClasses()"
                            style="padding: 6px 12px; font-size: 12px; background: #f3e8ff; border: 1px solid #a855f7; 
                                   color: #6b21a8; border-radius: 6px; cursor: pointer;">Todas</button>
                    <button type="button" onclick="clearItineraryClasses()"
                            style="padding: 6px 12px; font-size: 12px; background: #fee2e2; border: 1px solid #ef4444; 
                                   color: #991b1b; border-radius: 6px; cursor: pointer;">Limpar</button>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                    🕐 Aulas por semana (para cada turma selecionada):
                </label>
                <input type="number" id="itineraryHours" min="1" max="10" value="2" 
                       style="width: 100px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; 
                              font-size: 16px; font-weight: bold; text-align: center;">
            </div>
            
            <button type="button" onclick="addItineraryForTeacher()"
                    style="width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                           color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; 
                           cursor: pointer; transition: all 0.2s;">
                ➕ Adicionar Itinerário às Turmas Selecionadas
            </button>
        </div>
        
        <!-- Lista de Itinerários Cadastrados -->
            <div style="background: #fff; border-radius: 12px; padding: 20px; border: 2px solid #e0e0e0;">
                <h4 style="margin: 0 0 15px 0; color: #6b21a8;">📌 Itinerários Cadastrados</h4>

                ${specificList.length === 0 ? `
                <p style="text-align: center; color: #999; padding: 20px;">
                    Nenhum itinerário cadastrado ainda.<br>
                    Use o formulário acima para adicionar.
                </p>
            ` : `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #667eea; color: white;">
                            <th style="padding: 10px; text-align: left; border-radius: 8px 0 0 0;">Itinerário</th>
                            <th style="padding: 10px; text-align: center;">Turma</th>
                            <th style="padding: 10px; text-align: center;">Aulas/Sem</th>
                            <th style="padding: 10px; text-align: center; border-radius: 0 8px 0 0;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${specificList.map((item, idx) => `
                            <tr style="border-bottom: 1px solid #e0e0e0;">
                                <td style="padding: 10px;">${item.subject}</td>
                                <td style="padding: 10px; text-align: center;">
                                    <span style="background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 15px; font-weight: 600;">
                                        ${item.class === 'all' ? 'Todas' : item.class}
                                    </span>
                                </td>
                                <td style="padding: 10px; text-align: center; font-weight: bold;">${item.hoursPerWeek}</td>
                                <td style="padding: 10px; text-align: center;">
                                    <button onclick="removeItineraryItem(${teacherIdx}, ${idx})"
                                            style="background: #ef4444; color: white; border: none; padding: 6px 12px; 
                                                   border-radius: 6px; cursor: pointer; font-size: 12px;">
                                        🗑️ Remover
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f0f9ff; font-weight: bold;">
                            <td colspan="2" style="padding: 12px; text-align: right;">Total de Aulas Extras:</td>
                            <td style="padding: 12px; text-align: center;">
                                <span style="background: #667eea; color: white; padding: 6px 14px; border-radius: 6px; font-size: 16px;">
                                    ${workload.extraHours}h
                                </span>
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            `}
            </div>
        `;

    document.getElementById('teacherItineraryContent').innerHTML = html;
    document.getElementById('teacherItineraryModal').classList.add('active');
}

// Funções auxiliares para o modal de itinerários
function updateItineraryClassStyle(checkbox) {
    const label = checkbox.parentElement;
    if (checkbox.checked) {
        label.style.borderColor = '#667eea';
        label.style.background = '#e0e7ff';
    } else {
        label.style.borderColor = '#ddd';
        label.style.background = '#fff';
    }
}

function selectItineraryClassesByYear(year) {
    document.querySelectorAll('.itinerary-class-checkbox').forEach(cb => {
        if (cb.value.startsWith(year)) {
            cb.checked = true;
            updateItineraryClassStyle(cb);
        }
    });
}

function selectAllItineraryClasses() {
    document.querySelectorAll('.itinerary-class-checkbox').forEach(cb => {
        cb.checked = true;
        updateItineraryClassStyle(cb);
    });
}

function clearItineraryClasses() {
    document.querySelectorAll('.itinerary-class-checkbox').forEach(cb => {
        cb.checked = false;
        updateItineraryClassStyle(cb);
    });
}

function addItineraryForTeacher() {
    const subject = document.getElementById('itinerarySubject').value;
    const hours = parseInt(document.getElementById('itineraryHours').value) || 1;
    const selectedClasses = Array.from(document.querySelectorAll('.itinerary-class-checkbox:checked')).map(cb => cb.value);

    if (!subject) {
        showAlert('Selecione um itinerário formativo!', 'warning');
        return;
    }

    if (selectedClasses.length === 0) {
        showAlert('Selecione pelo menos uma turma!', 'warning');
        return;
    }

    if (!teacherSpecificSubjects[currentItineraryTeacherIdx]) {
        teacherSpecificSubjects[currentItineraryTeacherIdx] = [];
    }

    let added = 0;
    let skipped = 0;

    selectedClasses.forEach(cls => {
        const exists = teacherSpecificSubjects[currentItineraryTeacherIdx].some(
            item => item.subject === subject && item.class === cls
        );

        if (!exists) {
            teacherSpecificSubjects[currentItineraryTeacherIdx].push({
                subject: subject,
                class: cls,
                hoursPerWeek: hours
            });
            added++;
        } else {
            skipped++;
        }
    });

    if (added > 0) {
        saveToStorage();
        renderTeachersList();

        // Reabrir o modal atualizado
        openItineraryModalForTeacher(currentItineraryTeacherIdx);

        const teacher = teachers[currentItineraryTeacherIdx];
        showAlert(`✅ ${subject} adicionado para ${added} turma(s)!${skipped > 0 ? `\n(${skipped} turma(s) já tinham este itinerário)` : ''} `, 'success');
    } else {
        showAlert('Todas as turmas selecionadas já possuem este itinerário cadastrado!', 'warning');
    }
}

function removeItineraryItem(teacherIdx, itemIdx) {
    if (!teacherSpecificSubjects[teacherIdx]) return;

    const item = teacherSpecificSubjects[teacherIdx][itemIdx];
    if (confirm(`Remover "${item.subject}" da turma ${item.class === 'all' ? 'Todas' : item.class}?`)) {
        teacherSpecificSubjects[teacherIdx].splice(itemIdx, 1);
        saveToStorage();
        renderTeachersList();

        // Reabrir o modal atualizado
        openItineraryModalForTeacher(teacherIdx);

        showAlert('Itinerário removido!', 'success');
    }
}

function getTeacherStats(teacherIdx) {
    let totalLessons = 0;
    let classesSet = new Set();
    let lessonsByDay = {};

    days.forEach(day => {
        lessonsByDay[day] = [];
        timeSlots.forEach(slot => {
            if (!slot.isInterval && schedule[day]?.[slot.id]) {
                classes.forEach(cls => {
                    const lesson = schedule[day][slot.id][cls];
                    if (lesson && lesson.teacherIdx === teacherIdx) {
                        totalLessons++;
                        classesSet.add(cls);
                        lessonsByDay[day].push({
                            time: slot.id,
                            timeLabel: slot.label,
                            timeRange: slot.time,
                            class: cls,
                            subject: lesson.subject
                        });
                    }
                });
            }
        });
    });

    return {
        totalLessons,
        totalClasses: classesSet.size,
        classes: Array.from(classesSet),
        lessonsByDay
    };
}

function handleTeacherDragStart(e) {
    const idx = parseInt(e.currentTarget.dataset.teacherIdx);
    draggedTeacherIdx = idx;
    draggedLesson = null;
    dragSourceCell = null;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', 'teacher-' + idx);
}

function handleTeacherDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
}

function filterTeachers() {
    const filter = document.getElementById('searchTeacher').value;
    renderTeachersList(filter);
}

function deleteTeacher(idx) {
    if (confirm(`Deseja excluir o professor "${teachers[idx].name}" ? `)) {
        delete teacherSpecificSubjects[idx];

        const newSpecific = {};
        Object.keys(teacherSpecificSubjects).forEach(key => {
            const keyNum = parseInt(key);
            if (keyNum > idx) {
                newSpecific[keyNum - 1] = teacherSpecificSubjects[key];
            } else {
                newSpecific[keyNum] = teacherSpecificSubjects[key];
            }
        });
        teacherSpecificSubjects = newSpecific;

        teachers.splice(idx, 1);

        days.forEach(day => {
            timeSlots.forEach(slot => {
                if (!slot.isInterval && schedule[day]?.[slot.id]) {
                    classes.forEach(cls => {
                        const lesson = schedule[day][slot.id][cls];
                        if (lesson) {
                            if (lesson.teacherIdx === idx) {
                                schedule[day][slot.id][cls] = null;
                            } else if (lesson.teacherIdx > idx) {
                                lesson.teacherIdx--;
                            }
                        }
                    });
                }
            });
        });

        renderTeachersList();
        renderSchedule();
        saveToStorage();
        showAlert('Professor excluído com sucesso!', 'success');
        updateStats();
    }
}

// ==================== EXCLUIR TODOS OS PROFESSORES ====================

function deleteAllTeachers() {
    if (teachers.length === 0) {
        showAlert('Não há professores cadastrados para excluir!', 'warning');
        return;
    }

    const confirmMessage = `⚠️ ATENÇÃO!\n\n` +
        `Você está prestes a excluir TODOS os ${teachers.length} professores cadastrados.\n\n` +
        `Isso também irá: \n` +
        `• Remover todas as disciplinas específicas\n` +
        `• Limpar todas as aulas da grade de horários\n\n` +
        `Esta ação NÃO pode ser desfeita!\n\n` +
        `Deseja continuar ? `;

    if (!confirm(confirmMessage)) {
        return;
    }

    const doubleConfirm = prompt(`Para confirmar a exclusão, digite "EXCLUIR"(em maiúsculas): `);

    if (doubleConfirm !== 'EXCLUIR') {
        showAlert('Operação cancelada. Os professores não foram excluídos.', 'info');
        return;
    }

    const totalRemoved = teachers.length;
    teachers = [];
    teacherSpecificSubjects = {};

    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval && schedule[day]?.[slot.id]) {
                classes.forEach(cls => {
                    schedule[day][slot.id][cls] = null;
                });
            }
        });
    });

    renderTeachersList();
    renderSchedule();
    saveToStorage();
    updateStats();

    showAlert(`🗑️ ${totalRemoved} professores foram excluídos com sucesso!`, 'success');
}

// ==================== EDITAR PROFESSOR ====================

// Variável global para armazenar o índice do professor sendo editado
let editingTeacherInfoIdx = null;



function openEditTeacherModal(teacherIdx) {
    editingTeacherInfoIdx = teacherIdx;
    const teacher = teachers[teacherIdx];

    if (!teacher) {
        showAlert('Professor não encontrado!', 'error');
        return;
    }

    const colors = getTeacherColor(teacher);

    // Inicializar configurações de carga horária (mesma lógica do openEditWorkloadModal)
    workloadConfigs = [];
    configIdCounter = 0;

    if (teacher.classHours && Object.keys(teacher.classHours).length > 0) {
        // Agrupar turmas por quantidade de horas
        const grouped = {};
        Object.entries(teacher.classHours).forEach(([cls, hours]) => {
            if (!grouped[hours]) grouped[hours] = [];
            grouped[hours].push(cls);
        });

        // Criar uma configuração para cada grupo
        Object.entries(grouped).forEach(([hours, classList]) => {
            workloadConfigs.push({
                id: configIdCounter++,
                hoursPerClass: parseInt(hours),
                classes: classList
            });
        });
    } else {
        // Formato antigo - criar uma única configuração
        workloadConfigs.push({
            id: configIdCounter++,
            hoursPerClass: teacher.hoursPerClass || 2,
            classes: teacher.classes || [...classes]
        });
    }

    let html = `
        <!-- Cabeçalho colorido -->
        <div style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%); 
                    color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin: 0;">✏️ Editar Informações do Professor</h3>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">
                Modifique os dados básicos e configurações de FGB
            </p>
        </div>
        
        <!-- Nome do Professor -->
        <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                👤 Nome Completo:
            </label>
            <input type="text" id="editTeacherName" value="${teacher.name}" 
                   style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; 
                          font-size: 16px; transition: border-color 0.2s;"
                   onfocus="this.style.borderColor='#667eea'"
                   onblur="this.style.borderColor='#ddd'">
        </div>
        
        <!-- Disciplina Principal -->
        <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                📚 Disciplina Principal (FGB):
            </label>
            <select id="editTeacherSubject" 
                    style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; 
                           font-size: 14px; background: white;">
                ${regularSubjects.map(subj => `
                    <option value="${subj}" ${subj === teacher.subject ? 'selected' : ''}>${subj}</option>
                `).join('')}
            </select>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">
        
        <!-- Configurações de Carga Horária -->
        <div style="margin-bottom: 15px;">
            <h4 style="color: #667eea; margin-bottom: 10px;">📚 Configurações de Carga Horária (FGB)</h4>
            <p style="font-size: 13px; color: #666; margin-bottom: 15px;">
                Defina diferentes quantidades de aulas para grupos de turmas.
            </p>
            
            <div id="editTeacherConfigsContainer"></div>
            
            <button type="button" class="btn btn-secondary" onclick="addEditTeacherConfig()" 
                    style="width: 100%; margin-top: 10px; padding: 10px;">
                ➕ Adicionar outra configuração
            </button>
            
            <div id="editTeacherTotalPreview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                 color: white; padding: 15px; border-radius: 10px; margin-top: 15px; text-align: center;">
                <div style="font-size: 13px; opacity: 0.9;">Carga Horária Total (FGB):</div>
                <div style="font-size: 28px; font-weight: bold;" id="editTeacherTotalHours">0h</div>
            </div>
        </div>
    `;

    document.getElementById('editTeacherContent').innerHTML = html;
    document.getElementById('editTeacherModal').classList.add('active');

    renderEditTeacherConfigs();

    // Configurar listener do botão salvar
    const btnSave = document.getElementById('btnSaveEditTeacher');
    btnSave.replaceWith(btnSave.cloneNode(true));
    document.getElementById('btnSaveEditTeacher').addEventListener('click', saveEditTeacher);
}

function addEditTeacherConfig() {
    workloadConfigs.push({
        id: configIdCounter++,
        hoursPerClass: 1, // Padrão 1 aula
        classes: []
    });
    renderEditTeacherConfigs();
}

function removeEditTeacherConfig(configId) {
    if (workloadConfigs.length <= 1) {
        showAlert('Você precisa ter pelo menos uma configuração!', 'warning');
        return;
    }
    workloadConfigs = workloadConfigs.filter(c => c.id !== configId);
    renderEditTeacherConfigs();
}

function renderEditTeacherConfigs() {
    const container = document.getElementById('editTeacherConfigsContainer');
    if (!container) return;

    let html = '';
    let totalHours = 0;

    workloadConfigs.forEach((config, index) => {
        const subtotal = config.hoursPerClass * config.classes.length;
        totalHours += subtotal;

        html += `
            <div class="workload-config-card" style="background: #f8f9fa; border: 2px solid #e0e0e0; 
                 border-radius: 10px; padding: 15px; margin-bottom: 15px; position: relative;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: bold; color: #667eea;">📋 Configuração ${index + 1}</span>
                    ${workloadConfigs.length > 1 ? `
                        <button type="button" class="btn btn-danger btn-sm" 
                                onclick="removeEditTeacherConfig(${config.id})"
                                style="padding: 5px 10px; font-size: 12px;">🗑️</button>
                    ` : ''}
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: #555; display: block; margin-bottom: 5px;">
                        Aulas por semana (por turma):
                    </label>
                    <input type="number" min="1" max="10" value="${config.hoursPerClass}"
                           onchange="updateEditTeacherConfigHours(${config.id}, this.value)"
                           style="width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; 
                                  font-size: 16px; font-weight: bold; text-align: center;">
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: #555; display: block; margin-bottom: 8px;">
                        Turmas:
                    </label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${classes.map(cls => {
            const isSelected = config.classes.includes(cls);
            // Reusing isClassUsedInOtherConfig from global scope (defined earlier in file)
            const isUsedElsewhere = isClassUsedInOtherConfig(cls, config.id);
            return `
                                <label style="display: flex; align-items: center; gap: 5px; padding: 6px 10px; 
                                              background: ${isSelected ? '#e0e7ff' : '#fff'}; 
                                              border: 2px solid ${isSelected ? '#667eea' : '#ddd'}; 
                                              border-radius: 6px; cursor: ${isUsedElsewhere ? 'not-allowed' : 'pointer'}; 
                                              opacity: ${isUsedElsewhere ? '0.4' : '1'};">
                                    <input type="checkbox" 
                                           data-edit-config-id="${config.id}"
                                           value="${cls}" 
                                           ${isSelected ? 'checked' : ''} 
                                           ${isUsedElsewhere ? 'disabled' : ''}
                                           onchange="updateEditTeacherConfigClasses(${config.id})">
                                    <span>${cls}</span>
                                </label>
                            `;
        }).join('')}
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                    <button type="button" onclick="selectEditTeacherClassesByYearNew(${config.id}, '1')"
                            style="padding: 4px 8px; font-size: 11px; background: #fef3c7; border: 1px solid #f59e0b; 
                                   color: #92400e; border-radius: 4px; cursor: pointer;">1º Anos</button>
                    <button type="button" onclick="selectEditTeacherClassesByYearNew(${config.id}, '2')"
                            style="padding: 4px 8px; font-size: 11px; background: #dbeafe; border: 1px solid #3b82f6; 
                                   color: #1e40af; border-radius: 4px; cursor: pointer;">2º Anos</button>
                    <button type="button" onclick="selectEditTeacherClassesByYearNew(${config.id}, '3')"
                            style="padding: 4px 8px; font-size: 11px; background: #dcfce7; border: 1px solid #22c55e; 
                                   color: #166534; border-radius: 4px; cursor: pointer;">3º Anos</button>
                    <button type="button" onclick="clearEditTeacherClassesForConfig(${config.id})"
                            style="padding: 4px 8px; font-size: 11px; background: #fee2e2; border: 1px solid #ef4444; 
                                   color: #991b1b; border-radius: 4px; cursor: pointer;">Limpar</button>
                </div>
                
                <div style="background: ${subtotal > 0 ? '#e0e7ff' : '#f0f0f0'}; padding: 8px 12px; border-radius: 6px; 
                            display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #4338ca; font-size: 13px;">${config.classes.length} turma(s) × ${config.hoursPerClass} aula(s)</span>
                    <span style="font-size: 16px; font-weight: bold; color: #4338ca;">= ${subtotal}h</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('editTeacherTotalHours').textContent = totalHours + 'h';
}

function updateEditTeacherConfigHours(configId, value) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (config) {
        config.hoursPerClass = parseInt(value) || 1;
        renderEditTeacherConfigs();
    }
}

function updateEditTeacherConfigClasses(configId) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (!config) return;

    const checkboxes = document.querySelectorAll(`input[data-edit-config-id="${configId}"]:checked`);
    config.classes = Array.from(checkboxes).map(cb => cb.value);

    renderEditTeacherConfigs();
}

function selectEditTeacherClassesByYearNew(configId, year) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (!config) return;

    const yearClasses = classes.filter(cls => cls.startsWith(year));
    // Reusing global isClassUsedInOtherConfig
    const availableClasses = yearClasses.filter(cls => !isClassUsedInOtherConfig(cls, configId));

    availableClasses.forEach(cls => {
        if (!config.classes.includes(cls)) {
            config.classes.push(cls);
        }
    });

    renderEditTeacherConfigs();
}

function clearEditTeacherClassesForConfig(configId) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (config) {
        config.classes = [];
        renderEditTeacherConfigs();
    }
}

function saveEditTeacher() {
    if (editingTeacherInfoIdx === null) return;

    const newName = document.getElementById('editTeacherName').value.trim();
    const newSubject = document.getElementById('editTeacherSubject').value;

    // Validações Básicas
    if (!newName) {
        showAlert('⚠️ O nome do professor é obrigatório!', 'warning');
        return;
    }
    if (!newSubject) {
        showAlert('⚠️ Selecione uma disciplina!', 'warning');
        return;
    }

    // Processar configurações
    const allClasses = [];
    const classHours = {};
    let hasClasses = false;

    workloadConfigs.forEach(config => {
        if (config.classes.length > 0) hasClasses = true;
        config.classes.forEach(cls => {
            if (!allClasses.includes(cls)) {
                allClasses.push(cls);
                classHours[cls] = config.hoursPerClass;
            }
        });
    });

    if (!hasClasses) {
        showAlert('⚠️ Selecione pelo menos uma turma!', 'warning');
        return;
    }

    // Verificar se já existe outro professor com mesmo nome
    const existingIdx = teachers.findIndex((t, idx) =>
        t.name.toLowerCase() === newName.toLowerCase() && idx !== editingTeacherInfoIdx
    );

    if (existingIdx >= 0) {
        showAlert('⚠️ Já existe outro professor com este nome!', 'warning');
        return;
    }

    const oldTeacher = teachers[editingTeacherInfoIdx];
    const oldName = oldTeacher.name;
    const oldSubject = oldTeacher.subject;

    // Atualizar dados do professor
    teachers[editingTeacherInfoIdx].name = newName;
    teachers[editingTeacherInfoIdx].subject = newSubject;
    teachers[editingTeacherInfoIdx].classes = allClasses;
    teachers[editingTeacherInfoIdx].classHours = classHours;

    // Calcular média
    const totalHours = Object.values(classHours).reduce((a, b) => a + b, 0);
    teachers[editingTeacherInfoIdx].hoursPerClass = allClasses.length > 0 ?
        Math.round(totalHours / allClasses.length) : 2;

    // Atualizar nome do professor nas aulas já atribuídas
    if (oldName !== newName || oldSubject !== newSubject) {
        days.forEach(day => {
            timeSlots.forEach(slot => {
                if (!slot.isInterval && schedule[day]?.[slot.id]) {
                    classes.forEach(cls => {
                        const lesson = schedule[day][slot.id][cls];
                        if (lesson && lesson.teacherIdx === editingTeacherInfoIdx) {
                            lesson.teacher = newName;
                            // Se a disciplina principal mudou, atualizar também nas aulas dessa disciplina
                            if (lesson.subject === oldSubject) {
                                lesson.subject = newSubject;
                            }
                        }
                    });
                }
            });
        });
    }

    // Fechar modal e atualizar interface
    closeModal('editTeacherModal');
    renderTeachersList();
    loadTeacherSpecificSubjects(); // Atualizar visualização lateral se estiver aberta
    renderSchedule();
    saveToStorage();

    showAlert(`✅ Professor "${newName}" atualizado com sucesso!`, 'success');
    editingTeacherInfoIdx = null;
}

// ==================== UTILITÁRIOS ====================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== FEEDBACK DE PROFESSOR EXISTENTE ====================

function checkExistingTeacherFeedback() {
    const name = document.getElementById('teacherName').value.trim();
    let feedbackEl = document.getElementById('teacherNameFeedback');

    if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.id = 'teacherNameFeedback';
        const nameInput = document.getElementById('teacherName');
        nameInput.parentElement.appendChild(feedbackEl);
    }

    if (!name) {
        feedbackEl.innerHTML = '';
        feedbackEl.style.display = 'none';
        return;
    }

    const existingIdx = teachers.findIndex(t =>
        t.name.toLowerCase() === name.toLowerCase()
    );

    if (existingIdx >= 0) {
        const teacher = teachers[existingIdx];
        const workload = calculateTotalWorkload(existingIdx);
        const specificCount = countTeacherSpecificSubjects(existingIdx);

        feedbackEl.innerHTML = `
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 10px; padding: 15px; margin-top: 12px; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <span style="font-size: 20px;">👤</span>
                    <strong style="color: #92400e; font-size: 15px;">Professor já cadastrado!</strong>
                </div>
                <div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #1f2937; margin-bottom: 5px;">${teacher.name}</div>
                    <div style="font-size: 13px; color: #4b5563;">
                        📚 Disciplina principal: <strong>${teacher.subject}</strong><br>
                        🏫 Turmas: ${(teacher.classes || classes).length}<br>
                        🕐 Carga atual: <strong>${workload.totalHours}h/semana</strong>
                        ${specificCount > 0 ? `<br>📌 Disciplinas extras: ${specificCount}` : ''}
                    </div>
                </div>
                <div style="font-size: 12px; color: #78350f; line-height: 1.5;">
                    <strong>💡 Ao salvar, a nova configuração será adicionada a este professor.</strong>
                </div>
            </div>
        `;
        feedbackEl.style.display = 'block';
    } else {
        feedbackEl.innerHTML = `
            <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; border-radius: 10px; padding: 12px; margin-top: 12px; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">✅</span>
                    <span style="color: #065f46; font-size: 13px;">
                        <strong>Novo professor</strong> será cadastrado no sistema
                    </span>
                </div>
            </div>
        `;
        feedbackEl.style.display = 'block';
    }
}

const debouncedCheckExisting = debounce(checkExistingTeacherFeedback, 400);

// ==================== MODAL DE CADASTRO COM MÚLTIPLAS CONFIGURAÇÕES ====================

function openTeacherModal() {
    document.getElementById('teacherModalTitle').textContent = '👨‍🏫 Cadastrar Professor';
    document.getElementById('teacherModal').classList.add('active');
    document.getElementById('teacherName').value = '';
    document.getElementById('teacherSubject').value = '';

    const feedbackEl = document.getElementById('teacherNameFeedback');
    if (feedbackEl) {
        feedbackEl.innerHTML = '';
        feedbackEl.style.display = 'none';
    }

    // Resetar configurações
    workloadConfigs = [];
    configIdCounter = 0;

    // Adicionar primeira configuração
    addWorkloadConfig();

    const nextColor = getNextAvailableColor();
    selectColor(nextColor);

    updateTotalWorkloadPreview();

    const nameInput = document.getElementById('teacherName');
    nameInput.removeEventListener('input', debouncedCheckExisting);
    nameInput.removeEventListener('blur', checkExistingTeacherFeedback);
    nameInput.addEventListener('input', debouncedCheckExisting);
    nameInput.addEventListener('blur', checkExistingTeacherFeedback);

    document.getElementById('btnAddWorkloadConfig').onclick = addWorkloadConfig;

    const subjectSelect = document.getElementById('teacherSubject');
    subjectSelect.onchange = updateTotalWorkloadPreview;

    setTimeout(() => nameInput.focus(), 100);
}

function openTeacherModalForEdit(teacherIdx) {
    const teacher = teachers[teacherIdx];
    if (!teacher) return;

    // Fechar modal de detalhes
    document.getElementById('teacherDetailModal').classList.remove('active');

    // Definir que estamos editando
    editingTeacherIdx = teacherIdx;

    // Abrir modal
    document.getElementById('teacherModalTitle').textContent = '✏️ Editar Professor';
    document.getElementById('teacherModal').classList.add('active');

    // Preencher dados básicos
    document.getElementById('teacherName').value = teacher.name;
    document.getElementById('teacherSubject').value = teacher.subject;

    // Selecionar cor
    selectColor(teacher.colorIdx !== undefined ? teacher.colorIdx : 0);

    // Limpar feedback
    const feedbackEl = document.getElementById('teacherNameFeedback');
    if (feedbackEl) {
        feedbackEl.innerHTML = '';
        feedbackEl.style.display = 'none';
    }

    // Reconstruir configurações de carga horária
    workloadConfigs = [];
    configIdCounter = 0;

    if (teacher.classHours && Object.keys(teacher.classHours).length > 0) {
        // Agrupar turmas por número de aulas
        const grouped = {};
        Object.entries(teacher.classHours).forEach(([cls, hours]) => {
            if (!grouped[hours]) grouped[hours] = [];
            grouped[hours].push(cls);
        });

        // Criar uma configuração para cada grupo
        Object.entries(grouped).forEach(([hours, classList]) => {
            workloadConfigs.push({
                id: configIdCounter++,
                hoursPerClass: parseInt(hours),
                classes: classList
            });
        });
    } else {
        // Formato antigo (hoursPerClass uniforme)
        workloadConfigs.push({
            id: configIdCounter++,
            hoursPerClass: teacher.hoursPerClass || 2,
            classes: teacher.classes || []
        });
    }

    renderWorkloadConfigs();
    updateTotalWorkloadPreview();

    // Configurar listeners
    const nameInput = document.getElementById('teacherName');
    nameInput.removeEventListener('input', debouncedCheckExisting);
    nameInput.removeEventListener('blur', checkExistingTeacherFeedback);

    const subjectSelect = document.getElementById('teacherSubject');
    subjectSelect.onchange = updateTotalWorkloadPreview;

    document.getElementById('btnAddWorkloadConfig').onclick = addWorkloadConfig;

    setTimeout(() => nameInput.focus(), 100);
}

function openItinerariosForTeacher(teacherIdx) {
    const teacher = teachers[teacherIdx];
    if (!teacher) return;

    // Close teacher detail modal
    document.getElementById('teacherDetailModal').classList.remove('active');

    // Open specific subjects modal
    const modal = document.getElementById('specificSubjectsModal');
    if (modal) {
        modal.classList.add('active');

        // Pre-select the teacher in the dropdown
        const teacherSelect = document.getElementById('specificTeacher');
        if (teacherSelect) {
            teacherSelect.value = teacherIdx.toString();

            // Trigger change event to update the subjects list if needed
            const event = new Event('change', { bubbles: true });
            teacherSelect.dispatchEvent(event);
        }

        // Scroll to the itinerários list for this teacher
        setTimeout(() => {
            const listContainer = document.getElementById('specificSubjectsList');
            if (listContainer) {
                // Find the section for this teacher and scroll to it
                const teacherSection = listContainer.querySelector(`[data-teacher-idx="${teacherIdx}"]`);
                if (teacherSection) {
                    teacherSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 100);
    }
}

// ==================== GERENCIAR CONFIGURAÇÕES DE CARGA HORÁRIA ====================

function addWorkloadConfig() {
    const configId = configIdCounter++;

    workloadConfigs.push({
        id: configId,
        hoursPerClass: 2,
        classes: []
    });

    renderWorkloadConfigs();
    updateTotalWorkloadPreview();
}

function removeWorkloadConfig(configId) {
    if (workloadConfigs.length <= 1) {
        showAlert('Você precisa ter pelo menos uma configuração!', 'warning');
        return;
    }

    workloadConfigs = workloadConfigs.filter(c => c.id !== configId);
    renderWorkloadConfigs();
    updateTotalWorkloadPreview();
}

function renderWorkloadConfigs() {
    const container = document.getElementById('workloadConfigsContainer');
    let html = '';

    workloadConfigs.forEach((config, index) => {
        const subtotal = config.hoursPerClass * config.classes.length;

        html += `
            <div class="workload-config-card" data-config-id="${config.id}" style="background: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 10px; padding: 15px; margin-bottom: 15px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: bold; color: #667eea;">📋 Configuração ${index + 1}</span>
                    ${workloadConfigs.length > 1 ? `
                        <button type="button" class="btn btn-danger btn-sm" 
                                onclick="removeWorkloadConfig(${config.id})"
                                style="padding: 5px 10px; font-size: 12px;">🗑️ Remover</button>
                    ` : ''}
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: #555; display: block; margin-bottom: 5px;">
                        Aulas por semana (por turma):
                    </label>
                    <input type="number" 
                           id="configHours_${config.id}" 
                           min="1" max="10" 
                           value="${config.hoursPerClass}"
                           onchange="updateConfigHours(${config.id}, this.value)"
                           oninput="updateConfigHours(${config.id}, this.value)"
                           style="width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; 
                                  font-size: 16px; font-weight: bold; text-align: center;">
                    <span style="margin-left: 8px; color: #666;">aula(s)/semana</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 13px; color: #555; display: block; margin-bottom: 8px;">
                        Selecione as turmas para esta configuração:
                    </label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${classes.map(cls => {
            const isSelected = config.classes.includes(cls);
            const isUsedElsewhere = isClassUsedInOtherConfigForNew(cls, config.id);
            const disabled = isUsedElsewhere ? 'disabled' : '';
            const opacity = isUsedElsewhere ? 'opacity: 0.4;' : '';
            const title = isUsedElsewhere ? 'Turma já selecionada em outra configuração' : '';

            return `
                                <label style="display: flex; align-items: center; gap: 5px; padding: 8px 12px; 
                                              background: ${isSelected ? '#e0e7ff' : '#fff'}; 
                                              border: 2px solid ${isSelected ? '#667eea' : '#ddd'}; 
                                              border-radius: 6px; cursor: ${isUsedElsewhere ? 'not-allowed' : 'pointer'}; 
                                              transition: all 0.2s; ${opacity}" title="${title}">
                                    <input type="checkbox" 
                                           class="config-class-checkbox"
                                           data-config-id="${config.id}"
                                           value="${cls}" 
                                           ${isSelected ? 'checked' : ''} 
                                           ${disabled}
                                           onchange="updateConfigClasses(${config.id})">
                                    <span style="font-weight: ${isSelected ? 'bold' : 'normal'};">${cls}</span>
                                </label>
                            `;
        }).join('')}
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                    <button type="button" onclick="selectClassesByYear(${config.id}, '1')"
                            style="padding: 5px 10px; font-size: 11px; background: #fef3c7; border: 1px solid #f59e0b; 
                                   color: #92400e; border-radius: 4px; cursor: pointer;">1º Anos</button>
                    <button type="button" onclick="selectClassesByYear(${config.id}, '2')"
                            style="padding: 5px 10px; font-size: 11px; background: #dbeafe; border: 1px solid #3b82f6; 
                                   color: #1e40af; border-radius: 4px; cursor: pointer;">2º Anos</button>
                    <button type="button" onclick="selectClassesByYear(${config.id}, '3')"
                            style="padding: 5px 10px; font-size: 11px; background: #dcfce7; border: 1px solid #22c55e; 
                                   color: #166534; border-radius: 4px; cursor: pointer;">3º Anos</button>
                    <button type="button" onclick="selectAllClassesForConfig(${config.id})"
                            style="padding: 5px 10px; font-size: 11px; background: #f3e8ff; border: 1px solid #a855f7; 
                                   color: #7c3aed; border-radius: 4px; cursor: pointer;">Todas disponíveis</button>
                    <button type="button" onclick="clearClassesForConfig(${config.id})"
                            style="padding: 5px 10px; font-size: 11px; background: #fee2e2; border: 1px solid #ef4444; 
                                   color: #991b1b; border-radius: 4px; cursor: pointer;">Limpar</button>
                </div>
                
                <div style="background: ${subtotal > 0 ? '#e0e7ff' : '#f0f0f0'}; 
                            padding: 10px 15px; border-radius: 8px; 
                            display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #4338ca; font-size: 13px;">
                        ${config.classes.length} turma(s) × ${config.hoursPerClass} aula(s)
                    </span>
                    <span style="font-size: 18px; font-weight: bold; color: #4338ca;">
                        = ${subtotal}h
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function updateConfigHours(configId, value) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (config) {
        config.hoursPerClass = parseInt(value) || 1;
        renderWorkloadConfigs();
        updateTotalWorkloadPreview();
    }
}

function updateConfigClasses(configId) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (!config) return;

    const checkboxes = document.querySelectorAll(`.config-class-checkbox[data-config-id="${configId}"]:checked`);
    config.classes = Array.from(checkboxes).map(cb => cb.value);

    renderWorkloadConfigs();
    updateTotalWorkloadPreview();
}

function isClassUsedInOtherConfigForNew(cls, currentConfigId) {
    return workloadConfigs.some(config =>
        config.id !== currentConfigId && config.classes.includes(cls)
    );
}

function selectClassesByYear(configId, year) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (!config) return;

    const yearClasses = classes.filter(cls => cls.startsWith(year));
    const availableClasses = yearClasses.filter(cls => !isClassUsedInOtherConfigForNew(cls, configId));

    availableClasses.forEach(cls => {
        if (!config.classes.includes(cls)) {
            config.classes.push(cls);
        }
    });

    renderWorkloadConfigs();
    updateTotalWorkloadPreview();
}

function selectAllClassesForConfig(configId) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (!config) return;

    const availableClasses = classes.filter(cls => !isClassUsedInOtherConfigForNew(cls, configId));
    config.classes = [...availableClasses];

    renderWorkloadConfigs();
    updateTotalWorkloadPreview();
}

function clearClassesForConfig(configId) {
    const config = workloadConfigs.find(c => c.id === configId);
    if (!config) return;

    config.classes = [];

    renderWorkloadConfigs();
    updateTotalWorkloadPreview();
}

function updateTotalWorkloadPreview() {
    let totalHours = 0;
    let breakdownHtml = '';

    const subject = document.getElementById('teacherSubject').value || 'Disciplina';

    workloadConfigs.forEach((config, index) => {
        const subtotal = config.hoursPerClass * config.classes.length;
        totalHours += subtotal;

        if (config.classes.length > 0) {
            breakdownHtml += `
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                    <span>⭐ ${subject} (${config.hoursPerClass}h × ${config.classes.length} turmas)</span>
                    <span style="font-weight: bold;">${subtotal}h</span>
                </div>
            `;
        }
    });

    if (breakdownHtml === '') {
        breakdownHtml = '<div style="text-align: center; opacity: 0.7;">Selecione turmas para ver o cálculo</div>';
    }

    document.getElementById('totalHoursDisplay').textContent = totalHours + 'h';
    document.getElementById('workloadBreakdown').innerHTML = breakdownHtml;
}

// ==================== SALVAR PROFESSOR ====================

function saveTeacher() {
    const name = document.getElementById('teacherName').value.trim();
    const subject = document.getElementById('teacherSubject').value;
    const colorIdx = parseInt(document.getElementById('selectedColor').value);

    if (!name) {
        showAlert('Por favor, informe o nome do professor!', 'error');
        return;
    }

    if (!subject) {
        showAlert('Por favor, selecione a disciplina!', 'error');
        return;
    }

    // Validar configurações
    const validConfigs = workloadConfigs.filter(c => c.classes.length > 0);

    if (validConfigs.length === 0) {
        showAlert('Selecione pelo menos uma turma em alguma configuração!', 'warning');
        return;
    }

    // CASO ESPECIAL: Editando professor existente
    if (editingTeacherIdx !== null) {
        updateExistingTeacher(editingTeacherIdx, name, subject, colorIdx, validConfigs);
        editingTeacherIdx = null;  // Reset after editing
        closeModal('teacherModal');
        renderTeachersList();
        saveToStorage();
        updateStats();
        return;
    }

    // Verificar se professor já existe (apenas para novos professores)
    const existingIdx = teachers.findIndex(t => t.name.toLowerCase() === name.toLowerCase());

    if (existingIdx >= 0) {
        handleExistingTeacherWithConfigs(existingIdx, subject, validConfigs);
    } else {
        createNewTeacherWithConfigs(name, subject, colorIdx, validConfigs);
    }

    closeModal('teacherModal');
    renderTeachersList();
    saveToStorage();
    updateStats();
}

function updateExistingTeacher(teacherIdx, name, subject, colorIdx, configs) {
    const teacher = teachers[teacherIdx];
    const oldName = teacher.name;

    // Check if name changed and if new name conflicts with another teacher
    if (name.toLowerCase() !== oldName.toLowerCase()) {
        const conflictIdx = teachers.findIndex((t, idx) =>
            idx !== teacherIdx && t.name.toLowerCase() === name.toLowerCase()
        );

        if (conflictIdx >= 0) {
            showAlert(`⚠️ Já existe outro professor com o nome "${name}"!\nPor favor, escolha um nome diferente.`, 'error');
            return;
        }
    }

    const finalColorIdx = isNaN(colorIdx) ? teacher.colorIdx : colorIdx;

    // Criar mapa de turma -> horas
    const classHours = {};
    const allClasses = [];
    let totalHours = 0;

    configs.forEach(config => {
        config.classes.forEach(cls => {
            classHours[cls] = config.hoursPerClass;
            allClasses.push(cls);
            totalHours += config.hoursPerClass;
        });
    });

    // Calcular média para compatibilidade
    const avgHours = allClasses.length > 0 ? Math.round(totalHours / allClasses.length) : 2;

    // Update schedule if name changed
    if (name !== oldName) {
        updateScheduleTeacherName(teacherIdx, oldName, name);
    }

    // Update teacher data
    teacher.name = name;
    teacher.subject = subject;
    teacher.colorIdx = finalColorIdx;
    teacher.hoursPerClass = avgHours;
    teacher.classes = allClasses;
    teacher.classHours = classHours;

    showAlert(`✅ Professor "${name}" atualizado com sucesso!\n(${totalHours}h / semana)`, 'success');
}

function updateScheduleTeacherName(teacherIdx, oldName, newName) {
    // Update all schedule entries with this teacher
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                classes.forEach(cls => {
                    const lesson = schedule[day]?.[slot.id]?.[cls];
                    if (lesson && lesson.teacherIdx === teacherIdx && lesson.teacher === oldName) {
                        lesson.teacher = newName;
                    }
                });
            }
        });
    });
}

function createNewTeacherWithConfigs(name, subject, colorIdx, configs) {
    const finalColorIdx = isNaN(colorIdx) ? getNextAvailableColor() : colorIdx;

    // Criar mapa de turma -> horas
    const classHours = {};
    const allClasses = [];
    let totalHours = 0;

    configs.forEach(config => {
        config.classes.forEach(cls => {
            classHours[cls] = config.hoursPerClass;
            allClasses.push(cls);
            totalHours += config.hoursPerClass;
        });
    });

    // Calcular média para compatibilidade
    const avgHours = allClasses.length > 0 ? Math.round(totalHours / allClasses.length) : 2;

    teachers.push({
        name: name,
        subject: subject,
        colorIdx: finalColorIdx,
        hoursPerClass: avgHours,
        classes: allClasses,
        classHours: classHours
    });

    showAlert(`✅ Professor "${name}" cadastrado com sucesso!(${totalHours}h / semana)`, 'success');
}

function handleExistingTeacherWithConfigs(teacherIdx, subject, configs) {
    const teacher = teachers[teacherIdx];

    if (teacher.subject === subject) {
        // Mesma disciplina - fazer merge
        const choice = confirm(
            `⚠️ "${teacher.name}" já está cadastrado com a disciplina "${subject}".\n\n` +
            `Deseja ADICIONAR as novas turmas / configurações ?\n\n` +
            `[OK] → Adicionar configurações\n` +
            `[Cancelar] → Cancelar operação`
        );

        if (choice) {
            mergeTeacherConfigs(teacherIdx, configs);
        }
    } else {
        // Disciplina diferente - adicionar como específica
        const choice = confirm(
            `ℹ️ "${teacher.name}" já está cadastrado com "${teacher.subject}".\n\n` +
            `Deseja adicionar "${subject}" como disciplina específica ?\n\n` +
            `[OK] → Adicionar como específica\n` +
            `[Cancelar] → Cancelar operação`
        );

        if (choice) {
            addConfigsAsSpecificSubject(teacherIdx, subject, configs);
        }
    }
}

function mergeTeacherConfigs(teacherIdx, newConfigs) {
    const teacher = teachers[teacherIdx];

    if (!teacher.classHours) {
        teacher.classHours = {};
        (teacher.classes || []).forEach(cls => {
            teacher.classHours[cls] = teacher.hoursPerClass || 2;
        });
    }

    let addedCount = 0;
    let updatedCount = 0;

    newConfigs.forEach(config => {
        config.classes.forEach(cls => {
            if (teacher.classHours[cls] !== undefined) {
                if (teacher.classHours[cls] !== config.hoursPerClass) {
                    teacher.classHours[cls] = config.hoursPerClass;
                    updatedCount++;
                }
            } else {
                teacher.classHours[cls] = config.hoursPerClass;
                addedCount++;
            }
        });
    });

    teacher.classes = Object.keys(teacher.classHours);

    const totalHours = Object.values(teacher.classHours).reduce((a, b) => a + b, 0);
    teacher.hoursPerClass = teacher.classes.length > 0 ? Math.round(totalHours / teacher.classes.length) : 2;

    showAlert(
        `✅ Configurações atualizadas para "${teacher.name}"!\n` +
        `${addedCount} turma(s) adicionada(s), ${updatedCount} atualizada(s).\n` +
        `Total: ${totalHours} h / semana`,
        'success'
    );
}

function addConfigsAsSpecificSubject(teacherIdx, subject, configs) {
    if (!teacherSpecificSubjects[teacherIdx]) {
        teacherSpecificSubjects[teacherIdx] = [];
    }

    let totalAdded = 0;

    configs.forEach(config => {
        config.classes.forEach(cls => {
            const exists = teacherSpecificSubjects[teacherIdx].some(
                item => item.subject === subject && item.class === cls
            );

            if (!exists) {
                teacherSpecificSubjects[teacherIdx].push({
                    subject: subject,
                    class: cls, hoursPerWeek: config.hoursPerClass
                });
                totalAdded++;
            }
        });
    });

    const teacher = teachers[teacherIdx];
    const workload = calculateTotalWorkload(teacherIdx);

    showAlert(
        `✅ Disciplina específica adicionada para "${teacher.name}"!\n` +
        `${subject}: ${totalAdded} configuração(ões) \n` +
        `Carga total: ${workload.totalHours} h / semana`,
        'success'
    );
}

// ==================== CORES DOS PROFESSORES ====================

function getNextAvailableColor() {
    const usedColors = teachers.map(t => t.colorIdx);
    for (let i = 0; i < colorPalette.length; i++) {
        if (!usedColors.includes(i)) {
            return i;
        }
    }
    return Math.floor(Math.random() * colorPalette.length);
}

function getTeacherColor(teacher) {
    if (teacher.colorIdx !== undefined && colorPalette[teacher.colorIdx]) {
        return colorPalette[teacher.colorIdx].colors;
    }
    return ['#667eea', '#764ba2'];
}

// ==================== SISTEMA DE RESTRIÇÕES DE HORÁRIO ====================

function openRestrictionsModal() {
    renderRestrictionsContent();
    document.getElementById('restrictionsModal').classList.add('active');
}

function renderRestrictionsContent() {
    const container = document.getElementById('restrictionsContent');

    let html = `
        <!-- Formulário de Adição -->
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #92400e;">➕ Adicionar Nova Restrição</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                        👨‍🏫 Professor:
                    </label>
                    <select id="restrictionTeacher" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                        <option value="">Selecione o professor...</option>
                        ${teachers.map((t, idx) => `<option value="${idx}">${t.name} (${t.subject})</option>`).join('')}
                    </select>
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                        🚫 Tipo de Restrição:
                    </label>
                    <select id="restrictionType" onchange="updateRestrictionOptions()" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                        <option value="">Selecione o tipo...</option>
                        <option value="day">Não trabalha no dia</option>
                        <option value="time">Não trabalha no horário</option>
                        <option value="dayTime">Não trabalha em dia/horário específico</option>
                        <option value="consecutive">Intervalo obrigatório (manhã/tarde)</option>
                    </select>
                </div>
            </div>
            
            <div id="restrictionOptions" style="margin-bottom: 15px;"></div>
            
            <button type="button" onclick="addRestriction()"
                    style="width: 100%; padding: 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                           color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; 
                           cursor: pointer;">
                ➕ Adicionar Restrição
            </button>
        </div>
        
        <!--Lista de Restrições por Professor-->
        <div style="background: #fff; border-radius: 12px; padding: 20px; border: 2px solid #e0e0e0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; color: #dc2626;">📋 Restrições Cadastradas</h4>
                <button onclick="clearAllRestrictions()" 
                        style="background: #fee2e2; color: #dc2626; border: 1px solid #ef4444; padding: 5px 12px; 
                               border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
                    🗑️ Limpar Tudo
                </button>
            </div>

            ${renderRestrictionsList()}
        </div>
    `;

    container.innerHTML = html;
}

function updateRestrictionOptions() {
    const type = document.getElementById('restrictionType').value;
    const container = document.getElementById('restrictionOptions');

    if (!type) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    if (type === 'day') {
        html = `
        < label style = "display: block; font-weight: 600; margin-bottom: 8px; color: #333;" >
                📅 Dia que NÃO trabalha:
            </label >
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${days.map(day => `
                    <label style="display: flex; align-items: center; gap: 5px; padding: 10px 15px; 
                                  background: #fff; border: 2px solid #ddd; border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" class="restriction-day-checkbox" value="${day}">
                        <span>${dayNames[day]}</span>
                    </label>
                `).join('')}
        </div>
    `;
    } else if (type === 'time') {
        html = `
        < label style = "display: block; font-weight: 600; margin-bottom: 8px; color: #333;" >
                🕐 Horário que NÃO trabalha:
            </label >
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${timeSlots.map((slot, idx) => `
                    <label style="display: flex; align-items: center; gap: 5px; padding: 10px 15px; 
                                  background: #fff; border: 2px solid #ddd; border-radius: 8px; cursor: pointer;">
                        <input type="checkbox" class="restriction-time-checkbox" value="${idx}">
                        <span>${slot.label} (${slot.start})</span>
                    </label>
                `).join('')}
        </div>
    `;
    } else if (type === 'dayTime') {
        html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                        📅 Dia:
                    </label>
                    <select id="restrictionDaySelect" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                        ${days.map(day => `<option value="${day}">${dayNames[day]}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                        🕐 Horário:
                    </label>
                    <select id="restrictionTimeSelect" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                        ${timeSlots.map((slot, idx) => `<option value="${idx}">${slot.label} (${slot.start})</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    } else if (type === 'consecutive') {
        html = `
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; color: #991b1b; font-size: 13px;">
                <strong>⚠️ Regra de Intervalo:</strong><br>
                    Se o professor tiver aulas nos últimos horários da manhã (AULA 4 e AULA 5),
                    ele NÃO poderá ter aulas nos primeiros horários da tarde (AULA 6 e AULA 7).
                    Isso evita sobrecarga do professor no intervalo do almoço.
            </p>
        </div>
        <p style="margin: 0; color: #666; font-size: 12px;">
            Esta restrição será aplicada automaticamente quando você clicar em "Adicionar Restrição".
        </p>
    `;
    }

    container.innerHTML = html;
}

function addRestriction() {
    const teacherIdx = document.getElementById('restrictionTeacher').value;
    const type = document.getElementById('restrictionType').value;

    if (teacherIdx === '') {
        showAlert('Selecione um professor!', 'warning');
        return;
    }

    if (type === '') {
        showAlert('Selecione o tipo de restrição!', 'warning');
        return;
    }

    if (!teacherRestrictions[teacherIdx]) {
        teacherRestrictions[teacherIdx] = [];
    }

    const teacher = teachers[teacherIdx];
    let restriction = { type: type };
    let description = '';

    if (type === 'day') {
        const selectedDays = Array.from(document.querySelectorAll('.restriction-day-checkbox:checked')).map(cb => cb.value);
        if (selectedDays.length === 0) {
            showAlert('Selecione pelo menos um dia!', 'warning');
            return;
        }
        restriction.days = selectedDays;
        description = `Não trabalha: ${selectedDays.map(d => dayNames[d]).join(', ')} `;

    } else if (type === 'time') {
        const selectedTimes = Array.from(document.querySelectorAll('.restriction-time-checkbox:checked')).map(cb => parseInt(cb.value));
        if (selectedTimes.length === 0) {
            showAlert('Selecione pelo menos um horário!', 'warning');
            return;
        }
        restriction.times = selectedTimes;
        description = `Não trabalha: ${selectedTimes.map(t => timeSlots[t].label).join(', ')} `;

    } else if (type === 'dayTime') {
        const day = document.getElementById('restrictionDaySelect').value;
        const time = parseInt(document.getElementById('restrictionTimeSelect').value);
        restriction.day = day;
        restriction.time = time;
        description = `Não trabalha: ${dayNames[day]} - ${timeSlots[time].label} `;

    } else if (type === 'consecutive') {
        // Regra fixa: aulas 4-5 da manhã conflitam com 6-7 da tarde
        restriction.morningSlots = [3, 4]; // índices 3 e 4 (AULA 4 e AULA 5)
        restriction.afternoonSlots = [5, 6]; // índices 5 e 6 (AULA 6 e AULA 7)
        description = 'Intervalo obrigatório: fim da manhã ↔ início da tarde';
    }

    // Verificar se já existe essa restrição
    const exists = teacherRestrictions[teacherIdx].some(r => {
        if (r.type !== type) return false;
        if (type === 'day') return JSON.stringify(r.days) === JSON.stringify(restriction.days);
        if (type === 'time') return JSON.stringify(r.times) === JSON.stringify(restriction.times);
        if (type === 'dayTime') return r.day === restriction.day && r.time === restriction.time;
        if (type === 'consecutive') return true;
        return false;
    });

    if (exists) {
        showAlert('Esta restrição já existe para este professor!', 'warning');
        return;
    }

    teacherRestrictions[teacherIdx].push(restriction);
    saveToStorage();
    renderRestrictionsContent();
    showAlert(`✅ Restrição adicionada para ${teacher.name}: ${description} `, 'success');
}

function removeRestriction(teacherIdx, restrictionIdx) {
    if (!teacherRestrictions[teacherIdx]) return;

    if (confirm('Remover esta restrição?')) {
        teacherRestrictions[teacherIdx].splice(restrictionIdx, 1);
        if (teacherRestrictions[teacherIdx].length === 0) {
            delete teacherRestrictions[teacherIdx];
        }
        saveToStorage();
        renderRestrictionsContent();
        showAlert('Restrição removida!', 'success');
    }
}

function clearAllRestrictions() {
    if (Object.keys(teacherRestrictions).length === 0) {
        showAlert('Não há restrições para limpar.', 'warning');
        return;
    }

    if (confirm('Tem certeza que deseja REMOVER TODAS as restrições de TODOS os professores?\nIsso não pode ser desfeito.')) {
        teacherRestrictions = {};
        saveToStorage();
        renderRestrictionsContent();
        showAlert('Todas as restrições foram removidas com sucesso!', 'success');
    }
}

function renderRestrictionsList() {
    const teachersWithRestrictions = Object.keys(teacherRestrictions).filter(
        idx => teacherRestrictions[idx] && teacherRestrictions[idx].length > 0
    );

    if (teachersWithRestrictions.length === 0) {
        return `
        < p style = "text-align: center; color: #999; padding: 20px;" >
            Nenhuma restrição cadastrada ainda.< br >
                Use o formulário acima para adicionar.
            </p >
        `;
    }

    let html = '';

    teachersWithRestrictions.forEach(teacherIdx => {
        const teacher = teachers[teacherIdx];
        if (!teacher) return;

        const colors = getTeacherColor(teacher);
        const restrictions = teacherRestrictions[teacherIdx];

        html += `
            <div style="background: linear-gradient(135deg, ${colors[0]}20 0%, ${colors[1]}20 100%); border: 2px solid ${colors[0]}; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                <h5 style="margin: 0 0 10px 0; color: ${colors[0]};">
                    👨‍🏫 ${teacher.name} <span style="font-weight: normal; opacity: 0.8;">(${teacher.subject})</span>
                </h5>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${restrictions.map((r, idx) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; 
                                    background: white; padding: 10px 15px; border-radius: 8px;">
                            <span>
                                ${getRestrictionIcon(r.type)} ${getRestrictionDescription(r)}
                            </span>
                            <button onclick="removeRestriction(${teacherIdx}, ${idx})"
                                    style="background: #ef4444; color: white; border: none; padding: 5px 10px; 
                                           border-radius: 6px; cursor: pointer; font-size: 12px;">
                                🗑️
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    return html;
}

function getRestrictionIcon(type) {
    switch (type) {
        case 'day': return '📅';
        case 'time': return '🕐';
        case 'dayTime': return '📅🕐';
        case 'consecutive': return '⏰';
        default: return '🚫';
    }
}

function getRestrictionDescription(restriction) {
    switch (restriction.type) {
        case 'day':
            return `Não trabalha: <strong>${restriction.days.map(d => dayNames[d]).join(', ')}</strong>`;
        case 'time':
            return `Não trabalha: <strong>${restriction.times.map(t => timeSlots[t].label).join(', ')}</strong>`;
        case 'dayTime':
            return `Não trabalha: <strong>${dayNames[restriction.day]} - ${timeSlots[restriction.time].label}</strong>`;
        case 'consecutive':
            return `< strong > Intervalo obrigatório:</strong > fim da manhã ↔ início da tarde`;
        default:
            return 'Restrição desconhecida';
    }
}

// Função para verificar se uma atribuição viola alguma restrição
function checkRestrictionViolation(teacherIdx, day, timeSlotId) {
    const restrictions = teacherRestrictions[teacherIdx];
    if (!restrictions || restrictions.length === 0) return null;

    // Converter timeSlotId (string '1', '2', etc.) para índice no array timeSlots
    const timeIdx = timeSlots.findIndex(slot => slot.id === timeSlotId);
    if (timeIdx === -1) return null;

    for (const restriction of restrictions) {
        if (restriction.type === 'day') {
            if (restriction.days.includes(day)) {
                return {
                    violated: true,
                    message: `${teachers[teacherIdx].name} não trabalha na ${dayNames[day]} `
                };
            }
        }

        if (restriction.type === 'time') {
            if (restriction.times.includes(timeIdx)) {
                return {
                    violated: true,
                    message: `${teachers[teacherIdx].name} não trabalha no horário ${timeSlots[timeIdx].label} `
                };
            }
        }

        if (restriction.type === 'dayTime') {
            if (restriction.day === day && restriction.time === timeIdx) {
                return {
                    violated: true,
                    message: `${teachers[teacherIdx].name} não trabalha na ${dayNames[day]} - ${timeSlots[timeIdx].label} `
                };
            }
        }

        if (restriction.type === 'consecutive') {
            // Verificar se está tentando atribuir no início da tarde
            if (restriction.afternoonSlots.includes(timeIdx)) {
                // Verificar se o professor já tem aulas no fim da manhã neste mesmo dia
                const hasMorningEnd = restriction.morningSlots.some(slot => {
                    const lesson = schedule[day] && schedule[day][slot];
                    return lesson && Object.values(lesson).some(l => l && l.teacherIdx === parseInt(teacherIdx));
                });

                if (hasMorningEnd) {
                    return {
                        violated: true,
                        message: `${teachers[teacherIdx].name} já tem aulas no fim da manhã - não pode pegar início da tarde(intervalo obrigatório)`
                    };
                }
            }

            // Verificar se está tentando atribuir no fim da manhã
            if (restriction.morningSlots.includes(timeIdx)) {
                // Verificar se o professor já tem aulas no início da tarde neste mesmo dia
                const hasAfternoonStart = restriction.afternoonSlots.some(slot => {
                    const lesson = schedule[day] && schedule[day][slot];
                    return lesson && Object.values(lesson).some(l => l && l.teacherIdx === parseInt(teacherIdx));
                });

                if (hasAfternoonStart) {
                    return {
                        violated: true,
                        message: `${teachers[teacherIdx].name} já tem aulas no início da tarde - não pode pegar fim da manhã(intervalo obrigatório)`
                    };
                }
            }
        }
    }

    return null;
}

// Inicializar listener para o botão de restrições
document.addEventListener('DOMContentLoaded', function () {
    const btnRestrictions = document.getElementById('btnRestrictions');
    if (btnRestrictions) {
        btnRestrictions.addEventListener('click', openRestrictionsModal);
    }
});
