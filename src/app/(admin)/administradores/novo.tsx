import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { cadastrarAdministrador, type DadosAdministrador } from '../../../services/autenticacao';
import { ErroApi, mensagemDeErro } from '../../../services/api';
import { erroDoCampo } from '../../../utils/erros';
import { digitos, mascararCpfCnpj, mascararTelefone } from '../../../utils/mascaras';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';

const CAMPOS = ['nome', 'email', 'password', 'telefone', 'cpf_cnpj'];
const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NovoAdministrador() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [documento, setDocumento] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  function validar() {
    const novosErros: Record<string, string> = {};
    if (!nome.trim()) {
      novosErros.nome = 'Informe o nome.';
    } else if (nome.trim().length > 100) {
      novosErros.nome = 'Use no máximo 100 caracteres.';
    }
    if (!PADRAO_EMAIL.test(email.trim())) {
      novosErros.email = 'Informe um e-mail válido.';
    }
    if (digitos(telefone).length < 10) {
      novosErros.telefone = 'Informe o telefone com DDD.';
    }
    const numerosDocumento = digitos(documento).length;
    if (documento && numerosDocumento !== 11 && numerosDocumento !== 14) {
      novosErros.cpf_cnpj = 'CPF tem 11 números e CNPJ tem 14.';
    }
    if (senha.length < 8) {
      novosErros.password = 'Use pelo menos 8 caracteres.';
    }
    if (confirmacao !== senha) {
      novosErros.confirmacao = 'As senhas não são iguais.';
    }
    return novosErros;
  }

  function limpar() {
    setNome('');
    setEmail('');
    setTelefone('');
    setDocumento('');
    setSenha('');
    setConfirmacao('');
  }

  async function salvar() {
    setErroGeral('');
    setSucesso('');
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setSalvando(true);
    try {
      const dados: DadosAdministrador = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        password: senha,
        telefone: telefone.trim(),
      };
      if (documento) {
        dados.cpf_cnpj = documento;
      }
      await cadastrarAdministrador(dados);
      setSucesso(`${nome.trim()} já pode entrar no painel com o e-mail ${email.trim().toLowerCase()}.`);
      limpar();
    } catch (e) {
      if (e instanceof ErroApi && e.status === 403) {
        setErroGeral('Só o administrador principal (superusuário) pode cadastrar outros administradores.');
        return;
      }
      const errosApi: Record<string, string> = {};
      for (const campo of CAMPOS) {
        const mensagem = erroDoCampo(e, campo);
        if (mensagem) {
          errosApi[campo] = mensagem;
        }
      }
      if (Object.keys(errosApi).length > 0) {
        setErros(errosApi);
      } else {
        setErroGeral(mensagemDeErro(e, 'Não foi possível cadastrar o administrador.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Screen rolavel>
      <Header titulo="Novo administrador" subtitulo="Dá acesso completo ao painel da loja" voltar />

      {sucesso ? <Notice mensagem={sucesso} tom="sucesso" /> : null}
      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <TextField
          rotulo="Nome completo"
          valor={nome}
          aoMudar={setNome}
          placeholder="Ex.: Maria Souza"
          erro={erros.nome}
          maiusculas="words"
          desabilitado={salvando}
        />
        <TextField
          rotulo="E-mail"
          valor={email}
          aoMudar={setEmail}
          placeholder="maria@email.com"
          erro={erros.email}
          ajuda="É com ele que a pessoa vai entrar."
          teclado="email-address"
          maiusculas="none"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Telefone"
          valor={telefone}
          aoMudar={function (texto) {
            setTelefone(mascararTelefone(texto));
          }}
          placeholder="(11) 91234-5678"
          erro={erros.telefone}
          teclado="phone-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="CPF ou CNPJ (opcional)"
          valor={documento}
          aoMudar={function (texto) {
            setDocumento(mascararCpfCnpj(texto));
          }}
          placeholder="000.000.000-00"
          erro={erros.cpf_cnpj}
          teclado="number-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Senha"
          valor={senha}
          aoMudar={setSenha}
          placeholder="Mínimo de 8 caracteres"
          erro={erros.password}
          senha
          desabilitado={salvando}
        />
        <TextField
          rotulo="Confirmar senha"
          valor={confirmacao}
          aoMudar={setConfirmacao}
          placeholder="Repita a senha"
          erro={erros.confirmacao}
          senha
          desabilitado={salvando}
        />
      </View>

      <View style={estilos.acoes}>
        <Button titulo="Cadastrar administrador" icone="person-add-outline" aoPressionar={salvar} carregando={salvando} />
        <Button
          titulo="Voltar"
          variante="secundario"
          desabilitado={salvando}
          aoPressionar={function () {
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  campos: {
    marginTop: 8,
    gap: 16,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});
