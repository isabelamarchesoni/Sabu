import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { listarClientes, type Cliente } from '../../../services/vendas';
import { formatarData } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SearchField from '../../../components/ui/SearchField';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

type Ordem = 'nome' | '-criado_em';

function pareceDocumento(texto: string) {
  return /^[\d.\-/\s]+$/.test(texto) && texto.replace(/\D/g, '').length >= 11;
}

function subtituloCliente(cliente: Cliente) {
  const partes = [cliente.telefone];
  if (cliente.cpf_cnpj) {
    partes.push(cliente.cpf_cnpj);
  }
  partes.push(cliente.ultimo_pedido_em ? `último pedido ${formatarData(cliente.ultimo_pedido_em)}` : 'sem pedidos');
  return partes.join(' · ');
}

export default function ListaClientes() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('nome');

  const buscaPorDocumento = pareceDocumento(buscaAplicada);

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo cliente"
          icone="add"
          aoPressionar={function () {
            router.push('/clientes/formulario/novo');
          }}
        />
      }
    >
      <Header titulo="Clientes" subtitulo="Quem compra e como falar com cada um" voltar />

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
        placeholder="Buscar por nome ou CPF/CNPJ"
      />

      <View style={estilos.ordem}>
        <Chip
          rotulo="A → Z"
          selecionado={ordem === 'nome'}
          aoPressionar={function () {
            setOrdem('nome');
          }}
        />
        <Chip
          rotulo="Recentes"
          selecionado={ordem === '-criado_em'}
          aoPressionar={function () {
            setOrdem('-criado_em');
          }}
        />
      </View>

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarClientes({
              pagina: pagina,
              nome: buscaAplicada && !buscaPorDocumento ? buscaAplicada : undefined,
              cpfCnpj: buscaPorDocumento ? buscaAplicada : undefined,
              ordenacao: ordem,
            });
          }}
          dependencias={[buscaAplicada, ordem]}
          chave={function (cliente) {
            return String(cliente.id);
          }}
          renderizarItem={function (cliente) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={cliente.nome}
                  subtitulo={subtituloCliente(cliente)}
                  aoPressionar={function () {
                    router.push(`/clientes/${cliente.id}`);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhum cliente encontrado."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
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