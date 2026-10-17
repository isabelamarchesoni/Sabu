from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Usuario
from .permissions import IsSuperAdminUserCargo
from .schema import token_schema, cadastro_schema
from .serializers import CustomTokenObtainPairSerializer, UsuarioCadastroSerializer


@token_schema
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@cadastro_schema
class CadastroUsuarioView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioCadastroSerializer
    permission_classes = [IsSuperAdminUserCargo]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()

        return Response({
            "message": "Administrador cadastrado com sucesso.",
            "user": {
                "id": usuario.id,
                "nome": usuario.nome,
                "email": usuario.email,
                "cargo": usuario.cargo
            }
        }, status=status.HTTP_201_CREATED)