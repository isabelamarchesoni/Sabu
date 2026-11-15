import { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { TemaContext } from '../../theme/TemaContext';
import { listarProdutos, listarCategorias, listarTiposPele, type Categoria, type TipoPele } from '../../services/catalogo';
import Screen from '../../components/ui/Screen';
import Header from '../../components/ui/Header';
import SearchField from '../../components/ui/SearchField';
import Chip from '../../components/ui/Chip';
import SectionTitle from '../../components/ui/SectionTitle';
import PaginatedList from '../../components/ui/PaginatedList';
import ProductCard from '../../components/ui/ProductCard';
import ThemeToggle from '../../components/ui/ThemeToggle';

export default function Vitrine() {
  const { cores } = useContext(TemaContext);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tiposPele, setTiposPele] = useState<TipoPele[]>([]);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [tipoPeleId, setTipoPeleId] = useState<number | null>(null);

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

  function irParaLogin() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  }

  return (
    <Screen>
      <Header
        titulo="Sabu"
        subtitulo="Sabonetes feitos à mão, com cuidado."
        grande
        acoes={
          <>
            <TouchableOpacity onPress={irParaLogin} style={styles.botaoEntrar} accessibilityRole="button">
              <Text style={[styles.textoEntrar, { color: cores.link }]}>Entrar</Text>
            </TouchableOpacity>
            <ThemeToggle />
          </>
        }
      />

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
        placeholder="Buscar sabonete"
      />

      {categorias.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.faixa}>
          <Chip
            rotulo="Todos"
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.faixa}>
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

      <View style={styles.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarProdutos({ pagina: pagina, busca: buscaAplicada, categoriaId: categoriaId, tipoPeleId: tipoPeleId });
          }}
          dependencias={[buscaAplicada, categoriaId, tipoPeleId]}
          chave={function (produto) {
            return String(produto.id);
          }}
          renderizarItem={function (produto) {
            return (
              <ProductCard
                produto={produto}
                aoPressionar={function () {
                  router.push(`/vitrine/${produto.id}`);
                }}
              />
            );
          }}
          colunas={2}
          cabecalho={<SectionTitle titulo="Produtos" />}
          mensagemVazio="Nenhum sabonete encontrado com esses filtros."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  botaoEntrar: {
    height: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  textoEntrar: {
    fontSize: 15,
    fontWeight: '600',
  },
  faixa: {
    flexGrow: 0,
    marginBottom: 10,
  },
  lista: {
    flex: 1,
  },
});