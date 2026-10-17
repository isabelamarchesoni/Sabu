from rest_framework.permissions import BasePermission

class IsAdminUserCargo(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and
            request.user.cargo == 'ADMIN'
        )

class IsSuperAdminUserCargo(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.cargo == 'ADMIN' and request.user.is_superuser)
        )
