from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Usuario

admin.site.site_header = "Administração do Sabu"
admin.site.index_title = "Painel de administração"
admin.site.site_title = "Administração"

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering = ("email",)

    list_display = [
        "nome",
        "email",
        "telefone",
        "cpf_cnpj",
        "cargo",
        "esta_ativo",
        "is_staff",
        "is_superuser",
        "criado_em",
    ]
    list_filter = ("cargo", "esta_ativo", "is_staff", "is_superuser")

    search_fields = ("nome", "email", "telefone", "cpf_cnpj")

    readonly_fields = ["criado_em", "last_login"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            _("Personal info"),
            {"fields": ("nome", "telefone", "cpf_cnpj", "cargo")},
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "esta_ativo",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "criado_em")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "nome",
                    "telefone",
                    "cpf_cnpj",
                    "cargo",
                    "password1",
                    "password2",
                ),
            },
        ),
    )