import nltk
import logging

logger = logging.getLogger(__name__)

def ensure_nltk_data():
    """
    Ensure required NLTK data is downloaded.
    This function should be called once during application startup.
    """
    required_data = [
        ('tokenizers/punkt', 'punkt'),
        ('corpora/stopwords', 'stopwords'),
        ('corpora/wordnet', 'wordnet')
    ]
    
    for data_path, download_name in required_data:
        try:
            nltk.data.find(data_path)
            logger.info(f"NLTK data '{download_name}' already available")
        except LookupError:
            logger.info(f"Downloading NLTK data: {download_name}")
            nltk.download(download_name, quiet=True)
            logger.info(f"Successfully downloaded NLTK data: {download_name}")