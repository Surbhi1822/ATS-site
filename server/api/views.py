from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.exceptions import ValidationError, AuthenticationFailed
import logging

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import ChangePasswordSerializer, UserSerializer

logger = logging.getLogger('api')

class CustomLoginView (APIView):
    permission_classes = [AllowAny]
    
    def post (self, request):
        logger.info(f"Login attempt for email: {request.data.get('email', 'N/A')}")
        
        email = request.data.get("email")
        password = request.data.get("password")
        
        if not email or not password:
            logger.warning("Login attempt with missing credentials")
            raise ValidationError({"detail": "Email and password are required"})
        
        user = authenticate(request, email=email, password=password)

        if not user:
            logger.warning(f"Failed login attempt for email: {email}")
            raise AuthenticationFailed("Invalid email or password")
        
        if user.must_change_password:
            logger.info(f"Password change required for user: {email}")
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh), 
                "access": str(refresh.access_token),
                "must_change_password": True
            }, status=status.HTTP_200_OK)
        
        logger.info(f"Successful login for user: {email}")
        refresh = RefreshToken.for_user(user)

        return Response({"refresh": str(refresh), "access": str(refresh.access_token),})
    

class ChangePasswordView (APIView):
    permission_classes = [IsAuthenticated]

    def post (self, request):
        logger.info(f"Password change attempt for user: {request.user.email}")
        
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user

            if not user.check_password(serializer.validated_data["old_password"]):
                logger.warning(f"Incorrect old password for user: {user.email}")
                return Response(
                    {"detail": "Current password is incorrect"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(serializer.validated_data["new_password"])
            user.must_change_password = False
            user.save()

            logger.info(f"Password successfully changed for user: {user.email}")
            return Response({"detail": "Password updated successfully"}, status=status.HTTP_200_OK)
        
        logger.warning(f"Password change validation failed for user: {request.user.email}")
        raise ValidationError(serializer.errors)
    
class CurrentUserView (APIView):
    permission_classes = [IsAuthenticated]

    def get (self, request):
        logger.debug(f"Profile request for user: {request.user.email}")
        serializer = UserSerializer(request.user)

        return Response(serializer.data)