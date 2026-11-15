import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import MenuList, { type ItemMenu } from '../../../../components/ui/MenuList';

const ITENS: ItemMenu[] = [
  { titulo: 'Pedidos', subtitulo: 'Pendentes, concluídos, cancelados e estornos', rota: '/pedidos' },
  { titulo: 'Clientes', subtitulo: 'Quem compra e como falar com cada um', rota: '/clientes' },
];

export default function Vendas() {
  return (
    <Screen rolavel>
      <Header titulo="Vendas" subtitulo="Pedidos e clientes da loja" grande />
      <MenuList itens={ITENS} />
    </Screen>
  );
}