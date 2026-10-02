from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UsuarioManager(BaseUserManager):
    def create_user(self, email, nm_usuario, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail é obrigatório.')
        email = self.normalize_email(email)
        user = self.model(email=email, nm_usuario=nm_usuario, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nm_usuario, password=None, **extra_fields):
        extra_fields.setdefault('tp_cargo', 'ADMIN')
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)
        return self.create_user(email, nm_usuario, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    CARGO_CHOICES = (
        ('CLIENTE', 'Cliente'),
        ('ADMIN', 'Administrador'),
    )

    id_usuario = models.BigAutoField(primary_key=True, db_column='id_usuario')
    nm_usuario = models.CharField(max_length=100, db_column='nm_usuario')
    email = models.EmailField(max_length=254, unique=True, db_column='ds_email')
    # O campo 'ds_senha_hash' / 'password' e 'last_login' vêm automaticamente do AbstractBaseUser
    nr_telefone = models.CharField(max_length=20, blank=True, null=True, db_column='nr_telefone')
    nr_cpf_cnpj = models.CharField(max_length=20, unique=True, blank=True, null=True, db_column='nr_cpf_cnpj')
    tp_cargo = models.CharField(max_length=20, choices=CARGO_CHOICES, db_column='tp_cargo')
    fl_ativo = models.BooleanField(default=True, db_column='fl_ativo')
    dt_criacao = models.DateTimeField(auto_now_add=True, db_column='dt_criacao')

    # Campos necessários para a integração com admin do Django
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nm_usuario']

    objects = UsuarioManager()

    @property
    def is_active(self):
        return self.fl_ativo

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        return self.email
