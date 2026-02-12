#!/usr/bin/env python3
"""
Gerador Inteligente de Horário Escolar - Segunda-feira
Usa backtracking para garantir zero conflitos
"""

import json
import random
from collections import defaultdict
from copy import deepcopy

# Configurações
TURMAS = ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"]
SLOTS = list(range(1, 10))  # 9 horários
TEACHERS_OFF = ["Edmundo", "Cassiano", "Filosofia", "Física"]

# Atribuições professor/disciplina/turma (do CSV)
ASSIGNMENTS = {
    ("Arte", "101"): "Kelso", ("Arte", "102"): "Kelso", ("Arte", "103"): "Kelso", ("Arte", "104"): "Kelso",
    ("Arte", "201"): "Kelso", ("Arte", "202"): "Kelso", ("Arte", "203"): "Kelso", ("Arte", "204"): "Kelso",
    ("Arte", "301"): "Kelso", ("Arte", "302"): "Kelso",
    
    ("Educação Física", "101"): "Ed. Física", ("Educação Física", "102"): "Ed. Física",
    ("Educação Física", "103"): "Ed. Física", ("Educação Física", "104"): "Ed. Física",
    ("Educação Física", "201"): "Ed. Física", ("Educação Física", "202"): "Ed. Física",
    ("Educação Física", "203"): "Ed. Física", ("Educação Física", "204"): "Ed. Física",
    ("Educação Física", "301"): "Ed. Física", ("Educação Física", "302"): "Ed. Física",
    
    ("Língua Inglesa", "101"): "Vanessa", ("Língua Inglesa", "102"): "Vanessa",
    ("Língua Inglesa", "103"): "Vanessa", ("Língua Inglesa", "104"): "Vanessa",
    ("Língua Inglesa", "201"): "Vanessa", ("Língua Inglesa", "202"): "Vanessa",
    ("Língua Inglesa", "203"): "Vanessa", ("Língua Inglesa", "204"): "Vanessa",
    ("Língua Inglesa", "301"): "Vanessa", ("Língua Inglesa", "302"): "Vanessa",
    
    ("Língua Portuguesa", "101"): "Port 1", ("Língua Portuguesa", "102"): "Port 1",
    ("Língua Portuguesa", "103"): "Port 1", ("Língua Portuguesa", "104"): "Port 2",
    ("Língua Portuguesa", "201"): "Port 2", ("Língua Portuguesa", "202"): "Eunice",
    ("Língua Portuguesa", "203"): "Eunice", ("Língua Portuguesa", "204"): "Eunice",
    ("Língua Portuguesa", "301"): "Eliana", ("Língua Portuguesa", "302"): "Eliana",
    
    ("Matemática", "101"): "Lucidalva", ("Matemática", "102"): "Lucidalva",
    ("Matemática", "103"): "Lucidalva", ("Matemática", "104"): "Luiz",
    ("Matemática", "201"): "Rogério", ("Matemática", "202"): "Rogério",
    ("Matemática", "203"): "Milton", ("Matemática", "204"): "Milton",
    ("Matemática", "301"): "Luiz", ("Matemática", "302"): "Milton",
    
    ("Biologia", "101"): "Biologia", ("Biologia", "102"): "Biologia",
    ("Biologia", "103"): "Biologia", ("Biologia", "104"): "Biologia",
    ("Biologia", "201"): "Biologia", ("Biologia", "202"): "Biologia",
    ("Biologia", "203"): "Biologia", ("Biologia", "204"): "Biologia",
    ("Biologia", "301"): "Biologia", ("Biologia", "302"): "Biologia",
    
    ("História", "101"): "Elenflávia", ("História", "102"): "Elenflávia",
    ("História", "103"): "Elenflávia", ("História", "104"): "Elenflávia",
    ("História", "201"): "Elenflávia", ("História", "202"): "Elenflávia",
    ("História", "203"): "Elenflávia", ("História", "204"): "Elenflávia",
    ("História", "301"): "Elenflávia", ("História", "302"): "Elenflávia",
    
    ("Geografia", "101"): "Lucílio", ("Geografia", "102"): "Lucílio",
    ("Geografia", "103"): "Lucílio", ("Geografia", "104"): "Lucílio",
    ("Geografia", "201"): "Lucílio", ("Geografia", "202"): "Lucílio",
    ("Geografia", "203"): "Lucílio", ("Geografia", "204"): "Lucílio",
    ("Geografia", "301"): "Lucílio", ("Geografia", "302"): "Lucílio",
    
    ("Técnico", "104"): "Marília",
    ("Técnico", "204"): "Marília",
}

# Limites semanais (segunda = 1 dia de 4 dias úteis, então ~25% da carga)
WEEKLY_LIMITS = {
    "101": {"Arte": 2, "Educação Física": 1, "Língua Inglesa": 1, "Língua Portuguesa": 3, "Matemática": 3, "Biologia": 2, "História": 2, "Geografia": 2},
    "102": {"Arte": 2, "Educação Física": 1, "Língua Inglesa": 1, "Língua Portuguesa": 3, "Matemática": 3, "Biologia": 2, "História": 2, "Geografia": 2},
    "103": {"Arte": 2, "Educação Física": 1, "Língua Inglesa": 1, "Língua Portuguesa": 3, "Matemática": 3, "Biologia": 2, "História": 2, "Geografia": 2},
    "104": {"Arte": 2, "Educação Física": 1, "Língua Inglesa": 1, "Língua Portuguesa": 3, "Matemática": 3, "Biologia": 2, "História": 2, "Geografia": 2, "Técnico": 12},
    "201": {"Arte": 1, "Educação Física": 2, "Língua Inglesa": 1, "Língua Portuguesa": 4, "Matemática": 4, "Biologia": 2, "História": 2, "Geografia": 2},
    "202": {"Arte": 1, "Educação Física": 2, "Língua Inglesa": 1, "Língua Portuguesa": 4, "Matemática": 4, "Biologia": 2, "História": 2, "Geografia": 2},
    "203": {"Arte": 1, "Educação Física": 2, "Língua Inglesa": 1, "Língua Portuguesa": 4, "Matemática": 4, "Biologia": 2, "História": 2, "Geografia": 2},
    "204": {"Arte": 1, "Educação Física": 2, "Língua Inglesa": 1, "Língua Portuguesa": 4, "Matemática": 4, "Biologia": 2, "História": 2, "Geografia": 2, "Técnico": 8},
    "301": {"Arte": 1, "Educação Física": 1, "Língua Inglesa": 2, "Língua Portuguesa": 4, "Matemática": 4, "Biologia": 2, "História": 2, "Geografia": 2},
    "302": {"Arte": 1, "Educação Física": 1, "Língua Inglesa": 2, "Língua Portuguesa": 4, "Matemática": 4, "Biologia": 2, "História": 2, "Geografia": 2},
}

def generate_schedule():
    """Gera horário usando backtracking"""
    schedule = {str(slot): {} for slot in SLOTS}
    subject_count = defaultdict(lambda: defaultdict(int))
    
    # Criar lista de todas as alocações necessárias
    allocations = []
    teacher_counts = defaultdict(int)
    
    # Randomize processing order to distribute "missed" lessons fairly
    turmas_shuffled = list(TURMAS)
    random.shuffle(turmas_shuffled)
    
    for turma in turmas_shuffled:
        # Get subjects for this class
        subjects_list = list(WEEKLY_LIMITS[turma].items())
        random.shuffle(subjects_list)
        
        for subject, limit in subjects_list:
            teacher = ASSIGNMENTS.get((subject, turma))
            if teacher and teacher not in TEACHERS_OFF:
                
                # Check teacher limit (max 9 slots)
                if teacher_counts[teacher] >= 9:
                    continue
                    
                # Alocar ~25% da carga semanal na segunda (1-2 aulas)
                # CHANGE: Limit to 1 lesson per subject per day to fit 9 slots
                num_aulas = 1
                
                # For Technical subject with 12h/8h, maybe allow 2 if space?
                # But to be safe and avoid conflicts, let's keep 1 for now unless requested.
                # If we want 2 for Técnico, we check limit again.
                
                for _ in range(num_aulas):
                    if teacher_counts[teacher] < 9:
                        allocations.append((turma, subject, teacher))
                        teacher_counts[teacher] += 1
    
    random.shuffle(allocations)
    
    def can_place(slot, turma, teacher):
        """Verifica se pode colocar professor nesse slot"""
        if turma in schedule[str(slot)]:
            return False
        # Verifica conflito de professor
        for t, lesson in schedule[str(slot)].items():
            if lesson["teacher"] == teacher:
                return False
        return True
    
    def backtrack(idx):
        """Backtracking recursivo"""
        if idx == len(allocations):
            return True
        
        turma, subject, teacher = allocations[idx]
        
        # Tentar cada slot
        slots_shuffled = list(SLOTS)
        random.shuffle(slots_shuffled)
        
        for slot in slots_shuffled:
            if can_place(slot, turma, teacher):
                schedule[str(slot)][turma] = {
                    "subject": subject,
                    "teacher": teacher,
                    "teacherIdx": 0  # Será preenchido depois
                }
                
                if backtrack(idx + 1):
                    return True
                
                # Desfazer
                del schedule[str(slot)][turma]
        
        return False
    
    if backtrack(0):
        return schedule
    else:
        return None

def main():
    print("Gerando horário de segunda-feira...")
    
    for attempt in range(10):
        print(f"Tentativa {attempt + 1}...")
        schedule = generate_schedule()
        
        if schedule:
            result = {
                "schedule": {"segunda": schedule},
                "teachers_off_monday": TEACHERS_OFF
            }
            
            with open("grade_segunda.json", "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=4)
            
            print("✅ Horário gerado com sucesso!")
            print("Salvo em grade_segunda.json")
            return
    
    print("❌ Não foi possível gerar horário sem conflitos")

if __name__ == "__main__":
    main()
