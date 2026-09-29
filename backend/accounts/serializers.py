from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario
import re

from validate_docbr import CPF, CNPJ

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email_usuario'

    def validate(self, attrs):
        # Executa a validação padrão do SimpleJWT (verifica e-mail e senha)
        data = super().validate(attrs)

        # Adiciona as informações do usuário no JSON de resposta
        data['id_usuario'] = self.user.id_usuario
        data['nm_usuario'] = self.user.nm_usuario
        data['cargo_usuario'] = self.user.cargo_usuario

        return data


class UsuarioCadastroSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )

    class Meta:
        model = Usuario
        fields = [
            'nm_usuario',
            'email_usuario',
            'senha',
            'tel_usuario',
            'cpf_cnpj_usuario',
        ]

    def validate_cpf_cnpj_usuario(self, value):
        cpf = CPF()
        cnpj = CNPJ()

        if not cpf.validate(value) and not cnpj.validate(value):
            raise serializers.ValidationError("CPF ou CNPJ inválido.")

        value_regex = re.sub(r'[^a-zA-Z0-9]', '', value)

        return value_regex

    def create(self, validated_data):
        senha = validated_data.pop('senha')
        
        # Força o cargo como 'CLIENTE' no momento da criação
        usuario = Usuario.objects.create_user(
            password=senha,
            cargo_usuario='CLIENTE',
            **validated_data
        )
        return usuario
