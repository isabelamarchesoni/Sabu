import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { listarProdutosAdmin, type Produto, type Variacao } from '../../../services/catalogo';
import { listarVariacoes } from '../../../services/variacoes';
import { formatarDinheiro, precoAtual, promocaoAtiva } from '../../../utils/formatar';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SearchField from '../../../components/ui/SearchField';
import Select from '../../../components/ui/Select';
import Chip from '../../../components/ui/Chip';
import Toggle from '../../../components/ui/Toggle';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

type Situacao = 'ativas' | 'apagadas' | 'todas';

const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: 'ativas', rotulo: 'Ativas' },
  { valor: 'apagadas', rotulo: 'Apagadas' },
  { valor: 'todas', rotulo: 'Todas' },
];

function apagadasDaSituacao(situacao: Situacao) {
  if (situacao === 'ativas') {
    return false;
  }
  if (situacao === 'apagadas') {
    return true;
  }
  return null;
}

function subtituloVariacao(variacao: Variacao, nomeProduto: string) {
  const partes = [nomeProduto, variacao.sku, `estoque ${variacao.quantidade_estoque}`];
  if (variacao.peso_gramas) {
    partes.push(`${variacao.peso_gramas} g`);
  }
  return partes.join(' · ');
}

function seloVariacao(variacao: Variacao) {
  if (variacao.apagado_em) {
    return { texto: 'Apagada', tom: 'erro' as const };
  }
  if (promocaoAtiva(variacao)) {
    return { texto: 'Promoção', tom: 'destaque' as const };
  }
  return undefined;
}

export default function ListaVariacoes() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [situacao, setSituacao] = useState<Situacao>('ativas');
  const [soProdutosAtivos, setSoProdutosAtivos] = useState(false);

  useEffect(function () {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      const resposta = await listarProdutosAdmin({ pagina: 1 });
      setProdutos(resposta.results);
    } catch {
      setProdutos([]);
    }
  }

  const nomesProdutos: Record<number, string> = {};
  produtos.forEach(function (produto) {
    nomesProdutos[produto.id] = produto.nome;
  });

  const filtros = (
    <View style={estilos.filtros}>
      <Select
        rotulo="Produto"
        opcoes={produtos.map(function (produto) {
          return { valor: produto.id, rotulo: produto.nome };
        })}
        selecionados={produtoId === null ? [] : [produtoId]}
        aoMudar={function (valores) {
          setProdutoId(valores.length > 0 ? Number(valores[0]) : null);
        }}
        placeholder="Todos os produtos"
      />
      <View style={estilos.chips}>
        {SITUACOES.map(function (opcao) {
          return (
            <Chip
              key={opcao.valor}
              rotulo={opcao.rotulo}
              selecionado={situacao === opcao.valor}
              aoPressionar={function () {
                setSituacao(opcao.valor);
              }}
            />
          );
        })}
      </View>
      <Toggle
        rotulo="Só de produtos ativos"
        descricao="Esconde as variações de produtos desativados."
        valor={soProdutosAtivos}
        aoMudar={setSoProdutosAtivos}
      />
    </View>
  );

  return (
    <Screen
      rodape={
        <Button
          titulo="Nova variação"
          icone="add"
          aoPressionar={function () {
            router.push('/variacoes/formulario/novo');
          }}
        />
      }
    >
      <Header titulo="Variações" subtitulo="Tamanhos, preços e estoque" voltar />

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
        placeholder="Buscar por nome ou SKU"
      />

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarVariacoes({
              pagina: pagina,
              busca: buscaAplicada,
              produtoId: produtoId,
              apagadas: apagadasDaSituacao(situacao),
              produtoAtivo: soProdutosAtivos ? true : null,
            });
          }}
          dependencias={[buscaAplicada, produtoId, situacao, soProdutosAtivos]}
          chave={function (variacao) {
            return String(variacao.id);
          }}
          renderizarItem={function (variacao) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={variacao.nome}
                  subtitulo={subtituloVariacao(variacao, nomesProdutos[variacao.produto] ?? `Produto ${variacao.produto}`)}
                  imagem={variacao.imagem}
                  detalhe={formatarDinheiro(precoAtual(variacao))}
                  selo={seloVariacao(variacao)}
                  aoPressionar={function () {
                    router.push(`/variacoes/${variacao.id}`);
                  }}
                />
              </View>
            );
          }}
          cabecalho={filtros}
          mensagemVazio="Nenhuma variação encontrada com esses filtros."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  filtros: {
    gap: 12,
    marginBottom: 16,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  lista: {
    flex: 1,
  },
  item: {
    marginBottom: 10,
  },
});