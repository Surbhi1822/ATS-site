import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def compute_experience_score(text):
    years_match = re.search(r'([0-9]+)\s+years?', text, re.IGNORECASE)
    return int(years_match.group(1)) if years_match else 0

def compute_keyword_match(text, job_desc):
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform([text, job_desc])
    return cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0] * 100

def compute_certifications_score(text):
    certifications = ["PMP", "AWS Certified", "Scrum Master", "Six Sigma"]
    return sum(cert in text for cert in certifications) * 10

def compute_communication_score(text):
    return min(len(re.findall(r'\b(lead|managed|communicated|presented|negotiated)\b', text, re.IGNORECASE)) * 5, 100)

def compute_project_relevance(text, job_desc):
    return compute_keyword_match(text, job_desc) * 0.5

def compute_final_score(text, job_desc, job_role):
    weights = {
        "Software Engineer": [0.0, 0.5, 0.0, 0.5, 0.0],
        "Data Scientist": [0.0, 0.5, 0.0, 0.5, 0.0],
        "Sales Manager": [0.5, 0.0, 0.0, 0.5, 0.0],
        "HR Manager": [0.1, 0.3, 0.15, 0.2, 0.25]
    }
    scores = [
        compute_experience_score(text),
        compute_keyword_match(text, job_desc),
        compute_certifications_score(text),
        compute_communication_score(text),
        compute_project_relevance(text, job_desc)
    ]
    return sum(w * s for w, s in zip(weights[job_role], scores))