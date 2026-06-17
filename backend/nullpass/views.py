from django.http import JsonResponse
from django.db import connection
import logging

logger = logging.getLogger(__name__)

def health_check(request):
    """
    Simple liveness probe for the backend server.
    """
    return JsonResponse({"status": "ok", "message": "Server is alive"})

def db_health_check(request):
    """
    Check the database connection, specifically useful for pinging
    hosted databases (like Supabase) to prevent them from pausing.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
        if row:
            return JsonResponse({"status": "ok", "message": "Database connection is alive"})
        else:
            return JsonResponse({"status": "error", "message": "Database query returned no data"}, status=503)
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return JsonResponse({"status": "error", "message": "Database connection failed", "details": str(e)}, status=503)
