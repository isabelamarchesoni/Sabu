// formulário de categoria. /categorias/novo cria uma categoria nova; /categorias/3 edita (e pode excluir) a categoria de id 3.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarCategoria, salvarCategoria, apagarCategoria, contarProdutosDaCategoria } from '../../../services/catalogo';
import { ErroApi, mensagemDeErro } from '../../../services/api';
import { erroDoCampo } from '../../../utils/erros';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const LIMITE_NOME = 50;

export default function FormularioCategoria() {
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
      const categoria = await buscarCategoria(Number(id));
      setNome(categoria.nome);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar a categoria.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function validar() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErroNome('Informe o nome da categoria.');
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
      await salvarCategoria(criando ? null : Number(id), nomeLimpo);
      router.back();
    } catch (e) {
      const mensagemCampo = erroDoCampo(e, 'nome');
      if (mensagemCampo) {
        setErroNome(mensagemCampo);
      } else {
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar a categoria.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    setApagando(true);
    try {
      const produtosLigados = await contarProdutosDaCategoria(Number(id));
      if (produtosLigados > 0) {
        setConfirmandoExclusao(false);
        setErroGeral(`Esta categoria está ligada a ${produtosLigados === 1 ? '1 produto' : `${produtosLigados} produtos`}. Tire-a dos produtos antes de excluir.`);
        return;
      }
      await apagarCategoria(Number(id));
      setConfirmandoExclusao(false);
      router.back();
    } catch (e) {
      setConfirmandoExclusao(false);
      if (e instanceof ErroApi && e.codigo === 'registro_protegido') {
        setErroGeral('Esta categoria está ligada a produtos. Tire-a dos produtos antes de excluir.');
      } else {
        setErroGeral(mensagemDeErro(e, 'Não foi possível excluir a categoria.'));
      }
    } finally {
      setApagando(false);
    }
  }

  const titulo = criando ? 'Nova categoria' : 'Editar categoria';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando categoria…' : erroGeral}
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
          placeholder="Ex.: Hidratante"
          erro={erroNome}
          ajuda={`Até ${LIMITE_NOME} caracteres.`}
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
            titulo="Excluir categoria"
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
        titulo="Excluir categoria?"
        mensagem={`"${nome}" será apagada. Se ela estiver ligada a algum produto, a exclusão será recusada.`}
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