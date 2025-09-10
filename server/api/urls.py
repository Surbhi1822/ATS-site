from django.urls import path
from .views import CustomLoginView, ChangePasswordView, CurrentUserView
from .ats_views import ResumeProcessingView, KeywordFilterView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='login'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('profile/', CurrentUserView.as_view(), name='current-user'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('process-resumes/', ResumeProcessingView.as_view(), name='process-resumes'),
    path('filter-keywords/', KeywordFilterView.as_view(), name='filter-keywords'),
]