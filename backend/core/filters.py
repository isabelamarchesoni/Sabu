from django import forms
from django_filters import filters

from accounts.utils import usuario_e_admin


class BooleanoEstritoField(forms.Field):
    default_error_messages = {"invalid": "Informe true ou false."}

    def to_python(self, value):
        valor = "" if value is None else str(value).strip().lower()
        if valor == "":
            return None  # omitido ou vazio: não filtra
        if valor in ("true", "1"):
            return True
        if valor in ("false", "0"):
            return False
        raise forms.ValidationError(self.error_messages["invalid"], code="invalid")


class BooleanoEstritoFilter(filters.BooleanFilter):
    field_class = BooleanoEstritoField


class ApagadasFilter(BooleanoEstritoFilter):
    def __init__(self, *args, campo, somente_admin=False, **kwargs):
        self.campo = campo
        self.somente_admin = somente_admin
        kwargs.setdefault("help_text", "Omitido: ativas e apagadas. `true`: só apagadas. `false`: só ativas.")
        super().__init__(*args, **kwargs)

    def filter(self, qs, value):
        if value is None:
            return qs
        if self.somente_admin and not usuario_e_admin(self.parent.request.user):
            return qs  # não-admin já só enxerga ativos; o parâmetro é ignorado
        return qs.filter(**{f"{self.campo}__isnull": not value})