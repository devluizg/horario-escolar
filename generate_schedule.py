#!/usr/bin/env python3
"""
Gerador de Horário Escolar - Segunda-feira
Gera horário respeitando todas as restrições
"""

import json
import random
from collections import defaultdict

# Turmas
TURMAS_1ANO = ["101", "102", "103", "104"]
TURMAS_2ANO = ["201", "202", "203", "204"]
TURMAS_3ANO = ["301", "302"]
ALL_TURMAS = TURMAS_1ANO + TURMAS_2ANO + TURMAS_3ANO

# Professores ativos na segunda (18 - 4 de folga)
TEACHERS_OFF = ["Edmundo", "Cassiano", "Filosofia", "Física"]

# FGB por professor/turma
TEACHER_FGB = {
    "Biologia": {"subject": "Biologia", "turmas": ALL_TURMAS},
    "Ed. Física": {"subject": "Educação Física", "turmas": ALL_TURMAS},
    "Elenflávia": {"subject": "História", "turmas": ALL_TURMAS},
    "Eliana": {"subject": "Língua Portuguesa", "turmas": ["301", "302"]},
    "Eunice": {"subject": "Língua Portuguesa", "turmas": ["202", "203", "204"]},
    "Kelso": {"subject": "Arte", "turmas": ALL_TURMAS},
    "Lucidalva": {"subject": "Matemática", "turmas": ["101", "102", "103"]},
    "Lucílio": {"subject": "Geografia", "turmas": ALL_TURMAS},
    "Luiz": {"subject": "Matemática", "turmas": ["104", "301"]},
    "Milton": {"subject": "Matemática", "turmas": ["203", "204", "302"]},
    "Port 1": {"subject": "Língua Portuguesa", "turmas": ["101", "102", "103"]},
    "Port 2": {"subject": "Língua Portuguesa", "turmas": ["104", "201"]},
    "Rogério": {"subject": "Matemática", "turmas": ["201", "202"]},
    "Vanessa": {"subject": "Língua Inglesa", "turmas": ALL_TURMAS},
}

# Limites semanais
WEEKLY_LIMITS = {
    "1ano": {
        "Língua Portuguesa": 3, "Matemática": 3, "Geografia": 2, "História": 2,
        "Biologia": 2, "Língua Inglesa": 1, "Educação Física": 1, "Arte": 2
    },
    "2ano": {
        "Língua Portuguesa": 4, "Matemática": 4, "Geografia": 2, "História": 2,
        "Biologia": 2, "Língua Inglesa": 1, "Educação Física": 2, "Arte": 1
    },
    "3ano": {
        "Língua Portuguesa": 4, "Matemática": 4, "Geografia": 2, "História": 2,
        "Biologia": 2, "Língua Inglesa": 2, "Educação Física": 1, "Arte": 1
    }
}

def get_year(turma):
    if turma.startswith("1"): return "1ano"
    elif turma.startswith("2"): return "2ano"
    else: return "3ano"

def get_teachers_for_turma_subject(turma, subject):
    """Retorna lista de professores que podem dar essa matéria nessa turma"""
    teachers = []
    for teacher, info in TEACHER_FGB.items():
        if info["subject"] == subject and turma in info["turmas"]:
            teachers.append(teacher)
    return teachers

def generate_schedule():
    """Gera horário para segunda-feira"""
    schedule = {}
    subject_count = defaultdict(lambda: defaultdict(int))  # turma -> subject -> count
    
    for slot in range(1, 10):
        schedule[str(slot)] = {}
        used_teachers = set()
        
        # Ordena turmas para processar as mais restritas primeiro
        turmas_to_process = list(ALL_TURMAS)
        random.shuffle(turmas_to_process)
        
        for turma in turmas_to_process:
            year = get_year(turma)
            limits = WEEKLY_LIMITS[year]
            
            # Lista de disciplinas possíveis (ainda não atingiram o limite)
            possible_subjects = []
            for subject, limit in limits.items():
                if subject_count[turma][subject] < limit:
                    teachers = get_teachers_for_turma_subject(turma, subject)
                    available_teachers = [t for t in teachers if t not in used_teachers]
                    if available_teachers:
                        possible_subjects.append((subject, available_teachers))
            
            if not possible_subjects:
                print(f"AVISO: Sem opções para {turma} no slot {slot}")
                continue
            
            # Escolhe aleatoriamente
            random.shuffle(possible_subjects)
            subject, available_teachers = possible_subjects[0]
            teacher = available_teachers[0]
            
            schedule[str(slot)][turma] = {
                "subject": subject,
                "teacher": teacher,
                "teacherIdx": list(TEACHER_FGB.keys()).index(teacher)
            }
            used_teachers.add(teacher)
            subject_count[turma][subject] += 1
    
    return schedule

def main():
    best_schedule = None
    best_errors = 999
    
    for attempt in range(100):
        schedule = generate_schedule()
        
        # Verifica erros
        errors = 0
        for slot, classes in schedule.items():
            teachers_in_slot = [c["teacher"] for c in classes.values()]
            errors += len(teachers_in_slot) - len(set(teachers_in_slot))
        
        if errors < best_errors:
            best_errors = errors
            best_schedule = schedule
            if errors == 0:
                break
    
    print(f"Melhor resultado: {best_errors} conflitos")
    
    result = {
        "schedule": {"segunda": best_schedule},
        "teachers_off_monday": TEACHERS_OFF
    }
    
    with open("grade_segunda.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    
    print("Salvo em grade_segunda.json")

if __name__ == "__main__":
    main()
