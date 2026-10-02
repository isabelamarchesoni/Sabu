from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario
import re

from validate_docbr import CPF, CNPJ


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        # Executa a validação padrão do SimpleJWT (verifica e-mail e senha)
        data = super().validate(attrs)

        if not self.user.fl_ativo:
            raise serializers.ValidationError("O conta do usuário não está ativa.")

        # Adiciona as informações do usuário no JSON de resposta
        data['id_usuario'] = self.user.id_usuario
        data['nome'] = self.user.nm_usuario
        data['cargo'] = self.user.tp_cargo

        return data


class UsuarioCadastroSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    nome = serializers.CharField(source='nm_usuario')
    telefone = serializers.CharField(source='nr_telefone')
    cpf_cnpj = serializers.CharField(source='nr_cpf_cnpj')

    class Meta:
        model = Usuario
        fields = [
            'nome',
            'email',
            'senha',
            'telefone',
            'cpf_cnpj',
        ]

    def validate_nome(self, value):
        if not re.match(r'^[a-zA-Za-fA-Fà-úÀ-ÚçÇ\s]+$', value):
            raise serializers.ValidationError("O nome não pode conter números ou caracteres especiais.")

        return value

    def validate_cpf_cnpj(self, value):
        if not value:
            return value

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
            tp_cargo='CLIENTE',
            **validated_data
        )
        return usuario