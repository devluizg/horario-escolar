#!/usr/bin/env python3
"""
Script de Validação de Horário Escolar
Valida horários contra regras de professores, turmas e limites semanais
Baseado na matriz curricular completa fornecida
"""

import json
import sys
from collections import defaultdict

# ==================== MATRIZ CURRICULAR ====================

# Limites semanais por disciplina/turma (número ao lado do professor no CSV)
WEEKLY_LIMITS = {
    # Turma 101 (1º Ano)
    "101": {
        "Arte": 2, "Educação Física": 1, "Língua Inglesa": 1, "Língua Portuguesa": 3,
        "Matemática": 3, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 2, "Filosofia": 2,
        "Aprofundamento de Ciências da Natureza": 2, "Eletiva": 2,
        "Estudo Orientado - Língua Portuguesa": 3, "Estudo Orientado - Matemática": 3,
        "PPA": 2, "Projeto de Vida": 1, "Práticas Experimentais": 1, "Educação Ambiental": 1
    },
    # Turma 102 (1º Ano)
    "102": {
        "Arte": 2, "Educação Física": 1, "Língua Inglesa": 1, "Língua Portuguesa": 3,
        "Matemática": 3, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 2, "Filosofia": 2,
        "Aprofundamento de Ciências Humanas": 2, "Eletiva": 2,
        "Estudo Orientado - Língua Portuguesa": 3, "Estudo Orientado - Matemática": 3,
        "PPA": 2, "Projeto de Vida": 1, "Práticas Experimentais": 1, "Educação Ambiental": 1
    },
    # Turma 103 (1º Ano)
    "103": {
        "Arte": 2, "Educação Física": 1, "Língua Inglesa": 1, "Língua Portuguesa": 3,
        "Matemática": 3, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 2, "Filosofia": 2,
        "Aprofundamento de Linguagens": 2, "Eletiva": 2,
        "Estudo Orientado - Língua Portuguesa": 3, "Estudo Orientado - Matemática": 3,
        "PPA": 2, "Projeto de Vida": 1, "Práticas Experimentais": 1, "Educação Ambiental": 1
    },
    # Turma 104 (1º Ano)
    "104": {
        "Arte": 2, "Educação Física": 1, "Língua Inglesa": 1, "Língua Portuguesa": 3,
        "Matemática": 3, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 2, "Filosofia": 2,
        "Componente Técnico": 12
    },
    # Turma 201 (2º Ano)
    "201": {
        "Arte": 1, "Educação Física": 2, "Língua Inglesa": 1, "Língua Portuguesa": 4,
        "Matemática": 4, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 1, "Filosofia": 1,
        "Aprofundamento de Linguagens": 2, "Eletiva": 2,
        "Estudo Orientado - Língua Portuguesa": 3, "Estudo Orientado - Matemática": 3,
        "PPA": 2, "Projeto de Vida": 1, "Práticas Experimentais": 1, "Educação Ambiental": 1
    },
    # Turma 202 (2º Ano)
    "202": {
        "Arte": 1, "Educação Física": 2, "Língua Inglesa": 1, "Língua Portuguesa": 4,
        "Matemática": 4, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 1, "Filosofia": 1,
        "Aprofundamento de Matemática": 2, "Eletiva": 2,
        "Estudo Orientado - Língua Portuguesa": 3, "Estudo Orientado - Matemática": 3,
        "PPA": 2, "Projeto de Vida": 1, "Práticas Experimentais": 1, "Educação Ambiental": 1
    },
    # Turma 203 (2º Ano)
    "203": {
        "Arte": 1, "Educação Física": 2, "Língua Inglesa": 1, "Língua Portuguesa": 4,
        "Matemática": 4, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 1, "Filosofia": 1,
        "Aprofundamento de Linguagens": 2, "Eletiva": 2,
        "Estudo Orientado - Língua Portuguesa": 3, "Estudo Orientado - Matemática": 3,
        "PPA": 2, "Projeto de Vida": 1, "Práticas Experimentais": 1, "Educação Ambiental": 1
    },
    # Turma 204 (2º Ano)
    "204": {
        "Arte": 1, "Educação Física": 2, "Língua Inglesa": 1, "Língua Portuguesa": 4,
        "Matemática": 4, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 1, "Filosofia": 1,
        "Componente Técnico": 12
    },
    # Turma 301 (3º Ano)
    "301": {
        "Arte": 1, "Educação Física": 1, "Língua Inglesa": 2, "Língua Portuguesa": 4,
        "Matemática": 4, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 1, "Filosofia": 1,
        "Aprofundamento de Matemática": 2, "Eletiva": 2,
        "Estudo Orientado - Língua Portuguesa": 3, "Estudo Orientado - Matemática": 3,
        "PPA": 2, "Projeto de Vida": 1, "Práticas Experimentais": 1, "Educação Ambiental": 1
    },
    # Turma 302 (3º Ano)
    "302": {
        "Arte": 1, "Educação Física": 1, "Língua Inglesa": 2, "Língua Portuguesa": 4,
        "Matemática": 4, "Química": 2, "Física": 2, "Biologia": 2, "História": 2,
        "Geografia": 2, "Sociologia": 1, "Filosofia": 1,
        "Aprofundamento de Matemática": 2, "Eletiva": 2,
        "Estudo Orientado - Língua Portuguesa": 3, "Estudo Orientado - Matemática": 3,
        "PPA": 2, "Projeto de Vida": 1, "Práticas Experimentais": 1, "Educação Ambiental": 1
    }
}

# Atribuições de professores por disciplina/turma (baseado no CSV)
TEACHER_ASSIGNMENTS = {
    "Arte": {
        "101": "Kelso", "102": "Kelso", "103": "Kelso", "104": "Kelso",
        "201": "Kelso", "202": "Kelso", "203": "Kelso", "204": "Kelso",
        "301": "Kelso", "302": "Kelso"
    },
    "Educação Física": {
        "101": "Ed. Física", "102": "Ed. Física", "103": "Ed. Física", "104": "Ed. Física",
        "201": "Ed. Física", "202": "Ed. Física", "203": "Ed. Física", "204": "Ed. Física",
        "301": "Ed. Física", "302": "Ed. Física"
    },
    "Língua Inglesa": {
        "101": "Vanessa", "102": "Vanessa", "103": "Vanessa", "104": "Vanessa",
        "201": "Vanessa", "202": "Vanessa", "203": "Vanessa", "204": "Vanessa",
        "301": "Vanessa", "302": "Vanessa"
    },
    "Língua Portuguesa": {
        "101": "Port 1", "102": "Port 1", "103": "Port 1", "104": "Port 2",
        "201": "Port 2", "202": "Eunice", "203": "Eunice", "204": "Eunice",
        "301": "Eliana", "302": "Eliana"
    },
    "Matemática": {
        "101": "Lucidalva", "102": "Lucidalva", "103": "Lucidalva", "104": "Luiz",
        "201": "Rogério", "202": "Rogério", "203": "Milton", "204": "Milton",
        "301": "Luiz", "302": "Milton"
    },
    "Química": {
        "101": "Edmundo", "102": "Edmundo", "103": "Edmundo", "104": "Edmundo",
        "201": "Edmundo", "202": "Edmundo", "203": "Edmundo", "204": "Edmundo",
        "301": "Edmundo", "302": "Edmundo"
    },
    "Física": {
        "101": "Física", "102": "Física", "103": "Física", "104": "Física",
        "201": "Física", "202": "Física", "203": "Física", "204": "Física",
        "301": "Física", "302": "Física"
    },
    "Biologia": {
        "101": "Biologia", "102": "Biologia", "103": "Biologia", "104": "Biologia",
        "201": "Biologia", "202": "Biologia", "203": "Biologia", "204": "Biologia",
        "301": "Biologia", "302": "Biologia"
    },
    "História": {
        "101": "Elenflávia", "102": "Elenflávia", "103": "Elenflávia", "104": "Elenflávia",
        "201": "Elenflávia", "202": "Elenflávia", "203": "Elenflávia", "204": "Elenflávia",
        "301": "Elenflávia", "302": "Elenflávia"
    },
    "Geografia": {
        "101": "Lucílio", "102": "Lucílio", "103": "Lucílio", "104": "Lucílio",
        "201": "Lucílio", "202": "Lucílio", "203": "Lucílio", "204": "Lucílio",
        "301": "Lucílio", "302": "Lucílio"
    },
    "Sociologia": {
        "101": "Cassiano", "102": "Cassiano", "103": "Cassiano", "104": "Cassiano",
        "201": "Cassiano", "202": "Cassiano", "203": "Cassiano", "204": "Cassiano",
        "301": "Cassiano", "302": "Cassiano"
    },
    "Filosofia": {
        "101": "Filosofia", "102": "Filosofia", "103": "Filosofia", "104": "Filosofia",
        "201": "Filosofia", "202": "Filosofia", "203": "Filosofia", "204": "Filosofia",
        "301": "Filosofia", "302": "Filosofia"
    },
    # Itinerários Formativos
    "Aprofundamento de Ciências da Natureza": {
        "101": "Física"
    },
    "Aprofundamento de Ciências Humanas": {
        "102": "Cassiano"
    },
    "Aprofundamento de Linguagens": {
        "103": "Vanessa", "201": "Port 1", "203": "Port 2"
    },
    "Aprofundamento de Matemática": {
        "202": "Milton", "204": "Lucidalva", "301": "Eliana", "302": "Lucidalva"
    },
    "Eletiva": {
        "101": "Luiz", "102": "Elenflávia", "103": "Filosofia",
        "201": "Kelso", "202": "Rogério", "203": "Vanessa",
        "301": "Ed. Física", "302": "Eliana"
    },
    "Estudo Orientado - Língua Portuguesa": {
        "101": "Port 1", "102": "Port 1", "103": "Port 1",
        "201": "Port 2", "202": "Eunice", "203": "Eunice",
        "301": "Eliana", "302": "Eliana"
    },
    "Estudo Orientado - Matemática": {
        "101": "Lucidalva", "102": "Lucidalva", "103": "Lucidalva",
        "201": "Rogério", "202": "Rogério", "203": "Milton",
        "301": "Luiz", "302": "Milton"
    },
    "PPA": {
        "101": "Elenflávia", "102": "Luiz", "103": "Vanessa",
        "201": "Filosofia", "202": "Kelso", "203": "Rogério",
        "301": "Eliana", "302": "Ed. Física"
    },
    "Projeto de Vida": {
        "101": "Kelso", "102": "Kelso", "103": "Kelso",
        "201": "Ed. Física", "202": "Ed. Física", "203": "Ed. Física",
        "301": "Vanessa", "302": "Vanessa"
    },
    "Práticas Experimentais": {
        "101": "Edmundo", "102": "Edmundo", "103": "Edmundo",
        "201": "Física", "202": "Física", "203": "Física",
        "301": "Biologia", "302": "Biologia"
    },
    "Educação Ambiental": {
        "101": "Lucílio", "102": "Lucílio", "103": "Lucílio", "104": "Lucílio",
        "201": "Lucílio", "202": "Lucílio", "203": "Biologia", "204": "Biologia",
        "301": "Biologia", "302": "Biologia"
    }
}

# Professores de folga por dia
TEACHERS_OFF = {
    "segunda": ["Edmundo", "Cassiano", "Filosofia", "Física"],
    "terca": ["Ed. Física", "Vanessa", "Elenflávia", "Geografia"],
    "quinta": ["Lucílio", "Milton", "Eliana", "Port 2", "Eunice"],
    "sexta": ["Luiz", "Kelso", "Lucidalva", "Rogério", "Port 1"]
}

# ==================== FUNÇÕES DE VALIDAÇÃO ====================

def validate_schedule(schedule_data, filename):
    """Valida o horário completo"""
    errors = []
    warnings = []
    
    schedule = schedule_data.get("schedule", {})
    
    # Contadores
    subject_count = defaultdict(lambda: defaultdict(int))
    teacher_lessons = defaultdict(int)
    
    # Validar cada dia
    for day, slots in schedule.items():
        day_name = day.upper()
        teachers_off_today = TEACHERS_OFF.get(day, [])
        
        # Validar cada horário
        for slot, classes in slots.items():
            teachers_in_slot = defaultdict(list)
            
            # Validar cada turma
            for turma, lesson in classes.items():
                subject = lesson.get("subject")
                teacher = lesson.get("teacher")
                
                if not subject or not teacher:
                    continue
                
                # Contar aulas
                subject_count[turma][subject] += 1
                teacher_lessons[teacher] += 1
                
                # Verificar conflito de professor
                teachers_in_slot[teacher].append(turma)
                
                # Verificar se professor está de folga
                if teacher in teachers_off_today:
                    errors.append(f"[{day_name}] {teacher} está de FOLGA mas foi escalado na turma {turma} (horário {slot})")
                
                # Verificar se professor pode dar essa disciplina nessa turma
                if subject in TEACHER_ASSIGNMENTS:
                    expected_teacher = TEACHER_ASSIGNMENTS[subject].get(turma)
                    if expected_teacher and teacher != expected_teacher:
                        errors.append(f"[{day_name}] {teacher} NÃO pode dar {subject} na turma {turma} (deveria ser {expected_teacher})")
            
            # Verificar conflitos de professor no mesmo horário
            for teacher, turmas in teachers_in_slot.items():
                if len(turmas) > 1:
                    errors.append(f"[{day_name}] CONFLITO: {teacher} no horário {slot} (turmas {', '.join(turmas)})")
    
    # Verificar limites semanais
    for turma, subjects in subject_count.items():
        for subject, count in subjects.items():
            limit = WEEKLY_LIMITS.get(turma, {}).get(subject, 0)
            if limit > 0 and count > limit:
                errors.append(f"[LIMITE SEMANAL] {subject} na turma {turma}: {count}h excede o limite de {limit}h")
    
    # Relatório
    print("=" * 60)
    print(f"VALIDAÇÃO: {filename}")
    print("=" * 60)
    print()
    
    if errors:
        print(f"❌ {len(errors)} ERRO(S):")
        for error in errors:
            print(f"   • {error}")
        print()
    else:
        print("✅ NENHUM ERRO ENCONTRADO!")
        print()
    
    if warnings:
        print(f"⚠️  {len(warnings)} AVISO(S):")
        for warning in warnings:
            print(f"   • {warning}")
        print()
    
    # Resumo de aulas por turma/disciplina
    print("📚 AULAS POR TURMA/DISCIPLINA:")
    print()
    for turma in sorted(subject_count.keys()):
        year = "1ano" if turma.startswith("1") else "2ano" if turma.startswith("2") else "3ano"
        print(f"  Turma {turma} ({year}):")
        for subject in sorted(subject_count[turma].keys()):
            count = subject_count[turma][subject]
            limit = WEEKLY_LIMITS.get(turma, {}).get(subject, 0)
            status = "✅" if count <= limit else "❌"
            print(f"    {status} {subject}: {count}h (limite semanal: {limit}h)")
        print()
    
    # Resumo de aulas por professor
    print("👨‍🏫 AULAS POR PROFESSOR:")
    for teacher in sorted(teacher_lessons.keys(), key=lambda t: teacher_lessons[t], reverse=True):
        count = teacher_lessons[teacher]
        status = "✅" if 5 <= count <= 8 else "⚠️"
        print(f"   {status} {teacher}: {count}")
    print()
    
    total_lessons = sum(teacher_lessons.values())
    print(f"📈 TOTAL: {total_lessons} aulas | {len(teacher_lessons)} professores")
    print()
    
    return len(errors) == 0

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 validate_schedule.py <arquivo.json>")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        is_valid = validate_schedule(data, filename)
        sys.exit(0 if is_valid else 1)
    
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {filename}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Erro ao ler JSON: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
