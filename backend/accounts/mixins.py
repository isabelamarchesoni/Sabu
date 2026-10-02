from rest_framework.permissions import AllowAny

from accounts.permissions import IsAdminUserCargo

class PublicReadAdminWriteViewSetMixin:
    """
    Para viewsets do catalog:
    - Leitura (list, retrieve): Aberta a anônimos/clientes
    - Escrita (POST, PUT, DELETE): Apenas ADMIN ativo
    """
    def get_permissions(self):
        permissions = [AllowAny()]
        if self.action not in ['list', 'retrieve']:
            permissions.append(IsAdminUserCargo())
        return permissions

class AdminOnlyViewSetMixin:
    """
    Para viewsets do inventory (e outras áreas 100% restritas a admins):
    - Todas as ações exigem que o usuário seja ADMIN.
    """
    permission_classes = [IsAdminUserCargo]