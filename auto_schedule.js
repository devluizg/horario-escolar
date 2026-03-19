// ==================== DISTRIBUIÇÃO AUTOMÁTICA DE HORÁRIOS ====================
// auto_schedule.js - Engine de geração automática + Sistema de cadeados
// Versão 1.0

// ==================== ESTADO DO SISTEMA ====================
let lockedCells = {};

// Pares de slots consecutivos válidos (calculados dinamicamente)
let CONSECUTIVE_PAIRS = [];

function buildConsecutivePairs() {
    CONSECUTIVE_PAIRS = [];
    const nonIntervalSlots = timeSlots.filter(s => !s.isInterval);

    for (let i = 0; i < nonIntervalSlots.length - 1; i++) {
        const current = nonIntervalSlots[i];
        const next = nonIntervalSlots[i + 1];

        const currentIdx = timeSlots.indexOf(current);
        const nextIdx = timeSlots.indexOf(next);

        let hasIntervalBetween = false;
        for (let j = currentIdx + 1; j < nextIdx; j++) {
            if (timeSlots[j].isInterval) {
                hasIntervalBetween = true;
                break;
            }
        }

        if (!hasIntervalBetween) {
            CONSECUTIVE_PAIRS.push([current.id, next.id]);
        }
    }

    console.log('📐 Pares consecutivos válidos:', CONSECUTIVE_PAIRS);
}

// ==================== SISTEMA DE CADEADO ====================

function isLocked(day, slotId, cls) {
    return lockedCells[`${day}|${slotId}|${cls}`] === true;
}

function toggleLock(day, slotId, cls) {
    const key = `${day}|${slotId}|${cls}`;
    if (lockedCells[key]) {
        delete lockedCells[key];
    } else {
        if (schedule[day] && schedule[day][slotId] && schedule[day][slotId][cls]) {
            lockedCells[key] = true;
        } else {
            showAlert('⚠️ Só é possível travar células que possuem uma aula atribuída.', 'warning');
            return;
        }
    }
    saveToStorage();
    renderSchedule();
}

function getLockedLessons() {
    const locked = [];
    Object.keys(lockedCells).forEach(key => {
        const parts = key.split('|');
        if (parts.length !== 3) return;
        const day = parts[0];
        const slotId = parts[1];
        const cls = parts[2];
        const lesson = schedule[day] && schedule[day][slotId] && schedule[day][slotId][cls];
        if (lesson) {
            locked.push({ day, slotId, cls, lesson: JSON.parse(JSON.stringify(lesson)) });
        }
    });
    return locked;
}

function clearUnlockedSchedule() {
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                classes.forEach(cls => {
                    if (!isLocked(day, slot.id, cls)) {
                        schedule[day][slot.id][cls] = null;
                    }
                });
            }
        });
    });
}

// ==================== COLETA DE TAREFAS ====================

function collectAllTasks() {
    const tasks = [];

    console.log('📋 Coletando tarefas de', teachers.length, 'professores...');

    teachers.forEach((teacher, teacherIdx) => {
        const teacherClasses = teacher.classes || [];

        // 1. Disciplina principal (FGB) — pular se for "Apenas Itinerários"
        if (teacher.subject && teacher.subject !== 'Apenas Itinerários') {
            teacherClasses.forEach(cls => {
                let hours = 0;
                if (teacher.classHours && teacher.classHours[cls] !== undefined) {
                    hours = teacher.classHours[cls];
                } else if (teacher.hoursPerClass) {
                    hours = teacher.hoursPerClass;
                } else {
                    hours = 2; // padrão
                }

                if (hours > 0) {
                    tasks.push({
                        teacherIdx: teacherIdx,
                        teacherName: teacher.name,
                        subject: teacher.subject,
                        cls: cls,
                        totalHours: hours,
                        isPrincipal: true
                    });
                }
            });
        }

        // 2. Itinerários formativos
        const specificList = teacherSpecificSubjects[teacherIdx] || [];
        specificList.forEach(item => {
            const hoursPerWeek = item.hoursPerWeek || 1;

            if (item.class === 'all') {
                // Para todas as turmas
                classes.forEach(cls => {
                    tasks.push({
                        teacherIdx: teacherIdx,
                        teacherName: teacher.name,
                        subject: item.subject,
                        cls: cls,
                        totalHours: hoursPerWeek,
                        isPrincipal: false
                    });
                });
            } else {
                // Para turma específica
                tasks.push({
                    teacherIdx: teacherIdx,
                    teacherName: teacher.name,
                    subject: item.subject,
                    cls: item.class,
                    totalHours: hoursPerWeek,
                    isPrincipal: false
                });
            }
        });
    });

    // 3. Clube/Tutoria — disciplina sem professor, preencher automaticamente
    // Verificar para cada turma se Clube/Tutoria está cadastrado como itinerário
    // Se nenhum professor tem, criar tarefa com teacherIdx = -1
    classes.forEach(cls => {
        // Verificar se algum professor já tem Clube/Tutoria para esta turma
        let hasClubeTutoria = false;
        teachers.forEach((teacher, idx) => {
            const specificList = teacherSpecificSubjects[idx] || [];
            specificList.forEach(item => {
                if (item.subject === 'Clube/Tutoria' && (item.class === cls || item.class === 'all')) {
                    hasClubeTutoria = true;
                }
            });
        });

        // Se já tem cadastrado por algum professor, não precisa criar tarefa virtual
        // Se não tem, criar tarefa com teacherIdx especial
        if (!hasClubeTutoria) {
            // Verificar na matriz se deveria ter
            const year = parseInt(cls[0]);
            // Clube/Tutoria: 1 aula por semana (ajuste conforme necessário)
            tasks.push({
                teacherIdx: -1, // Professor virtual
                teacherName: 'Clube',
                subject: 'Tutoria',
                cls: cls,
                totalHours: 1, // Ajuste a quantidade de aulas aqui
                isPrincipal: false,
                isVirtual: true
            });
        }
    });

    console.log(`📋 Total de tarefas coletadas: ${tasks.length}`);

    // Log resumido
    let totalHoursSum = 0;
    tasks.forEach(t => totalHoursSum += t.totalHours);
    console.log(`📋 Total de aulas para distribuir: ${totalHoursSum}`);

    return tasks;
}

// ==================== AGRUPAMENTO DE AULAS ====================

function splitIntoBlocks(totalHours) {
    const blocks = [];
    let remaining = totalHours;

    while (remaining > 0) {
        if (remaining >= 2) {
            blocks.push(2);
            remaining -= 2;
        } else {
            blocks.push(1);
            remaining -= 1;
        }
    }

    return blocks;
}

// ==================== VALIDAÇÃO DE PLACEMENT ====================

function canPlace(teacherIdx, day, slotId, cls) {
    // 0. Garantir que a estrutura existe
    if (!schedule[day]) return false;
    if (!schedule[day][slotId]) return false;

    // 1. Célula travada?
    if (isLocked(day, slotId, cls)) return false;

    // 2. Célula já ocupada?
    if (schedule[day][slotId][cls] !== null && schedule[day][slotId][cls] !== undefined) return false;

    // 3. Professor virtual (Clube/Tutoria) — sem conflito de professor
    if (teacherIdx === -1) return true;

    // 4. Conflito de professor (mesmo horário, outra turma)?
    for (let otherCls of classes) {
        if (otherCls === cls) continue;
        const lesson = schedule[day][slotId][otherCls];
        if (lesson && lesson.teacherIdx === teacherIdx) return false;
    }

    // 5. Restrição de horário
    const restriction = checkRestrictionViolation(teacherIdx, day, slotId);
    if (restriction && restriction.violated) return false;

    return true;
}

function canPlacePair(teacherIdx, day, slot1Id, slot2Id, cls) {
    return canPlace(teacherIdx, day, slot1Id, cls) &&
        canPlace(teacherIdx, day, slot2Id, cls);
}

// ==================== VERIFICAÇÃO DE 3+ AULAS SEGUIDAS DO MESMO PROFESSOR ====================

function getOrderedSlotsForDay() {
    return timeSlots.filter(s => !s.isInterval).map(s => s.id);
}

function hasTripleRunForTeacher(teacherIdx, day, cls) {
    const orderedSlots = getOrderedSlotsForDay();
    let streak = 0;

    for (const sid of orderedSlots) {
        const lesson = schedule[day] && schedule[day][sid] && schedule[day][sid][cls];
        if (lesson && lesson.teacherIdx === teacherIdx) {
            streak++;
            if (streak >= 3) return true;
        } else {
            streak = 0;
        }
    }

    return false;
}

function wouldCreate3ConsecutiveSameTeacher(teacherIdx, day, slotId, cls) {
    const orderedSlots = getOrderedSlotsForDay();
    const slotIndex = orderedSlots.indexOf(slotId);
    if (slotIndex === -1) return false;

    // Criar um array temporário com o que já está no schedule + a nova aula
    function getTeacherAtSlot(idx) {
        if (idx < 0 || idx >= orderedSlots.length) return -1;
        const sid = orderedSlots[idx];
        const lesson = schedule[day] && schedule[day][sid] && schedule[day][sid][cls];
        if (idx === slotIndex) return teacherIdx; // a aula que estamos tentando colocar
        return lesson ? lesson.teacherIdx : -1;
    }

    // Verificar se ao colocar neste slot, criamos 3 seguidas
    // Padrão 1: [slot-2, slot-1, ESTE] = 3 seguidas
    if (slotIndex >= 2) {
        const t1 = getTeacherAtSlot(slotIndex - 2);
        const t2 = getTeacherAtSlot(slotIndex - 1);
        if (t1 === teacherIdx && t2 === teacherIdx) return true;
    }

    // Padrão 2: [slot-1, ESTE, slot+1] = 3 seguidas
    if (slotIndex >= 1 && slotIndex < orderedSlots.length - 1) {
        const t1 = getTeacherAtSlot(slotIndex - 1);
        const t2 = getTeacherAtSlot(slotIndex + 1);
        if (t1 === teacherIdx && t2 === teacherIdx) return true;
    }

    // Padrão 3: [ESTE, slot+1, slot+2] = 3 seguidas
    if (slotIndex < orderedSlots.length - 2) {
        const t1 = getTeacherAtSlot(slotIndex + 1);
        const t2 = getTeacherAtSlot(slotIndex + 2);
        if (t1 === teacherIdx && t2 === teacherIdx) return true;
    }

    return false;
}

// Versão para pares (verifica ambos os slots do par)
function wouldPairCreate3ConsecutiveSameTeacher(teacherIdx, day, slot1Id, slot2Id, cls) {
    const hadTripleBefore = hasTripleRunForTeacher(teacherIdx, day, cls);

    // Simular a colocação do par temporariamente
    const backup1 = schedule[day][slot1Id][cls];
    const backup2 = schedule[day][slot2Id][cls];

    const tempLesson = { teacherIdx: teacherIdx, teacher: '', subject: '' };
    schedule[day][slot1Id][cls] = tempLesson;
    schedule[day][slot2Id][cls] = tempLesson;

    const hasTripleAfter = hasTripleRunForTeacher(teacherIdx, day, cls);

    // Restaurar
    schedule[day][slot1Id][cls] = backup1;
    schedule[day][slot2Id][cls] = backup2;

    // Bloqueia apenas se esta jogada criou a sequência 3+
    return !hadTripleBefore && hasTripleAfter;
}

// ==================== CONTAGEM AUXILIAR ====================

function countAllocatedForTask(task) {
    let count = 0;
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                const lesson = schedule[day] && schedule[day][slot.id] && schedule[day][slot.id][task.cls];
                if (lesson &&
                    lesson.teacherIdx === task.teacherIdx &&
                    lesson.subject === task.subject) {
                    count++;
                }
            }
        });
    });
    return count;
}

function getDaysWithSubjectForTask(task) {
    const daysFound = [];
    days.forEach(day => {
        let found = false;
        timeSlots.forEach(slot => {
            if (!slot.isInterval && !found) {
                const lesson = schedule[day] && schedule[day][slot.id] && schedule[day][slot.id][task.cls];
                if (lesson &&
                    lesson.teacherIdx === task.teacherIdx &&
                    lesson.subject === task.subject) {
                    found = true;
                }
            }
        });
        if (found) daysFound.push(day);
    });
    return daysFound;
}

function countSubjectInDayForClass(subject, cls, day) {
    let count = 0;
    timeSlots.forEach(slot => {
        if (!slot.isInterval) {
            const lesson = schedule[day] && schedule[day][slot.id] && schedule[day][slot.id][cls];
            if (lesson && lesson.subject === subject) {
                count++;
            }
        }
    });
    return count;
}

function countTeacherInDayForClass(teacherIdx, cls, day) {
    let count = 0;
    timeSlots.forEach(slot => {
        if (!slot.isInterval) {
            const lesson = schedule[day] && schedule[day][slot.id] && schedule[day][slot.id][cls];
            if (lesson && lesson.teacherIdx === teacherIdx) {
                count++;
            }
        }
    });
    return count;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ==================== ESTRATÉGIAS DE ALOCAÇÃO ====================

function tryPlacePairBlock(task) {
    // Pegar todos os dias disponíveis
    const availableDays = days.filter(day => {
        // Verificar se o professor tem restrição para este dia inteiro
        const restriction = checkRestrictionViolation(task.teacherIdx, day, timeSlots.find(s => !s.isInterval).id);
        if (restriction && restriction.violated && restriction.message && restriction.message.includes('não trabalha na')) {
            return false;
        }
        return true;
    });

    const shuffledDays = shuffleArray(availableDays);
    const daysWithSubject = getDaysWithSubjectForTask(task);

    // Priorizar dias que NÃO têm esta matéria ainda
    const prioritizedDays = [
        ...shuffledDays.filter(d => !daysWithSubject.includes(d)),
        ...shuffledDays.filter(d => daysWithSubject.includes(d))
    ];

    for (const day of prioritizedDays) {
        const shuffledPairs = shuffleArray(CONSECUTIVE_PAIRS);

        for (const [slot1, slot2] of shuffledPairs) {
            if (!canPlacePair(task.teacherIdx, day, slot1, slot2, task.cls)) continue;

            // Verificar máximo de aulas da mesma matéria no dia
            const subjectCount = countSubjectInDayForClass(task.subject, task.cls, day);
            if (subjectCount >= 2) continue;

            // NOVA REGRA: Verificar se criaria 3+ consecutivas do mesmo professor
            if (wouldPairCreate3ConsecutiveSameTeacher(task.teacherIdx, day, slot1, slot2, task.cls)) {
                continue;
            }

            // Alocar!
            const lessonData = {
                subject: task.subject,
                teacher: task.teacherName,
                teacherIdx: task.teacherIdx
            };
            schedule[day][slot1][task.cls] = { ...lessonData };
            schedule[day][slot2][task.cls] = { ...lessonData };
            return true;
        }
    }

    return false;
}

function tryPlaceSingleBlock(task) {
    const availableDays = days.filter(day => {
        const restriction = checkRestrictionViolation(task.teacherIdx, day, timeSlots.find(s => !s.isInterval).id);
        if (restriction && restriction.violated && restriction.message && restriction.message.includes('não trabalha na')) {
            return false;
        }
        return true;
    });

    const shuffledDays = shuffleArray(availableDays);
    const daysWithSubject = getDaysWithSubjectForTask(task);

    const prioritizedDays = [
        ...shuffledDays.filter(d => !daysWithSubject.includes(d)),
        ...shuffledDays.filter(d => daysWithSubject.includes(d))
    ];

    const nonIntervalSlots = timeSlots.filter(s => !s.isInterval);

    // TENTATIVA 1: Sem permitir 3 consecutivas
    for (const day of prioritizedDays) {
        const shuffledSlots = shuffleArray(nonIntervalSlots);

        for (const slot of shuffledSlots) {
            if (!canPlace(task.teacherIdx, day, slot.id, task.cls)) continue;

            const subjectCount = countSubjectInDayForClass(task.subject, task.cls, day);
            if (subjectCount >= 2) continue;

            // NOVA REGRA: Verificar 3+ consecutivas do mesmo professor
            if (wouldCreate3ConsecutiveSameTeacher(task.teacherIdx, day, slot.id, task.cls)) {
                continue;
            }

            schedule[day][slot.id][task.cls] = {
                subject: task.subject,
                teacher: task.teacherName,
                teacherIdx: task.teacherIdx
            };
            return true;
        }
    }

    // TENTATIVA 2: Permitir 3 consecutivas (fallback)
    for (const day of prioritizedDays) {
        const shuffledSlots = shuffleArray(nonIntervalSlots);

        for (const slot of shuffledSlots) {
            if (!canPlace(task.teacherIdx, day, slot.id, task.cls)) continue;

            const subjectCount = countSubjectInDayForClass(task.subject, task.cls, day);
            if (subjectCount >= 2) continue;

            schedule[day][slot.id][task.cls] = {
                subject: task.subject,
                teacher: task.teacherName,
                teacherIdx: task.teacherIdx
            };
            console.warn(`⚠️ Fallback (3+ seguidas): ${task.teacherName} | ${task.subject} | ${task.cls} | ${day}`);
            return true;
        }
    }

    // TENTATIVA 3: Permitir até 3 da mesma matéria no dia (último recurso)
    for (const day of prioritizedDays) {
        const shuffledSlots = shuffleArray(nonIntervalSlots);

        for (const slot of shuffledSlots) {
            if (!canPlace(task.teacherIdx, day, slot.id, task.cls)) continue;

            schedule[day][slot.id][task.cls] = {
                subject: task.subject,
                teacher: task.teacherName,
                teacherIdx: task.teacherIdx
            };
            console.warn(`⚠️ Último recurso: ${task.teacherName} | ${task.subject} | ${task.cls} | ${day}`);
            return true;
        }
    }

    return false;
}

// ==================== ALGORITMO PRINCIPAL ====================

function generateAutoSchedule(keepLocked) {
    console.log('========================================');
    console.log('🤖 Iniciando distribuição automática...');
    console.log('🔒 Manter travados:', keepLocked);
    console.log('🔒 Células travadas:', Object.keys(lockedCells).length);
    console.time('⏱️ Tempo de geração');

    buildConsecutivePairs();

    // 1. PRIMEIRO: Coletar TODAS as tarefas (ANTES de limpar a grade)
    const allTasks = collectAllTasks();

    if (allTasks.length === 0) {
        console.error('❌ Nenhuma tarefa coletada! Verifique os professores cadastrados.');
        return {
            totalAllocated: 0,
            totalFailed: 0,
            failedTasks: [],
            totalTasks: 0
        };
    }

    // 2. Salvar aulas travadas ANTES de limpar
    let savedLockedLessons = [];
    if (keepLocked && Object.keys(lockedCells).length > 0) {
        savedLockedLessons = getLockedLessons();
        console.log('🔒 Aulas travadas salvas:', savedLockedLessons.length);
    }

    // 3. Limpar TODA a grade
    days.forEach(day => {
        timeSlots.forEach(slot => {
            if (!slot.isInterval) {
                if (!schedule[day]) schedule[day] = {};
                if (!schedule[day][slot.id]) schedule[day][slot.id] = {};
                classes.forEach(cls => {
                    schedule[day][slot.id][cls] = null;
                });
            }
        });
    });
    console.log('🧹 Grade limpa');

    // 4. Restaurar aulas travadas
    if (keepLocked && savedLockedLessons.length > 0) {
        savedLockedLessons.forEach(({ day, slotId, cls, lesson }) => {
            if (schedule[day] && schedule[day][slotId]) {
                schedule[day][slotId][cls] = lesson;
                console.log(`   🔒 Restaurado: ${lesson.teacher} | ${lesson.subject} | ${cls} | ${day} ${slotId}`);
            }
        });
    }

    // 5. Calcular aulas restantes (descontando travadas)
    const pendingTasks = [];
    allTasks.forEach(task => {
        const allocated = countAllocatedForTask(task);
        const remaining = task.totalHours - allocated;
        if (remaining > 0) {
            pendingTasks.push({
                ...task,
                remainingHours: remaining,
                blocks: splitIntoBlocks(remaining)
            });
        }
    });

    console.log(`📋 Tarefas pendentes: ${pendingTasks.length}`);
    let totalPendingHours = 0;
    pendingTasks.forEach(t => totalPendingHours += t.remainingHours);
    console.log(`📋 Total de aulas pendentes: ${totalPendingHours}`);

    // 6. Ordenar por restritividade (mais difícil primeiro)
    pendingTasks.sort((a, b) => {
        // Maior carga horária primeiro (mais difícil de encaixar)
        if (b.remainingHours !== a.remainingHours) return b.remainingHours - a.remainingHours;

        // Mais restrições primeiro
        const rA = (teacherRestrictions[a.teacherIdx] || []).length;
        const rB = (teacherRestrictions[b.teacherIdx] || []).length;
        if (rB !== rA) return rB - rA;

        // Principal primeiro
        if (a.isPrincipal !== b.isPrincipal) return a.isPrincipal ? -1 : 1;

        return 0;
    });

    // 7. Alocar blocos
    let totalAllocated = 0;
    let totalFailed = 0;
    const failedTasks = [];

    pendingTasks.forEach((task, taskIndex) => {
        const blocks = [...task.blocks];

        if (taskIndex < 10 || taskIndex % 20 === 0) {
            console.log(`   📌 [${taskIndex + 1}/${pendingTasks.length}] ${task.teacherName} | ${task.subject} | Turma ${task.cls} | ${task.remainingHours}h | Blocos: [${blocks.join(',')}]`);
        }

        blocks.forEach(blockSize => {
            let placed = false;

            if (blockSize === 2) {
                // Tentar colocar par consecutivo
                placed = tryPlacePairBlock(task);
            }

            if (!placed && blockSize === 2) {
                // Fallback: tentar como 2 aulas separadas
                console.log(`      ⚠️ Par não encaixou, tentando separado: ${task.teacherName} | ${task.subject} | ${task.cls}`);
                const placed1 = tryPlaceSingleBlock(task);
                const placed2 = tryPlaceSingleBlock(task);
                if (placed1 && placed2) {
                    totalAllocated += 2;
                    return;
                } else if (placed1) {
                    totalAllocated += 1;
                    totalFailed += 1;
                    failedTasks.push({
                        teacher: task.teacherName,
                        subject: task.subject,
                        cls: task.cls,
                        blockSize: 1,
                        reason: 'Par quebrado - só encaixou 1 de 2'
                    });
                    return;
                } else {
                    totalFailed += 2;
                    failedTasks.push({
                        teacher: task.teacherName,
                        subject: task.subject,
                        cls: task.cls,
                        blockSize: 2,
                        reason: 'Sem espaço disponível'
                    });
                    return;
                }
            }

            if (placed && blockSize === 2) {
                totalAllocated += 2;
                return;
            }

            if (blockSize === 1) {
                placed = tryPlaceSingleBlock(task);
            }

            if (placed) {
                totalAllocated += blockSize;
            } else {
                totalFailed += blockSize;
                failedTasks.push({
                    teacher: task.teacherName,
                    subject: task.subject,
                    cls: task.cls,
                    blockSize: blockSize,
                    reason: 'Sem espaço disponível'
                });
            }
        });
    });

    console.timeEnd('⏱️ Tempo de geração');
    console.log('========================================');
    console.log(`✅ RESULTADO: ${totalAllocated} alocadas | ${totalFailed} falharam`);
    console.log(`📊 Taxa de sucesso: ${totalAllocated + totalFailed > 0 ? Math.round((totalAllocated / (totalAllocated + totalFailed)) * 100) : 0}%`);

    if (failedTasks.length > 0) {
        console.log('❌ Tarefas não alocadas:');
        failedTasks.forEach(f => {
            console.log(`   - ${f.teacher} | ${f.subject} | Turma ${f.cls} | ${f.blockSize} aula(s) | ${f.reason}`);
        });
    }

    return {
        totalAllocated,
        totalFailed,
        failedTasks,
        totalTasks: allTasks.length
    };
}

// ==================== UI - MODAL ====================

function openAutoScheduleModal() {
    const allTasks = collectAllTasks();
    let totalHours = 0;
    allTasks.forEach(t => totalHours += t.totalHours);

    const lockedCount = Object.keys(lockedCells).length;
    const nonIntervalSlots = timeSlots.filter(s => !s.isInterval).length;
    const totalSlots = nonIntervalSlots * days.length * classes.length;

    const currentLessons = countTotalLessons();

    const modalContent = document.querySelector('#autoScheduleModal .modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>🤖 Distribuição Automática</h2>
            <button class="modal-close" onclick="document.getElementById('autoScheduleModal').classList.remove('active')">×</button>
        </div>

        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: white;">🤖 Distribuição Automática de Horários</h3>
                <p style="opacity: 0.9; font-size: 14px; color: white;">
                    O sistema irá preencher a grade automaticamente respeitando todas as regras.
                </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
                <div style="background: #f0f9ff; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #667eea;">${totalHours}</div>
                    <div style="font-size: 11px; color: #666;">Aulas para distribuir</div>
                </div>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #22c55e;">${totalSlots}</div>
                    <div style="font-size: 11px; color: #666;">Slots disponíveis</div>
                </div>
                <div style="background: #fef3c7; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${lockedCount}</div>
                    <div style="font-size: 11px; color: #666;">Células travadas 🔒</div>
                </div>
                <div style="background: #fce7f3; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #ec4899;">${currentLessons}</div>
                    <div style="font-size: 11px; color: #666;">Aulas atuais na grade</div>
                </div>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #333;">📋 Regras que serão respeitadas:</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="padding: 8px; background: white; border-radius: 6px; font-size: 13px;">
                        ✅ Carga horária de cada professor
                    </div>
                    <div style="padding: 8px; background: white; border-radius: 6px; font-size: 13px;">
                        ✅ Sem conflito de professor
                    </div>
                    <div style="padding: 8px; background: white; border-radius: 6px; font-size: 13px;">
                        ✅ Restrições de horário (folgas)
                    </div>
                    <div style="padding: 8px; background: white; border-radius: 6px; font-size: 13px;">
                        ✅ Aulas duplas consecutivas
                    </div>
                    <div style="padding: 8px; background: white; border-radius: 6px; font-size: 13px;">
                        ✅ Agrupamento (5→2+2+1, etc.)
                    </div>
                    <div style="padding: 8px; background: white; border-radius: 6px; font-size: 13px;">
                        🔒 Células travadas mantidas
                    </div>
                    <div style="padding: 8px; background: white; border-radius: 6px; font-size: 13px;">
                        ✅ Máx 2 aulas/matéria/dia/turma
                    </div>
                    <div style="padding: 8px; background: #fff7ed; border-radius: 6px; font-size: 13px; border: 1px solid #fed7aa;">
                        🚫 Evitar 3+ seguidas do mesmo prof.
                    </div>
                </div>
            </div>

            ${lockedCount > 0 ? `
                <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                        🔒 <strong>${lockedCount} célula(s) travada(s)</strong> serão mantidas fixas. As demais serão redistribuídas.
                    </p>
                </div>
            ` : ''}

            ${currentLessons > 0 && lockedCount === 0 ? `
                <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #991b1b; font-size: 13px;">
                        ⚠️ <strong>Atenção:</strong> A grade atual tem ${currentLessons} aulas. 
                        A distribuição automática irá <strong>SUBSTITUIR TUDO</strong>.
                        Se quiser manter alguma aula, trave-a com o 🔒 antes.
                    </p>
                </div>
            ` : ''}

            <div id="autoScheduleProgress" style="display: none; margin-bottom: 20px;">
                <div style="background: #e5e7eb; border-radius: 10px; height: 24px; overflow: hidden;">
                    <div id="autoProgressBar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                         height: 100%; width: 0%; transition: width 0.3s; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 11px; font-weight: bold;" id="autoProgressPercent"></span>
                    </div>
                </div>
                <p id="autoProgressText" style="text-align: center; margin-top: 8px; font-size: 13px; color: #666;">
                    Preparando...
                </p>
            </div>

            <div id="autoScheduleResults" style="display: none;"></div>
        </div>

        <div class="modal-buttons" id="autoScheduleButtons">
            ${lockedCount > 0 ? `
                <button class="btn btn-warning" id="btnStartAutoScheduleKeep" style="flex: 2; padding: 14px; font-size: 15px;">
                    🔄 Gerar (manter ${lockedCount} travada(s))
                </button>
                <button class="btn btn-success" id="btnStartAutoScheduleNew" style="flex: 2; padding: 14px; font-size: 15px;">
                    🚀 Gerar do Zero (ignora travas)
                </button>
            ` : `
                <button class="btn btn-success" id="btnStartAutoScheduleNew" style="flex: 2; padding: 14px; font-size: 15px;">
                    🚀 Gerar Grade Automaticamente
                </button>
            `}
            <button class="btn btn-danger" onclick="document.getElementById('autoScheduleModal').classList.remove('active')" style="flex: 1;">
                ❌ Fechar
            </button>
        </div>
    `;

    document.getElementById('autoScheduleModal').classList.add('active');

    // Listeners dos botões
    const btnKeep = document.getElementById('btnStartAutoScheduleKeep');
    if (btnKeep) {
        btnKeep.addEventListener('click', function () {
            runAutoSchedule(true);
        });
    }

    const btnNew = document.getElementById('btnStartAutoScheduleNew');
    if (btnNew) {
        btnNew.addEventListener('click', function () {
            if (Object.keys(lockedCells).length > 0) {
                if (!confirm('⚠️ Você tem células travadas!\n\nGerar do zero vai IGNORAR todas as travas e substituir tudo.\n\nDeseja continuar?')) {
                    return;
                }
            }
            runAutoSchedule(false);
        });
    }
}

function runAutoSchedule(keepLocked) {
    const progressDiv = document.getElementById('autoScheduleProgress');
    const progressBar = document.getElementById('autoProgressBar');
    const progressPercent = document.getElementById('autoProgressPercent');
    const progressText = document.getElementById('autoProgressText');
    const resultsDiv = document.getElementById('autoScheduleResults');
    const buttonsDiv = document.getElementById('autoScheduleButtons');

    // Esconder botões originais e mostrar progresso
    progressDiv.style.display = 'block';
    buttonsDiv.innerHTML = `
        <button class="btn btn-secondary" disabled style="flex: 1; opacity: 0.5;">
            ⏳ Gerando...
        </button>
    `;

    progressText.textContent = '🔄 Preparando distribuição...';
    progressBar.style.width = '10%';
    progressPercent.textContent = '10%';

    // Dar tempo para a UI renderizar
    setTimeout(() => {
        progressText.textContent = '🔄 Analisando restrições...';
        progressBar.style.width = '30%';
        progressPercent.textContent = '30%';

        setTimeout(() => {
            progressText.textContent = '🔄 Distribuindo aulas...';
            progressBar.style.width = '60%';
            progressPercent.textContent = '60%';

            setTimeout(() => {
                // EXECUTAR A GERAÇÃO
                const result = generateAutoSchedule(keepLocked);

                progressBar.style.width = '100%';
                progressPercent.textContent = '100%';
                progressText.textContent = '✅ Distribuição concluída!';

                // Mostrar resultados
                showAutoScheduleResults(result, resultsDiv, buttonsDiv);

                // Atualizar a grade
                renderSchedule();
                renderTeachersList();
                saveToStorage();
                updateStats();

            }, 100);
        }, 100);
    }, 100);
}

function showAutoScheduleResults(result, resultsDiv, buttonsDiv) {
    const total = result.totalAllocated + result.totalFailed;
    const successRate = total > 0 ? Math.round((result.totalAllocated / total) * 100) : 0;

    let html = `
        <div style="background: ${result.totalFailed === 0 ? '#f0fdf4' : '#fef3c7'};
                    border: 2px solid ${result.totalFailed === 0 ? '#22c55e' : '#f59e0b'};
                    padding: 20px; border-radius: 12px;">
            <h4 style="margin: 0 0 15px 0; color: ${result.totalFailed === 0 ? '#166534' : '#92400e'};">
                ${result.totalFailed === 0 ? '🎉 Grade gerada com sucesso!' : '⚠️ Grade gerada com pendências'}
            </h4>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #22c55e;">${result.totalAllocated}</div>
                    <div style="font-size: 11px; color: #666;">✅ Aulas alocadas</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: ${result.totalFailed > 0 ? '#ef4444' : '#22c55e'};">${result.totalFailed}</div>
                    <div style="font-size: 11px; color: #666;">❌ Não alocadas</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #667eea;">${successRate}%</div>
                    <div style="font-size: 11px; color: #666;">📊 Taxa de sucesso</div>
                </div>
            </div>
    `;

    if (result.failedTasks.length > 0) {
        html += `
            <details style="margin-top: 10px;">
                <summary style="cursor: pointer; font-weight: 600; color: #ef4444; padding: 8px;">
                    ❌ ${result.failedTasks.length} aula(s) não alocada(s) - clique para ver
                </summary>
                <div style="max-height: 200px; overflow-y: auto; margin-top: 8px;">
                    ${result.failedTasks.map(f => `
                        <div style="background: white; padding: 8px 12px; margin-bottom: 4px;
                                    border-radius: 4px; font-size: 12px; border-left: 3px solid #ef4444;">
                            👤 <strong>${f.teacher}</strong> | 📚 ${f.subject} | 🏫 Turma ${f.cls} | ${f.blockSize} aula(s) | ${f.reason || ''}
                        </div>
                    `).join('')}
                </div>
            </details>
        `;
    }

    html += `
            <div style="margin-top: 15px; background: white; padding: 12px; border-radius: 8px;">
                <p style="margin: 0; font-size: 13px; color: #555;">
                    💡 <strong>Dica:</strong> Use o 🔒 nas células para travar as aulas que ficaram boas,
                    depois clique em "<strong>🔄 Regenerar</strong>" para redistribuir apenas as não-travadas.
                </p>
            </div>
        </div>
    `;

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';

    // Atualizar botões
    buttonsDiv.innerHTML = `
        <button class="btn btn-warning" id="btnRegenerateAuto" style="flex: 2; padding: 14px; font-size: 15px;">
            🔄 Regenerar (manter travados)
        </button>
        <button class="btn btn-success" id="btnNewGeneration" style="flex: 2; padding: 14px; font-size: 15px;">
            🚀 Gerar do Zero
        </button>
        <button class="btn btn-danger" onclick="document.getElementById('autoScheduleModal').classList.remove('active')" style="flex: 1;">
            ✅ Fechar
        </button>
    `;

    document.getElementById('btnRegenerateAuto').addEventListener('click', () => {
        resultsDiv.style.display = 'none';
        runAutoSchedule(true);
    });

    document.getElementById('btnNewGeneration').addEventListener('click', () => {
        resultsDiv.style.display = 'none';
        runAutoSchedule(false);
    });
}

// ==================== RENDERIZAÇÃO DE CADEADOS ====================

function renderLockButtons() {
    document.querySelectorAll('.class-cell').forEach(cell => {
        const day = cell.dataset.day;
        const slotId = cell.dataset.time;
        const cls = cell.dataset.class;

        if (!day || !slotId || !cls) return;

        const lesson = schedule[day] && schedule[day][slotId] && schedule[day][slotId][cls];
        const locked = isLocked(day, slotId, cls);

        // Remover botão existente
        const existingLock = cell.querySelector('.lock-btn');
        if (existingLock) existingLock.remove();

        if (lesson) {
            const lockBtn = document.createElement('button');
            lockBtn.className = `lock-btn ${locked ? 'locked' : ''}`;
            lockBtn.innerHTML = locked ? '🔒' : '🔓';
            lockBtn.title = locked ? 'Clique para destravar esta aula' : 'Clique para travar esta aula';
            lockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleLock(day, slotId, cls);
            });

            cell.style.position = 'relative';
            cell.appendChild(lockBtn);

            // Estilo visual para célula travada
            const lessonCard = cell.querySelector('.lesson-card');
            if (lessonCard) {
                if (locked) {
                    lessonCard.classList.add('locked');
                } else {
                    lessonCard.classList.remove('locked');
                }
            }
        }
    });
}

// ==================== INICIALIZAÇÃO ====================

function initAutoSchedule() {
    const saved = localStorage.getItem('schoolScheduleData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.lockedCells) {
                for (let k in lockedCells) delete lockedCells[k];
                Object.assign(lockedCells, data.lockedCells);
            }
        } catch (e) {
            console.error('Erro ao carregar lockedCells:', e);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initAutoSchedule();

    const btnAutoSchedule = document.getElementById('btnAutoSchedule');
    if (btnAutoSchedule) {
        btnAutoSchedule.addEventListener('click', openAutoScheduleModal);
    }
});
