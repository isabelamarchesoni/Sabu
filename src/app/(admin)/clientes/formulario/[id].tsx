// formulário de cliente. /clientes/formulario/novo cadastra um cliente novo; /clientes/formulario/3 edita o cliente de id 3.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarCliente, salvarCliente, type Cliente } from '../../../../services/vendas';
import { mensagemDeErro } from '../../../../services/api';
import { erroDoCampo } from '../../../../utils/erros';
import { formatarData } from '../../../../utils/datas';
import { digitos, mascararCpfCnpj, mascararTelefone } from '../../../../utils/mascaras';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import TextField from '../../../../components/ui/TextField';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';

const LIMITE_NOME = 100;
const CAMPOS = ['nome', 'telefone', 'cpf_cnpj'];

export default function FormularioCliente() {
  const { id, origem } = useLocalSearchParams<{ id: string; origem?: string }>();
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
      setTelefone(mascararTelefone(cliente.telefone));
      setCpfCnpj(cliente.cpf_cnpj ? mascararCpfCnpj(cliente.cpf_cnpj) : '');
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
    const numerosTelefone = digitos(telefone);
    const numerosDocumento = digitos(cpfCnpj);
    if (!nomeLimpo) {
      novosErros.nome = 'Informe o nome do cliente.';
    } else if (nomeLimpo.length > LIMITE_NOME) {
      novosErros.nome = `Use no máximo ${LIMITE_NOME} caracteres.`;
    }
    if (numerosTelefone.length === 0) {
      novosErros.telefone = 'Informe o telefone.';
    } else if (numerosTelefone.length < 10) {
      novosErros.telefone = 'Informe o DDD e o número completo.';
    }
    if (numerosDocumento.length > 0 && numerosDocumento.length !== 11 && numerosDocumento.length !== 14) {
      novosErros.cpf_cnpj = 'O CPF tem 11 números e o CNPJ tem 14.';
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
        telefone: telefone,
        cpf_cnpj: cpfCnpj ? cpfCnpj : null,
      });
      if (criando && origem === 'pedido') {
        router.dismissTo({ pathname: '/pedidos/formulario/[id]', params: { id: 'novo', cliente: String(salvo.id) } });
      } else if (criando) {
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
          aoMudar={function (texto) {
            setTelefone(mascararTelefone(texto));
          }}
          placeholder="(11) 98765-4321"
          erro={erros.telefone}
          teclado="phone-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="CPF ou CNPJ"
          valor={cpfCnpj}
          aoMudar={function (texto) {
            setCpfCnpj(mascararCpfCnpj(texto));
          }}
          placeholder="000.000.000-00"
          erro={erros.cpf_cnpj}
          ajuda="Opcional. Até 11 números vira CPF; de 12 a 14, CNPJ."
          teclado="number-pad"
          desabilitado={salvando}
        />

        {clienteAtual ? (
          <>
            <TextField
              rotulo="Último pedido"
              valor={clienteAtual.ultimo_pedido_em ? formatarData(clienteAtual.ultimo_pedido_em) : 'Nenhum'}
              aoMudar={function () { }}
              desabilitado
            />
            <TextField rotulo="Cadastrado em" valor={formatarData(clienteAtual.criado_em)} aoMudar={function () { }} desabilitado />
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