def get_eligible_subjects(branch: str) -> list[str]:
    b = branch.strip().lower()
    if b in ["cse", "ai/ml", "data science"]:
        return ["ECE", "VLSI", "5G", "Mechanical", "Civil", "Electrical",]
    else:
        return ["CSE", "AI/ML", "Data Science"]
