import re
import string
import nltk
import numpy as np
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
import logging
from .nltk_utils import ensure_nltk_data

logger = logging.getLogger(__name__)

# Ensure NLTK data is available
ensure_nltk_data()

class TextCleaner:
    """
    A class used to clean text by removing stopwords, punctuation, and performing lemmatization.
    """
    def __init__(self) -> None:
        try:
            self.set_of_stopwords = set(stopwords.words("english") + list(string.punctuation))
            self.lemmatizer = WordNetLemmatizer()
        except Exception as e:
            logger.error(f"Error initializing TextCleaner: {e}")
            self.set_of_stopwords = set(string.punctuation)
            self.lemmatizer = None

    def clean_text(self, raw_text: str) -> str:
        try:
            tokens = word_tokenize(raw_text.lower())
            tokens = [token for token in tokens if token not in self.set_of_stopwords]
            
            if self.lemmatizer:
                tokens = [self.lemmatizer.lemmatize(token) for token in tokens]
            
            cleaned_text = " ".join(tokens)
            return cleaned_text
        except Exception as e:
            logger.error(f"Error cleaning text: {e}")
            # Fallback to simple cleaning
            return " ".join([word for word in raw_text.lower().split() 
                           if word not in self.set_of_stopwords])