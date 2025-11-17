import json
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
import tempfile
import os

from .job_matcher import compute_final_score
from .semantic_matcher import ATS

logger = logging.getLogger('api')

# Global ATS instance to avoid reloading the model for each request
_ats_instance = None

def get_ats_instance():
    """Get or create a singleton ATS instance to avoid reloading the model"""
    global _ats_instance
    if _ats_instance is None:
        logger.info("Initializing ATS instance...")
        _ats_instance = ATS()
        logger.info("ATS instance initialized successfully")
    return _ats_instance

class ResumeProcessingView(APIView):
    """
    API endpoint for processing resumes and calculating ATS scores
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            logger.info(f"Resume processing request from user: {request.user.email}")
            
            # Get uploaded files and parameters
            resume_files = request.FILES.getlist('resumes')
            jd_file = request.FILES.get('job_description')
            job_role = request.data.get('job_role')
            keyword_weight = float(request.data.get('keyword_weight', 0.5))
            
            if not resume_files:
                return Response(
                    {'error': 'No resume files provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not jd_file:
                return Response(
                    {'error': 'No job description file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not job_role:
                return Response(
                    {'error': 'Job role is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse job description
            jd_text = self._parse_file(jd_file)
            if not jd_text:
                return Response(
                    {'error': 'Failed to parse job description'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Process all resumes
            results = []
            for resume_file in resume_files:
                try:
                    resume_text = self._parse_file(resume_file)
                    if not resume_text:
                        logger.warning(f"Failed to parse resume: {resume_file.name}")
                        continue
                    
                    # Calculate scores
                    keyword_score = self._calculate_keyword_score(resume_text, jd_text, job_role)
                    semantic_score = self._calculate_semantic_score(resume_text, jd_text)
                    
                    # Calculate final weighted score
                    final_score = round(
                        (keyword_score * keyword_weight) + (semantic_score * (1 - keyword_weight))
                    )
                    
                    results.append({
                        'resume': resume_file.name,
                        'score': final_score,
                        'keywordScore': round(keyword_score),
                        'semanticScore': round(semantic_score),
                        'text': resume_text[:500]  # First 500 chars for keyword search
                    })
                    
                    logger.info(f"Processed resume: {resume_file.name} - Score: {final_score}")
                    
                except Exception as e:
                    logger.error(f"Error processing resume {resume_file.name}: {str(e)}")
                    continue
            
            # Sort by score descending
            results.sort(key=lambda x: x['score'], reverse=True)
            
            logger.info(f"Successfully processed {len(results)} resumes for user: {request.user.email}")
            
            return Response({
                'results': results,
                'total_processed': len(results),
                'job_role': job_role
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Resume processing error for user {request.user.email}: {str(e)}")
            return Response(
                {'error': 'Internal server error during processing'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _parse_file(self, file):
        """Parse uploaded file and extract text content"""
        try:
            if file.content_type == 'application/pdf':
                return self._extract_text_from_pdf(file)
            elif file.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return self._extract_text_from_docx(file)
            else:
                logger.warning(f"Unsupported file type: {file.content_type}")
                return ""
        except Exception as e:
            logger.error(f"File parsing error: {str(e)}")
            return ""
    
    def _extract_text_from_pdf(self, file):
        """Extract text from PDF file"""
        try:
            import pymupdf  # PyMuPDF
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name
            
            try:
                # Extract text using PyMuPDF
                doc = pymupdf.open(temp_file_path)
                text = ""
                for page in doc:
                    text += page.get_text()
                doc.close()
                return text
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            logger.error(f"PDF extraction error: {str(e)}")
            return ""
    
    def _extract_text_from_docx(self, file):
        """Extract text from DOCX file"""
        try:
            import docx
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name
            
            try:
                # Extract text using python-docx
                doc = docx.Document(temp_file_path)
                text = ""
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                return text
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            logger.error(f"DOCX extraction error: {str(e)}")
            return ""
    
    def _calculate_keyword_score(self, resume_text, jd_text, job_role):
        """Calculate keyword-based score using job_matcher"""
        try:
            return compute_final_score(resume_text, jd_text, job_role)
        except Exception as e:
            logger.error(f"Keyword scoring error: {str(e)}")
            return 0
    
    def _calculate_semantic_score(self, resume_text, jd_text):
        """Calculate semantic similarity score"""
        try:
            ats = get_ats_instance()
            ats.load_resume(resume_text)
            ats.load_job_description(jd_text)
            
            experience = ats.extract_experience()
            ats.clean_experience(experience)
            
            skills = " ".join(ats.extract_skills())
            ats.clean_skills(skills)
            
            similarity_score = ats.compute_similarity() * 100
            logger.debug(f"Semantic similarity score calculated: {similarity_score}")
            return similarity_score
        except Exception as e:
            logger.error(f"Semantic scoring error: {str(e)}")
            return 0


class KeywordFilterView(APIView):
    """
    API endpoint for filtering resumes by keywords
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            results = request.data.get('results', [])
            keywords = request.data.get('keywords', '')
            
            if not keywords.strip():
                return Response(
                    {'filtered_results': []}, 
                    status=status.HTTP_200_OK
                )
            
            # Filter results by keywords
            search_terms = [term.strip().lower() for term in keywords.split(',')]
            filtered_results = []
            
            for result in results:
                resume_text = result.get('text', '').lower()
                matched_keywords = [term for term in search_terms if term in resume_text]
                
                if matched_keywords:
                    result_copy = result.copy()
                    result_copy['matchedKeywords'] = matched_keywords
                    filtered_results.append(result_copy)
            
            logger.info(f"Keyword filtering completed for user: {request.user.email}")
            
            return Response({
                'filtered_results': filtered_results,
                'total_matches': len(filtered_results)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Keyword filtering error for user {request.user.email}: {str(e)}")
            return Response(
                {'detail': 'Internal server error during keyword filtering'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
