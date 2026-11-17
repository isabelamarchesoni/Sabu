// formulário de ingrediente. /ingredientes/novo cria um ingrediente novo; /ingredientes/3 edita (e pode excluir) o de id 3.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarIngrediente, salvarIngrediente, apagarIngrediente } from '../../../services/catalogo';
import { ErroApi, mensagemDeErro } from '../../../services/api';
import { erroDoCampo } from '../../../utils/erros';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const LIMITE_NOME = 100;

export default function FormularioIngrediente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const criando = id === 'novo';

  const [nome, setNome] = useState('');
  const [erroNome, setErroNome] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(!criando);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [apagando, setApagando] = useState(false);

  useEffect(function () {
    if (!criando) {
      carregar();
    }
  }, [id]);

  async function carregar() {
    setCarregando(true);
    setFalhouCarregar(false);
    try {
      const ingrediente = await buscarIngrediente(Number(id));
      setNome(ingrediente.nome);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar o ingrediente.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function validar() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErroNome('Informe o nome do ingrediente.');
      return null;
    }
    if (nomeLimpo.length > LIMITE_NOME) {
      setErroNome(`Use no máximo ${LIMITE_NOME} caracteres.`);
      return null;
    }
    return nomeLimpo;
  }

  async function salvar() {
    setErroNome('');
    setErroGeral('');
    const nomeLimpo = validar();
    if (!nomeLimpo) {
      return;
    }
    setSalvando(true);
    try {
      await salvarIngrediente(criando ? null : Number(id), nomeLimpo);
      router.back();
    } catch (e) {
      const mensagemCampo = erroDoCampo(e, 'nome');
      if (mensagemCampo) {
        setErroNome(mensagemCampo);
      } else {
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar o ingrediente.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    setApagando(true);
    try {
      await apagarIngrediente(Number(id));
      setConfirmandoExclusao(false);
      router.back();
    } catch (e) {
      setConfirmandoExclusao(false);
      if (e instanceof ErroApi && e.codigo === 'registro_protegido') {
        setErroGeral('Este ingrediente está em uso em algum produto. Tire-o dos produtos antes de excluir.');
      } else {
        setErroGeral(mensagemDeErro(e, 'Não foi possível excluir o ingrediente.'));
      }
    } finally {
      setApagando(false);
    }
  }

  const titulo = criando ? 'Novo ingrediente' : 'Editar ingrediente';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando ingrediente…' : erroGeral}
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
          aoMudar={function (texto) {
            setNome(texto);
            setErroNome('');
          }}
          placeholder="Ex.: mel"
          erro={erroNome}
          ajuda="É salvo em minúsculas. É o nome que o cliente marca como alergia no quiz."
          maiusculas="none"
          desabilitado={salvando}
          aoEnviar={salvar}
        />
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

      {!criando ? (
        <View style={estilos.perigo}>
          <Button
            titulo="Excluir ingrediente"
            variante="textoPerigo"
            icone="trash-outline"
            desabilitado={salvando}
            aoPressionar={function () {
              setErroGeral('');
              setConfirmandoExclusao(true);
            }}
          />
        </View>
      ) : null}

      <ConfirmModal
        visivel={confirmandoExclusao}
        titulo="Excluir ingrediente?"
        mensagem={`"${nome}" será apagado. Se ele estiver em algum produto, a exclusão será recusada.`}
        textoConfirmar="Excluir"
        perigo
        carregando={apagando}
        aoConfirmar={apagar}
        aoCancelar={function () {
          setConfirmandoExclusao(false);
        }}
      />
    </Screen>
  );
}

const estilos = StyleSheet.create({
  campos: {
    marginTop: 8,
  },
  acoes: {
    marginTop: 24,
    gap: 10,
  },
  perigo: {
    marginTop: 32,
    alignItems: 'center',
  },
});
