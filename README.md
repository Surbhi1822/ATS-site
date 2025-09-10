# ATS Resume Scoring System

A full-stack web application that uses AI/ML algorithms to analyze and score resumes against job descriptions. The system combines keyword-based matching with semantic similarity analysis to provide comprehensive resume evaluation.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with automatic token refresh
- **File Upload Support**: Process PDF and DOCX resume and job description files
- **Dual Scoring Algorithm**: 
  - Keyword-based matching using TF-IDF and cosine similarity
  - Semantic similarity analysis using pre-trained transformer models
- **Configurable Scoring**: Adjustable weights between keyword and semantic scoring
- **Advanced Filtering**: Filter results by minimum score and custom keywords
- **Data Export**: Download results as CSV or comprehensive analysis reports
- **Responsive Design**: Mobile-friendly interface with modern UI/UX
- **Real-time Processing**: Live updates during resume processing

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern UI library
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **CSS3** - Custom responsive styling

### Backend
- **Django 5.2** - Python web framework
- **Django REST Framework** - API development
- **Simple JWT** - JWT authentication
- **SQLite** - Default database (development)

### AI/ML Libraries
- **Sentence Transformers** - Semantic text embeddings
- **NLTK** - Natural language processing
- **spaCy** - Advanced NLP tasks
- **scikit-learn** - Machine learning utilities
- **PyMuPDF (fitz)** - PDF text extraction
- **python-docx** - DOCX text extraction

## 📋 Prerequisites

- **Python 3.8+**
- **yarn**

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ats-resume-scoring-system
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
```

Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Download required NLTK data:
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"
```

Run database migrations:
```bash
python manage.py migrate
```

Create a superuser (optional):
```bash
python manage.py createsuperuser
```

Start the Django development server:
```bash
python manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000`

### 3. Frontend Setup

Open a new terminal and navigate to the client directory:
```bash
cd client/app
```

Install Node.js dependencies:
```bash
npm install
# or
yarn install
```

Start the development server:
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:5173`

## 🎯 Usage

### 1. User Authentication
- Navigate to the login page
- Use your credentials to log in
- First-time users will be prompted to change their password

### 2. Resume Processing
1. **Upload Files**:
   - Upload multiple resume files (PDF or DOCX format)
   - Upload one job description file (PDF or DOCX format)

2. **Configure Settings**:
   - Select the appropriate job role from the dropdown
   - Adjust the keyword weight slider (0.0 = semantic only, 0.9 = keyword heavy)
   - Set minimum score threshold for filtering

3. **Process Resumes**:
   - Click "Calculate Scores" to start processing
   - Wait for the AI/ML algorithms to analyze the files
   - View results in the results panel

### 3. Analyzing Results
- **Overall Scores**: View combined scores for all resumes
- **Individual Metrics**: See breakdown of keyword vs semantic scores
- **Statistics**: Review average scores, highest/lowest performers
- **Filtering**: Use keyword search to find specific skills or terms
- **Export**: Download results as CSV or detailed analysis reports

## 🧠 AI/ML Scoring Logic

### Keyword-Based Scoring
- **TF-IDF Analysis**: Calculates term frequency-inverse document frequency
- **Cosine Similarity**: Measures similarity between resume and job description vectors
- **Experience Extraction**: Identifies years of experience using regex patterns
- **Certification Detection**: Recognizes industry certifications
- **Communication Skills**: Analyzes leadership and communication keywords

### Semantic Similarity Scoring
- **Transformer Models**: Uses `all-mpnet-base-v2` for text embeddings
- **Contextual Understanding**: Captures meaning beyond exact keyword matches
- **Text Preprocessing**: Removes stopwords, performs lemmatization
- **Vector Similarity**: Computes cosine similarity between semantic embeddings

### Final Score Calculation
```
Final Score = (Keyword Score × Keyword Weight) + (Semantic Score × (1 - Keyword Weight))
```

## 📁 Project Structure

```
├── client/app/                 # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API communication
│   │   └── utils/             # Utility functions
│   ├── package.json
│   └── vite.config.js
├── server/                    # Django backend
│   ├── api/                   # Main API application
│   │   ├── models.py          # Database models
│   │   ├── views.py           # Authentication views
│   │   ├── ats_views.py       # ATS processing views
│   │   ├── job_matcher.py     # Keyword scoring logic
│   │   ├── semantic_matcher.py # Semantic scoring logic
│   │   └── serializers.py     # API serializers
│   ├── server/
│   │   ├── settings.py        # Django configuration
│   │   └── urls.py            # URL routing
│   ├── manage.py
│   └── requirements.txt
└── README.md
```

## 🔐 Authentication Flow

1. **Login**: User provides email/password
2. **Token Generation**: Backend creates access (2h) and refresh (7d) tokens
3. **Token Storage**: Frontend stores tokens in localStorage
4. **Request Authentication**: Access token attached to API requests
5. **Token Refresh**: Automatic refresh when access token expires
6. **Password Policy**: Enforced password changes for new users

## 🎨 Supported File Formats

- **PDF**: Extracted using PyMuPDF (fitz)
- **DOCX**: Extracted using python-docx
- **File Size Limit**: 200MB per file
- **Multiple Resumes**: Batch processing supported

## 🔧 Configuration

### Job Roles
The system supports predefined job roles with specific scoring weights:
- Software Engineer
- Data Scientist  
- Sales Manager
- HR Manager

### Scoring Parameters
- **Keyword Weight**: 0.0 to 0.9 (adjustable via UI)
- **Minimum Score**: 0 to 100 (filtering threshold)
- **Token Lifetime**: Access (2h), Refresh (7d)

## 🐛 Troubleshooting

### Common Issues

1. **NLTK Data Missing**:
   ```bash
   python -c "import nltk; nltk.download('all')"
   ```

2. **Port Already in Use**:
   - Backend: Change port in `python manage.py runserver 8001`
   - Frontend: Vite will automatically suggest alternative ports

3. **CORS Issues**:
   - Ensure `CORS_ALLOW_ALL_ORIGINS = True` in `settings.py`
   - Check API_BASE_URL in `client/app/src/services/api.js`

4. **File Upload Errors**:
   - Verify file format (PDF/DOCX only)
   - Check file size (max 200MB)
   - Ensure files are not corrupted

## 📝 API Endpoints

### Authentication
- `POST /login/` - User login
- `POST /refresh/` - Token refresh
- `POST /change-password/` - Password change
- `GET /profile/` - User profile

### ATS Processing
- `POST /process-resumes/` - Process resumes and calculate scores
- `POST /filter-keywords/` - Filter results by keywords

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Sentence Transformers** for semantic text analysis
- **Django REST Framework** for robust API development
- **React** community for excellent frontend tools
- **NLTK** and **spaCy** for natural language processing capabilities
