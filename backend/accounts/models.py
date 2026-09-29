from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UsuarioManager(BaseUserManager):
    def create_user(self, email_usuario, nm_usuario, password=None, **extra_fields):
        if not email_usuario:
            raise ValueError('O e-mail é obrigatório.')
        email_usuario = self.normalize_email(email_usuario)
        user = self.model(email_usuario=email_usuario, nm_usuario=nm_usuario, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email_usuario, nm_usuario, password=None, **extra_fields):
        extra_fields.setdefault('cargo_usuario', 'ADMIN')
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)
        return self.create_user(email_usuario, nm_usuario, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    CARGO_CHOICES = (
        ('CLIENTE', 'Cliente'),
        ('ADMIN', 'Administrador'),
    )

    id_usuario = models.BigAutoField(primary_key=True, db_column='id_usuario')
    nm_usuario = models.CharField(max_length=100, db_column='nm_usuario')
    email_usuario = models.EmailField(max_length=254, unique=True, db_column='email_usuario')
    # O campo 'senha_usuario' / 'password' e 'last_login' vêm automaticamente do AbstractBaseUser
    tel_usuario = models.CharField(max_length=20, blank=True, null=True, db_column='tel_usuario')
    cpf_cnpj_usuario = models.CharField(max_length=20, unique=True, blank=True, null=True, db_column='cpf_cnpj_usuario')
    cargo_usuario = models.CharField(max_length=20, choices=CARGO_CHOICES, db_column='cargo_usuario')
    usuario_ativo = models.BooleanField(default=True, db_column='usuario_ativo')
    dt_criacao = models.DateTimeField(auto_now_add=True, db_column='dt_criacao')

    # Campos necessários para a integração com admin do Django
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email_usuario'
    REQUIRED_FIELDS = ['nm_usuario']

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        return self.email_usuario


class Endereco(models.Model):
    id_endereco = models.BigAutoField(primary_key=True, db_column='id_endereco')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario', related_name='enderecos')
    endereco_principal = models.BooleanField(db_column='endereco_principal')
    cep_endereco = models.CharField(max_length=10, db_column='cep_endereco')
    logr_endereco = models.CharField(max_length=150, db_column='logr_endereco')
    num_endereco = models.CharField(max_length=20, db_column='num_endereco')
    complemento_endereco = models.CharField(max_length=50, blank=True, null=True, db_column='complemento_endereco')
    bairro_endereco = models.CharField(max_length=50, db_column='bairro_endereco')
    cidade_endereco = models.CharField(max_length=50, db_column='cidade_endereco')
    estado = models.CharField(max_length=2, db_column='estado')

    class Meta:
        db_table = 'endereco'

    def __str__(self):
        return f"{self.logr_endereco}, {self.num_endereco} - {self.cidade_endereco}/{self.estado}"
