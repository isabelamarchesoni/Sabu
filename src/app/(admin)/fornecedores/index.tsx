import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { listarFornecedores, type Fornecedor } from '../../../services/compras';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SearchField from '../../../components/ui/SearchField';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

type Situacao = 'ativos' | 'apagados' | 'todos';

const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: 'ativos', rotulo: 'Ativos' },
  { valor: 'apagados', rotulo: 'Apagados' },
  { valor: 'todos', rotulo: 'Todos' },
];

function subtitulo(fornecedor: Fornecedor) {
  const prazo = `entrega em ${fornecedor.prazo_medio_entrega_em_dias} ${fornecedor.prazo_medio_entrega_em_dias === 1 ? 'dia' : 'dias'}`;
  return fornecedor.plataforma ? `${fornecedor.plataforma} · ${prazo}` : prazo;
}

function selo(fornecedor: Fornecedor) {
  if (fornecedor.apagado_em) {
    return { texto: 'Apagado', tom: 'erro' as const };
  }
  if (fornecedor.favorito) {
    return { texto: 'Favorito', tom: 'destaque' as const };
  }
  return undefined;
}

export default function ListaFornecedores() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [situacao, setSituacao] = useState<Situacao>('ativos');

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo fornecedor"
          icone="add"
          aoPressionar={function () {
            router.push('/fornecedores/formulario/novo');
          }}
        />
      }
    >
      <Header titulo="Fornecedores" subtitulo="Quem vende matéria-prima para a loja" voltar />

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
        placeholder="Buscar por nome"
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

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarFornecedores({
              pagina: pagina,
              busca: buscaAplicada,
              apagados: situacao === 'ativos' ? false : situacao === 'apagados' ? true : null,
            });
          }}
          dependencias={[buscaAplicada, situacao]}
          chave={function (fornecedor) {
            return String(fornecedor.id);
          }}
          renderizarItem={function (fornecedor) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={fornecedor.nome}
                  subtitulo={subtitulo(fornecedor)}
                  detalhe={fornecedor.telefone || undefined}
                  selo={selo(fornecedor)}
                  aoPressionar={function () {
                    router.push(`/fornecedores/${fornecedor.id}`);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhum fornecedor encontrado."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  chips: {
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
