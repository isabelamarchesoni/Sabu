// formulário de produto. /produtos/formulario/novo cria um produto novo; /produtos/formulario/3 edita o produto de id 3.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { buscarProdutoAdmin, salvarProduto, listarCategorias, listarTiposPele, type Categoria, type TipoPele } from '../../../../services/catalogo';
import { mensagemDeErro } from '../../../../services/api';
import { erroDoCampo } from '../../../../utils/erros';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import TextField from '../../../../components/ui/TextField';
import Toggle from '../../../../components/ui/Toggle';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';

const LIMITE_NOME = 100;
const CAMPOS = ['nome', 'descricao', 'categorias', 'tipo_pele'];

export default function FormularioProduto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const criando = id === 'novo';

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [categoriasIds, setCategoriasIds] = useState<number[]>([]);
  const [tiposPeleIds, setTiposPeleIds] = useState<number[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tiposPele, setTiposPele] = useState<TipoPele[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(!criando);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(
    useCallback(function () {
      carregarOpcoes();
    }, [])
  );

  useEffect(function () {
    if (!criando) {
      carregarProduto();
    }
  }, [id]);

  async function carregarOpcoes() {
    try {
      const [listaCategorias, listaTipos] = await Promise.all([listarCategorias(), listarTiposPele()]);
      setCategorias(listaCategorias);
      setTiposPele(listaTipos);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar categorias e tipos de pele.'));
    }
  }

  async function carregarProduto() {
    setCarregando(true);
    setFalhouCarregar(false);
    try {
      const produto = await buscarProdutoAdmin(Number(id));
      setNome(produto.nome);
      setDescricao(produto.descricao ?? '');
      setAtivo(produto.esta_ativo);
      setCategoriasIds(
        produto.categorias.map(function (categoria) {
          return categoria.id;
        })
      );
      setTiposPeleIds(
        produto.tipo_pele.map(function (tipo) {
          return tipo.id;
        })
      );
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar o produto.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function validar() {
    const novosErros: Record<string, string> = {};
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      novosErros.nome = 'Informe o nome do produto.';
    } else if (nomeLimpo.length > LIMITE_NOME) {
      novosErros.nome = `Use no máximo ${LIMITE_NOME} caracteres.`;
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
      const salvo = await salvarProduto(criando ? null : Number(id), {
        nome: nome.trim(),
        descricao: descricao.trim() ? descricao.trim() : null,
        esta_ativo: ativo,
        categorias: categoriasIds,
        tipo_pele: tiposPeleIds,
      });
      if (criando) {
        router.replace(`/produtos/${salvo.id}`);
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
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar o produto.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  const titulo = criando ? 'Novo produto' : 'Editar produto';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando produto…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregarProduto}
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
            setErros({ ...erros, nome: '' });
          }}
          placeholder="Ex.: Sabonete de Lavanda"
          erro={erros.nome}
          ajuda={`Até ${LIMITE_NOME} caracteres.`}
          desabilitado={salvando}
        />

        <TextField
          rotulo="Descrição"
          valor={descricao}
          aoMudar={setDescricao}
          placeholder="Aroma, ingredientes, como usar…"
          erro={erros.descricao}
          ajuda="Opcional."
          multilinha
          desabilitado={salvando}
        />

        <Toggle
          rotulo="Ativo"
          descricao="Produtos desativados não aparecem na vitrine."
          valor={ativo}
          aoMudar={setAtivo}
        />

        <View>
          <Select
            rotulo="Categorias"
            opcoes={categorias.map(function (categoria) {
              return { valor: categoria.id, rotulo: categoria.nome };
            })}
            selecionados={categoriasIds}
            aoMudar={function (valores) {
              setCategoriasIds(valores.map(Number));
            }}
            multiplo
            placeholder="Escolha as categorias"
            erro={erros.categorias}
          />
          <Button
            titulo="Criar nova categoria"
            variante="texto"
            icone="add"
            aoPressionar={function () {
              router.push('/categorias/novo');
            }}
          />
        </View>

        <View>
          <Select
            rotulo="Tipos de pele"
            opcoes={tiposPele.map(function (tipo) {
              return { valor: tipo.id, rotulo: tipo.nome };
            })}
            selecionados={tiposPeleIds}
            aoMudar={function (valores) {
              setTiposPeleIds(valores.map(Number));
            }}
            multiplo
            placeholder="Escolha os tipos de pele"
            erro={erros.tipo_pele}
          />
          <Button
            titulo="Criar novo tipo de pele"
            variante="texto"
            icone="add"
            aoPressionar={function () {
              router.push('/tipos-pele/novo');
            }}
          />
        </View>
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