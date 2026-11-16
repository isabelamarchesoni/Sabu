import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { listarProdutosAdmin, listarCategorias, listarTiposPele, type Categoria, type Produto, type TipoPele } from '../../../services/catalogo';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SearchField from '../../../components/ui/SearchField';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

type Ordem = 'nome' | '-nome';

function resumoProduto(produto: Produto) {
  const nomesCategorias = produto.categorias.map(function (categoria) {
    return categoria.nome;
  });
  const nomesTipos = produto.tipo_pele.map(function (tipo) {
    return `pele ${tipo.nome.toLowerCase()}`;
  });
  const partes = [nomesCategorias.join(', '), nomesTipos.join(', ')].filter(function (parte) {
    return parte !== '';
  });
  return partes.length > 0 ? partes.join(' · ') : 'Sem categoria e sem tipo de pele';
}

export default function ListaProdutos() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tiposPele, setTiposPele] = useState<TipoPele[]>([]);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [tipoPeleId, setTipoPeleId] = useState<number | null>(null);
  const [ordem, setOrdem] = useState<Ordem>('nome');

  useEffect(function () {
    carregarFiltros();
  }, []);

  async function carregarFiltros() {
    try {
      const [listaCategorias, listaTipos] = await Promise.all([listarCategorias(), listarTiposPele()]);
      setCategorias(listaCategorias);
      setTiposPele(listaTipos);
    } catch {
      setCategorias([]);
      setTiposPele([]);
    }
  }

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo produto"
          icone="add"
          aoPressionar={function () {
            router.push('/produtos/formulario/novo');
          }}
        />
      }
    >
      <Header titulo="Produtos" subtitulo="Sabonetes que aparecem na vitrine" voltar />

      <SearchField
        valor={busca}
        aoMudar={setBusca}
        aoBuscar={function () {
          setBuscaAplicada(busca.trim());
        }}
        aoLimpar={function () {
          setBusca('');
          setBuscaAplicada('');
        }}
        placeholder="Buscar produto"
      />

      {categorias.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.faixa}>
          <Chip
            rotulo="Todas"
            selecionado={categoriaId === null}
            aoPressionar={function () {
              setCategoriaId(null);
            }}
          />
          {categorias.map(function (categoria) {
            return (
              <Chip
                key={categoria.id}
                rotulo={categoria.nome}
                selecionado={categoriaId === categoria.id}
                aoPressionar={function () {
                  setCategoriaId(categoriaId === categoria.id ? null : categoria.id);
                }}
              />
            );
          })}
        </ScrollView>
      )}

      {tiposPele.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.faixa}>
          <Chip
            rotulo="Toda pele"
            selecionado={tipoPeleId === null}
            aoPressionar={function () {
              setTipoPeleId(null);
            }}
          />
          {tiposPele.map(function (tipo) {
            return (
              <Chip
                key={tipo.id}
                rotulo={tipo.nome}
                selecionado={tipoPeleId === tipo.id}
                aoPressionar={function () {
                  setTipoPeleId(tipoPeleId === tipo.id ? null : tipo.id);
                }}
              />
            );
          })}
        </ScrollView>
      )}

      <View style={estilos.ordem}>
        <Chip
          rotulo="A → Z"
          selecionado={ordem === 'nome'}
          aoPressionar={function () {
            setOrdem('nome');
          }}
        />
        <Chip
          rotulo="Z → A"
          selecionado={ordem === '-nome'}
          aoPressionar={function () {
            setOrdem('-nome');
          }}
        />
      </View>

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarProdutosAdmin({ pagina: pagina, busca: buscaAplicada, categoriaId: categoriaId, tipoPeleId: tipoPeleId, ordenacao: ordem });
          }}
          dependencias={[buscaAplicada, categoriaId, tipoPeleId, ordem]}
          chave={function (produto) {
            return String(produto.id);
          }}
          renderizarItem={function (produto) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={produto.nome}
                  subtitulo={resumoProduto(produto)}
                  imagem={produto.imagem}
                  selo={produto.esta_ativo ? { texto: 'Ativo', tom: 'sucesso' } : { texto: 'Desativado', tom: 'neutro' }}
                  aoPressionar={function () {
                    router.push(`/produtos/${produto.id}`);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhum produto encontrado com esses filtros."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    flexGrow: 0,
    marginBottom: 10,
  },
  ordem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  lista: {
    flex: 1,
  },
  item: {
    marginBottom: 10,
  },
});