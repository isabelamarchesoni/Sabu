// formulário de cliente. /clientes/formulario/novo cadastra um cliente novo; /clientes/formulario/3 edita o cliente de id 3.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarCliente, salvarCliente, type Cliente } from '../../../../services/vendas';
import { mensagemDeErro } from '../../../../services/api';
import { erroDoCampo } from '../../../../utils/erros';
import { formatarData } from '../../../../utils/datas';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import TextField from '../../../../components/ui/TextField';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';

const LIMITE_NOME = 100;
const LIMITE_CURTO = 20;
const CAMPOS = ['nome', 'telefone', 'cpf_cnpj'];

export default function FormularioCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const criando = id === 'novo';

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [clienteAtual, setClienteAtual] = useState<Cliente | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(!criando);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(function () {
    if (!criando) {
      carregar();
    }
  }, [id]);

  async function carregar() {
    setCarregando(true);
    setFalhouCarregar(false);
    try {
      const cliente = await buscarCliente(Number(id));
      setClienteAtual(cliente);
      setNome(cliente.nome);
      setTelefone(cliente.telefone);
      setCpfCnpj(cliente.cpf_cnpj ?? '');
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar o cliente.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function validar() {
    const novosErros: Record<string, string> = {};
    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();
    const documentoLimpo = cpfCnpj.trim();
    if (!nomeLimpo) {
      novosErros.nome = 'Informe o nome do cliente.';
    } else if (nomeLimpo.length > LIMITE_NOME) {
      novosErros.nome = `Use no máximo ${LIMITE_NOME} caracteres.`;
    }
    if (!telefoneLimpo) {
      novosErros.telefone = 'Informe o telefone.';
    } else if (telefoneLimpo.length > LIMITE_CURTO) {
      novosErros.telefone = `Use no máximo ${LIMITE_CURTO} caracteres.`;
    }
    if (documentoLimpo.length > LIMITE_CURTO) {
      novosErros.cpf_cnpj = `Use no máximo ${LIMITE_CURTO} caracteres.`;
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function salvar() {
    setErroGeral('');
    if (!validar()) {
      return;
    }
    setSalvando(true);
    try {
      const salvo = await salvarCliente(criando ? null : Number(id), {
        nome: nome.trim(),
        telefone: telefone.trim(),
        cpf_cnpj: cpfCnpj.trim() ? cpfCnpj.trim() : null,
      });
      if (criando) {
        router.replace(`/clientes/${salvo.id}`);
      } else {
        router.back();
      }
    } catch (e) {
      const novosErros: Record<string, string> = {};
      for (const campo of CAMPOS) {
        const mensagem = erroDoCampo(e, campo);
        if (mensagem) {
          novosErros[campo] = mensagem;
        }
      }
      if (Object.keys(novosErros).length > 0) {
        setErros(novosErros);
      } else {
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar o cliente.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  const titulo = criando ? 'Novo cliente' : 'Editar cliente';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando cliente…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregar}
        />
      </Screen>
    );
  }

  return (
    <Screen rolavel>
      <Header titulo={titulo} voltar />

      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <TextField
          rotulo="Nome"
          valor={nome}
          aoMudar={setNome}
          placeholder="Ex.: Maria Souza"
          erro={erros.nome}
          ajuda={`Até ${LIMITE_NOME} caracteres.`}
          maiusculas="words"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Telefone"
          valor={telefone}
          aoMudar={setTelefone}
          placeholder="(11) 98765-4321"
          erro={erros.telefone}
          teclado="phone-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="CPF ou CNPJ"
          valor={cpfCnpj}
          aoMudar={setCpfCnpj}
          placeholder="000.000.000-00"
          erro={erros.cpf_cnpj}
          ajuda="Opcional."
          teclado="numbers-and-punctuation"
          desabilitado={salvando}
        />

        {clienteAtual ? (
          <>
            <TextField
              rotulo="Último pedido"
              valor={clienteAtual.ultimo_pedido_em ? formatarData(clienteAtual.ultimo_pedido_em) : 'Nenhum'}
              aoMudar={function () {}}
              desabilitado
            />
            <TextField rotulo="Cadastrado em" valor={formatarData(clienteAtual.criado_em)} aoMudar={function () {}} desabilitado />
          </>
        ) : null}
      </View>

      <View style={estilos.acoes}>
        <Button titulo="Salvar" aoPressionar={salvar} carregando={salvando} />
        <Button
          titulo="Cancelar"
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