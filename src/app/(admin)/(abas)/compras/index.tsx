import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import MenuList, { type ItemMenu } from '../../../../components/ui/MenuList';

const ITENS: ItemMenu[] = [
  { titulo: 'Compras realizadas', subtitulo: 'Entradas de matéria-prima e devoluções', rota: '/historico-compras' },
  { titulo: 'Fornecedores', subtitulo: 'Quem vende para a loja e seus contatos', rota: '/fornecedores' },
  { titulo: 'Vínculos', subtitulo: 'Qual fornecedor vende cada matéria-prima', rota: '/vinculos' },
];

export default function Compras() {
  return (
    <Screen rolavel>
      <Header titulo="Compras" subtitulo="Fornecedores e reposição de insumos" grande />
      <MenuList itens={ITENS} />
    </Screen>
  );
}