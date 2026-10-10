from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UsuarioManager(BaseUserManager):
    def create_user(self, email, nome, password=None, **extra_fields):
        if not email:
            raise ValueError('O e-mail é obrigatório.')
        email = self.normalize_email(email)
        user = self.model(email=email, nome=nome, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nome, password=None, **extra_fields):
        extra_fields.setdefault('cargo', 'ADMIN')
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)
        return self.create_user(email, nome, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    CARGO_CHOICES = (
        ('CLIENTE', 'Cliente'),
        ('ADMIN', 'Administrador'),
    )

    id = models.BigAutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    email = models.EmailField(max_length=254, unique=True)
    # O campo 'ds_senha_hash' / 'password' e 'last_login' vêm automaticamente do AbstractBaseUser
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cpf_cnpj = models.CharField(max_length=20, unique=True, blank=True, null=True)
    cargo = models.CharField(max_length=20, choices=CARGO_CHOICES)
    esta_ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    # Campos necessários para a integração com admin do Django
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']

    objects = UsuarioManager()

    @property
    def is_active(self):
        return self.esta_ativo

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        return self.email
