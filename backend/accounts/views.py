from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Usuario
from .serializers import CustomTokenObtainPairSerializer, UsuarioCadastroSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CadastroUsuarioView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioCadastroSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        return Response({
            "message": "Usuário cadastrado com sucesso!",
            "user": {
                "id_usuario": usuario.id_usuario,
                "nm_usuario": usuario.nm_usuario,
                "email_usuario": usuario.email_usuario,
                "cargo_usuario": usuario.cargo_usuario
            }
        }, status=status.HTTP_201_CREATED)
