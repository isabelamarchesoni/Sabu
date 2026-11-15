import { useCallback, useContext, useRef, useState, type ReactElement } from 'react';
import { FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TemaContext } from '../../theme/TemaContext';
import { mensagemDeErro, type Paginado } from '../../services/api';
import ScreenState from './ScreenState';

type Props<T> = {
  carregar: (pagina: number) => Promise<Paginado<T>>;
  renderizarItem: (item: T) => ReactElement;
  chave: (item: T) => string;
  dependencias?: unknown[];
  mensagemVazio?: string;
  colunas?: number;
  cabecalho?: ReactElement;
};

export default function PaginatedList<T>({ carregar, renderizarItem, chave, dependencias = [], mensagemVazio, colunas = 1, cabecalho }: Props<T>) {
  const { cores } = useContext(TemaContext);
  const jaCarregou = useRef(false);

  const [itens, setItens] = useState<T[]>([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  useFocusEffect(
    useCallback(function () {
      buscarPagina(1, 'normal');
    }, dependencias)
  );

  async function buscarPagina(numero: number, modo: 'normal' | 'mais' | 'atualizar') {
    if (modo === 'mais') {
      setCarregandoMais(true);
    } else if (modo === 'atualizar') {
      setAtualizando(true);
    } else if (!jaCarregou.current) {
      setCarregando(true);
    }
    setErro('');
    try {
      const resposta = await carregar(numero);
      setItens(function (atuais) {
        return numero === 1 ? resposta.results : [...atuais, ...resposta.results];
      });
      setPagina(numero);
      setTemMais(resposta.next !== null);
      jaCarregou.current = true;
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível carregar a lista.'));
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
      setAtualizando(false);
    }
  }

  function carregarMais() {
    if (temMais && !carregandoMais && !carregando) {
      buscarPagina(pagina + 1, 'mais');
    }
  }

  if (carregando) {
    return <ScreenState tipo="carregando" />;
  }

  if (erro !== '' && itens.length === 0) {
    return (
      <ScreenState
        tipo="erro"
        mensagem={erro}
        aoTentarNovamente={function () {
          jaCarregou.current = false;
          buscarPagina(1, 'normal');
        }}
      />
    );
  }

  return (
    <FlatList
      key={colunas}
      data={itens}
      numColumns={colunas}
      columnWrapperStyle={colunas > 1 ? styles.linhaColunas : undefined}
      keyExtractor={chave}
      renderItem={function ({ item }) {
        return renderizarItem(item);
      }}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={<ScreenState tipo="vazio" mensagem={mensagemVazio} />}
      ListFooterComponent={carregandoMais ? <ActivityIndicator color={cores.botao} style={styles.rodape} /> : undefined}
      onEndReached={carregarMais}
      onEndReachedThreshold={0.4}
      refreshing={atualizando}
      onRefresh={function () {
        buscarPagina(1, 'atualizar');
      }}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  linhaColunas: {
    justifyContent: 'space-between',
  },
  conteudo: {
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
  rodape: {
    marginVertical: 16,
  },
});