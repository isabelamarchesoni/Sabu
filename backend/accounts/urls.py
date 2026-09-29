from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, CadastroUsuarioView

app_name = 'accounts'

urlpatterns = [
    # Endpoint de login
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),

    # Endpoint de renovação de token JWT
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Endpoint de cadastro
    path('register/', CadastroUsuarioView.as_view(), name='register'),
]
