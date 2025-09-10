import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('api')

def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error formatting
    and logs exceptions for monitoring.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Log the exception for monitoring
        logger.error(
            f"API Exception: {exc.__class__.__name__} - {str(exc)} "
            f"in {context['view'].__class__.__name__}.{context['request'].method}",
            exc_info=True
        )

        # Standardize error response format
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'details': response.data
        }

        # Handle specific error types
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                custom_response_data['details'] = exc.detail
            else:
                custom_response_data['message'] = str(exc.detail)
                custom_response_data['details'] = {}

        response.data = custom_response_data

    else:
        # Handle unexpected exceptions
        logger.critical(
            f"Unhandled Exception: {exc.__class__.__name__} - {str(exc)} "
            f"in {context['view'].__class__.__name__}.{context['request'].method}",
            exc_info=True
        )
        
        response = Response(
            {
                'error': True,
                'message': 'Internal server error',
                'details': {}
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response