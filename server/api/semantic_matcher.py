import re
import string
import spacy
import torch
import numpy as np
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from .nltk_utils import ensure_nltk_data

# Ensure NLTK data is available
ensure_nltk_data()

class TextCleaner:
    def __init__(self) -> None:
        self.set_of_stopwords = set(stopwords.words("english") + list(string.punctuation))
        try:
            self.lemmatizer = WordNetLemmatizer()
            # Test lemmatizer to catch wordnet issues early
            _ = self.lemmatizer.lemmatize("test")
        except Exception as e:
            print(f"Lemmatizer fallback: {e}")
            self.lemmatizer = None

    def clean_text(self, raw_text: str) -> str:
        tokens = word_tokenize(raw_text.lower())
        tokens = [token for token in tokens if token not in self.set_of_stopwords]
        if self.lemmatizer:
            try:
                tokens = [self.lemmatizer.lemmatize(token) for token in tokens]
            except Exception as e:
                print(f"Lemmatization error during text cleaning: {e}")
        cleaned_text = " ".join(tokens)
        return cleaned_text

class ATS:
    RESUME_SECTIONS = [
        "Contact Information", "Objective", "Summary", "Education", "Experience", 
        "Skills", "Projects", "Certifications", "Licenses", "Awards", "Honors", 
        "Publications", "References", "Technical Skills", "Computer Skills", 
        "Programming Languages", "Software Skills", "Soft Skills", "Language Skills", 
        "Professional Skills", "Transferable Skills", "Work Experience", 
        "Professional Experience", "Employment History", "Internship Experience", 
        "Volunteer Experience", "Leadership Experience", "Research Experience", 
        "Teaching Experience",
    ]

    def __init__(self):
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except OSError:
            print("Warning: spaCy model 'en_core_web_sm' not found. Some features may be limited.")
            self.nlp = None
        
        # Initialize SentenceTransformer on the target device
        try:
            # Try GPU first, fallback to CPU if CUDA is unavailable
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            print(f"Initializing SentenceTransformer on device: {self.device}")
            self.model = SentenceTransformer('all-mpnet-base-v2', device=self.device)
            print("SentenceTransformer model loaded successfully")
        except Exception as e:
            print(f"Failed to load model on GPU: {e}. Falling back to CPU.")
            self.model = SentenceTransformer('all-mpnet-base-v2', device='cpu')

    def load_resume(self, resume_content):
        self.resume_content = resume_content

    def load_job_description(self, jd_content):
        self.jd_content = jd_content

    def extract_experience(self):
        experience_start = self.resume_content.lower().find("experience")
        if experience_start == -1:
            return ""
        experience_end = len(self.resume_content)
        for section in self.RESUME_SECTIONS:
            section_start = self.resume_content.lower().find(section.lower(), experience_start + 1)
            if section_start != -1:
                experience_end = min(experience_end, section_start)
        return self.resume_content[experience_start:experience_end].strip()

    def extract_skills(self):
        skills_pattern = re.compile(r'Skills\s*[:\n]', re.IGNORECASE)
        skills_match = skills_pattern.search(self.resume_content)
        if skills_match:
            skills_start = skills_match.end()
            skills_end = self.resume_content.find('\n\n', skills_start)
            skills_section = self.resume_content[skills_start:skills_end].strip()
            skills_lines = skills_section.split('\n')
            extracted_skills = []
            for line in skills_lines:
                line_skills = re.split(r'[:,-]', line)
                extracted_skills.extend([skill.strip() for skill in line_skills if skill.strip()])
            return list(set(extracted_skills))
        return []

    def clean_experience(self, experience):
        cleaner = TextCleaner()
        self.cleaned_experience = cleaner.clean_text(experience)

    def clean_skills(self, skills):
        cleaner = TextCleaner()
        self.cleaned_skills = cleaner.clean_text(skills)

    def clean_jd(self):
        cleaner = TextCleaner()
        return cleaner.clean_text(self.jd_content)

    def compute_similarity(self):
        cleaned_resume = self.cleaned_experience + " " + self.cleaned_skills
        cleaned_jd_text = self.clean_jd()
        resume_embedding = self.model.encode([cleaned_resume])
        jd_embedding = self.model.encode([cleaned_jd_text])
        similarity_score = cosine_similarity(resume_embedding, jd_embedding)[0][0]
        return similarity_score