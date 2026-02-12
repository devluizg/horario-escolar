// ==================== RELATÓRIO DE LACUNAS POR TURMA ====================
// Este arquivo contém funções para identificar disciplinas faltantes em cada turma

function openGapsReportModal() {
    renderGapsReport();
    const modal = document.getElementById('gapsReportModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function renderGapsReport() {
    const container = document.getElementById('gapsReportContent');
    if (!container) return;

    let html = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: #667eea; margin-bottom: 15px;">📊 Relatório Geral de Lacunas por Turma</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                Visão geral de todas as turmas mostrando quantas disciplinas (FGB + Itinerários) ainda não têm professores cadastrados.
            </p>
        </div>

        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <th style="padding: 15px; text-align: left; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">🏫 Turma</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">📚 FGB Esperado</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">✅ FGB Cadastrado</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">❌ FGB Faltando</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">🎯 Itinerários Esperado</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">✅ Itinerários Cadastrado</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">❌ Itinerários Faltando</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">📊 % Completo</th>
                        <th style="padding: 15px; text-align: center; font-weight: 600;">🔍 Detalhes</th>
                    </tr>
                </thead>
                <tbody id="gapsTableBody">
    `;

    // Processar cada turma
    classes.forEach((cls, idx) => {
        const year = cls[0];
        const analysis = analyzeClassGaps(cls, year);

        const totalExpected = analysis.fgbExpected + analysis.itinerariosExpected;
        const totalRegistered = analysis.fgbRegistered + analysis.itinerariosRegistered;
        const percentComplete = totalExpected > 0 ? Math.round((totalRegistered / totalExpected) * 100) : 0;

        const statusColor = percentComplete === 100 ? '#22c55e' : percentComplete >= 50 ? '#f59e0b' : '#ef4444';
        const rowBg = idx % 2 === 0 ? '#f9fafb' : 'white';

        html += `
            <tr style="background: ${rowBg}; border-bottom: 1px solid #e5e7eb; transition: background 0.2s;"
                onmouseover="this.style.background='#f3f4f6'"
                onmouseout="this.style.background='${rowBg}'">
                <td style="padding: 12px 15px; font-weight: 600; color: #333;">Turma ${cls}</td>
                <td style="padding: 12px 15px; text-align: center; color: #666;">${analysis.fgbExpected}</td>
                <td style="padding: 12px 15px; text-align: center; color: #22c55e; font-weight: 600;">${analysis.fgbRegistered}</td>
                <td style="padding: 12px 15px; text-align: center; color: ${analysis.fgbMissing > 0 ? '#ef4444' : '#22c55e'}; font-weight: 600;">
                    ${analysis.fgbMissing > 0 ? '⚠️ ' + analysis.fgbMissing : '✅ 0'}
                </td>
                <td style="padding: 12px 15px; text-align: center; color: #666;">${analysis.itinerariosExpected}</td>
                <td style="padding: 12px 15px; text-align: center; color: #22c55e; font-weight: 600;">${analysis.itinerariosRegistered}</td>
                <td style="padding: 12px 15px; text-align: center; color: ${analysis.itinerariosMissing > 0 ? '#ef4444' : '#22c55e'}; font-weight: 600;">
                    ${analysis.itinerariosMissing > 0 ? '⚠️ ' + analysis.itinerariosMissing : '✅ 0'}
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <div style="flex: 1; background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
                            <div style="background: ${statusColor}; height: 100%; width: ${percentComplete}%; transition: width 0.3s;"></div>
                        </div>
                        <span style="font-weight: 600; color: ${statusColor}; min-width: 45px;">${percentComplete}%</span>
                    </div>
                </td>
                <td style="padding: 12px 15px; text-align: center;">
                    <button onclick="showClassGapsDetails('${cls}')"
                            style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: background 0.2s;"
                            onmouseover="this.style.background='#5568d3'"
                            onmouseout="this.style.background='#667eea'">
                        Ver Detalhes
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        <!-- Detalhes expandidos -->
        <div id="classGapsDetails" style="margin-top: 30px; display: none;"></div>
    `;

    container.innerHTML = html;
}

function analyzeClassGaps(cls, year) {
    // Disciplinas FGB esperadas por ano
    const fgbSubjects = [
        'Língua Portuguesa e suas Literaturas',
        'Matemática',
        'Química',
        'Física',
        'Biologia',
        'História',
        'Geografia',
        'Língua Inglesa',
        'Educação Física',
        'Arte',
        'Sociologia',
        'Filosofia'
    ];

    // Adicionar Técnico para turmas específicas
    const technicalClasses = ['104', '204'];
    if (technicalClasses.includes(cls)) {
        fgbSubjects.push('Técnico');
    }

    // Contar disciplinas FGB cadastradas
    let fgbRegistered = 0;
    let fgbMissing = 0;

    fgbSubjects.forEach(subject => {
        const gap = findGapsForSubject(cls, subject);
        if (gap.current > 0 || gap.expected === 0) {
            fgbRegistered++;
        } else {
            fgbMissing++;
        }
    });

    // Contar itinerários formativos cadastrados para esta turma
    let itinerariosRegistered = 0;
    let itinerariosExpected = 0;

    // Verificar todos os professores para itinerários desta turma
    teachers.forEach((teacher, idx) => {
        if (teacherSpecificSubjects[idx]) {
            teacherSpecificSubjects[idx].forEach(item => {
                if (item.class === cls) {
                    itinerariosExpected++;
                    // Verificar se tem aulas cadastradas na grade
                    if (hasLessonsInSchedule(cls, item.subject, idx)) {
                        itinerariosRegistered++;
                    }
                }
            });
        }
    });

    const itinerariosMissing = Math.max(0, itinerariosExpected - itinerariosRegistered);

    return {
        fgbExpected: fgbSubjects.length,
        fgbRegistered: fgbRegistered,
        fgbMissing: fgbMissing,
        itinerariosExpected: itinerariosExpected,
        itinerariosRegistered: itinerariosRegistered,
        itinerariosMissing: itinerariosMissing
    };
}

function hasLessonsInSchedule(cls, subject, teacherIdx) {
    // Verificar se existe pelo menos uma aula desta disciplina na grade
    for (let day of days) {
        for (let slot of timeSlots) {
            if (!slot.isInterval) {
                const lesson = schedule[day]?.[slot.id]?.[cls];
                if (lesson && lesson.subject === subject && lesson.teacherIdx === teacherIdx) {
                    return true;
                }
            }
        }
    }
    return false;
}

function showClassGapsDetails(cls) {
    const detailsContainer = document.getElementById('classGapsDetails');
    if (!detailsContainer) return;

    const year = cls[0];

    // Disciplinas FGB esperadas
    const fgbSubjects = [
        'Língua Portuguesa e suas Literaturas',
        'Matemática',
        'Química',
        'Física',
        'Biologia',
        'História',
        'Geografia',
        'Língua Inglesa',
        'Educação Física',
        'Arte',
        'Sociologia',
        'Filosofia'
    ];

    const technicalClasses = ['104', '204'];
    if (technicalClasses.includes(cls)) {
        fgbSubjects.push('Técnico');
    }

    let html = `
        <div style="background: white; border: 2px solid #667eea; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #667eea; margin: 0;">📋 Detalhes da Turma ${cls} (${year}º Ano)</h3>
                <button onclick="document.getElementById('classGapsDetails').style.display='none'"
                        style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    ✕ Fechar
                </button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- FGB -->
                <div>
                    <h4 style="color: #667eea; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
                        📚 Formação Geral Básica (FGB)
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    // Listar disciplinas FGB
    fgbSubjects.forEach(subject => {
        const gap = findGapsForSubject(cls, subject);
        const isMissing = gap.current === 0 && gap.expected > 0;
        const isPartial = gap.current > 0 && gap.current < gap.expected;
        const isComplete = gap.current >= gap.expected && gap.expected > 0;

        let statusIcon, statusColor, statusText;
        if (isComplete) {
            statusIcon = '✅';
            statusColor = '#22c55e';
            statusText = `Completo (${gap.current}/${gap.expected}h)`;
        } else if (isPartial) {
            statusIcon = '⚠️';
            statusColor = '#f59e0b';
            statusText = `Parcial (${gap.current}/${gap.expected}h)`;
        } else {
            statusIcon = '❌';
            statusColor = '#ef4444';
            statusText = `Sem professor (0/${gap.expected}h)`;
        }

        html += `
            <div style="background: ${isMissing ? '#fef3c7' : isPartial ? '#fef3c7' : '#f0fdf4'};
                        border-left: 4px solid ${statusColor};
                        padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600; color: #333; font-size: 13px;">${subject}</div>
                    ${gap.teachers.length > 0 ? `
                        <div style="font-size: 11px; color: #666; margin-top: 3px;">
                            👤 ${gap.teachers.join(', ')}
                        </div>
                    ` : ''}
                </div>
                <div style="font-size: 12px; color: ${statusColor}; font-weight: 600; white-space: nowrap; margin-left: 10px;">
                    ${statusIcon} ${statusText}
                </div>
            </div>
        `;
    });

    html += `
                    </div>
                </div>

                <!-- Itinerários Formativos -->
                <div>
                    <h4 style="color: #f59e0b; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
                        🎯 Itinerários Formativos
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    // Listar itinerários formativos desta turma
    let hasItinerarios = false;
    teachers.forEach((teacher, idx) => {
        if (teacherSpecificSubjects[idx]) {
            teacherSpecificSubjects[idx].forEach(item => {
                if (item.class === cls) {
                    hasItinerarios = true;
                    const hasLessons = hasLessonsInSchedule(cls, item.subject, idx);
                    const statusIcon = hasLessons ? '✅' : '❌';
                    const statusColor = hasLessons ? '#22c55e' : '#ef4444';
                    const statusText = hasLessons ? 'Cadastrado' : 'Sem aulas na grade';

                    html += `
                        <div style="background: ${hasLessons ? '#f0fdf4' : '#fef3c7'};
                                    border-left: 4px solid ${statusColor};
                                    padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600; color: #333; font-size: 13px;">${item.subject}</div>
                                <div style="font-size: 11px; color: #666; margin-top: 3px;">
                                    👤 ${teacher.name} • ${item.hoursPerWeek}h/semana
                                </div>
                            </div>
                            <div style="font-size: 12px; color: ${statusColor}; font-weight: 600; white-space: nowrap; margin-left: 10px;">
                                ${statusIcon} ${statusText}
                            </div>
                        </div>
                    `;
                }
            });
        }
    });

    if (!hasItinerarios) {
        html += `
            <div style="text-align: center; padding: 20px; color: #999; font-style: italic;">
                Nenhum itinerário formativo cadastrado para esta turma
            </div>
        `;
    }

    html += `
                    </div>
                </div>
            </div>
        </div>
    `;

    detailsContainer.innerHTML = html;
    detailsContainer.style.display = 'block';

    // Scroll suave até os detalhes
    detailsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function findGapsInClass(cls, expectedSubjects) {
    const gaps = [];

    expectedSubjects.forEach(subject => {
        const gap = findGapsForSubject(cls, subject);
        if (gap.missing > 0) {
            gaps.push(gap);
        }
    });

    return gaps;
}

function findGapsForSubject(cls, subject) {
    const year = parseInt(cls[0]);

    // Buscar limite esperado na matriz curricular
    let expectedHours = 0;
    if (weeklyHoursLimit[subject] && weeklyHoursLimit[subject][year]) {
        expectedHours = weeklyHoursLimit[subject][year];
    }

    // Contar aulas já atribuídas para esta disciplina nesta turma
    let currentHours = 0;
    const assignedTeachers = new Set();

    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                const lesson = schedule[day]?.[slot.id]?.[cls];
                if (lesson && lesson.subject === subject) {
                    currentHours++;
                    assignedTeachers.add(lesson.teacher);
                }
            }
        });
    });

    const missing = Math.max(0, expectedHours - currentHours);

    return {
        subject: subject,
        expected: expectedHours,
        current: currentHours,
        missing: missing,
        teachers: Array.from(assignedTeachers)
    };
}

// Inicializar listener para o botão de relatório de lacunas
document.addEventListener('DOMContentLoaded', function () {
    const btnGapsReport = document.getElementById('btnGapsReport');
    if (btnGapsReport) {
        btnGapsReport.addEventListener('click', openGapsReportModal);
    }
});
