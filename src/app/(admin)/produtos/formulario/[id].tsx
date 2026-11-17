// formulário de produto. /produtos/formulario/novo cria um produto novo; /produtos/formulario/3 edita o produto de id 3.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  buscarProdutoAdmin,
  salvarProduto,
  listarCategorias,
  listarTiposPele,
  enviarImagemProduto,
  apagarImagemProduto,
  type Categoria,
  type TipoPele,
} from '../../../../services/catalogo';
import type { ArquivoImagem } from '../../../../services/imagem';
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
import ImagePickerField from '../../../../components/ui/ImagePickerField';

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
  const [imagemAtual, setImagemAtual] = useState<string | null>(null);
  const [imagemNova, setImagemNova] = useState<ArquivoImagem | null>(null);
  const [idCriado, setIdCriado] = useState<number | null>(null);
  const [apagandoImagem, setApagandoImagem] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(!criando);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // id do produto no servidor: o da rota, ou o que acabou de ser criado nesta tela
  const idAtual = idCriado ?? (criando ? null : Number(id));
  const previa = imagemNova ? imagemNova.uri : imagemAtual;

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
      setImagemAtual(produto.imagem);
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

  async function escolherImagem() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (resultado.canceled) {
      return;
    }
    const arquivo = resultado.assets[0];
    setImagemNova({
      uri: arquivo.uri,
      nome: arquivo.fileName ?? 'imagem.jpg',
      tipo: arquivo.mimeType ?? 'image/jpeg',
    });
  }

  async function removerImagem() {
    // imagem recém-escolhida e ainda não enviada: só descarta a prévia
    if (imagemNova) {
      setImagemNova(null);
      return;
    }
    if (idAtual === null) {
      return;
    }
    setErroGeral('');
    setApagandoImagem(true);
    try {
      await apagarImagemProduto(idAtual);
      setImagemAtual(null);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível excluir a imagem.'));
    } finally {
      setApagandoImagem(false);
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
      // 1) JSON: cria ou atualiza os dados do produto
      const salvo = await salvarProduto(idAtual, {
        nome: nome.trim(),
        descricao: descricao.trim() ? descricao.trim() : null,
        esta_ativo: ativo,
        categorias: categoriasIds,
        tipo_pele: tiposPeleIds,
      });

      // 2) multipart: só depois do sucesso acima, envia a imagem
      if (imagemNova) {
        try {
          await enviarImagemProduto(salvo.id, imagemNova);
          setImagemAtual(imagemNova.uri);
          setImagemNova(null);
        } catch (e) {
          // o produto já existe: passa a editá-lo e deixa o usuário tentar de novo
          setIdCriado(salvo.id);
          setErroGeral(
            mensagemDeErro(e, 'Não foi possível enviar a imagem.') +
              ' Os dados do produto foram salvos; toque em Salvar para tentar enviar a imagem novamente.'
          );
          return;
        }
      }

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
        <ImagePickerField previa={previa} aoEscolher={escolherImagem} aoRemover={removerImagem} removendo={apagandoImagem} desabilitado={salvando} />

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