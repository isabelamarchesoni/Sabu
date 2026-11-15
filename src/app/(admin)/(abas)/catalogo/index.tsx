import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import MenuList, { type ItemMenu } from '../../../../components/ui/MenuList';

const ITENS: ItemMenu[] = [
  { titulo: 'Produtos', subtitulo: 'Sabonetes que aparecem na vitrine', rota: '/produtos' },
  { titulo: 'Variações', subtitulo: 'Tamanhos, preços, promoções e fabricação', rota: '/variacoes' },
  { titulo: 'Categorias', subtitulo: 'Grupos usados para filtrar a vitrine', rota: '/categorias' },
  { titulo: 'Tipos de pele', subtitulo: 'Para qual pele cada sabonete é indicado', rota: '/tipos-pele' },
];

export default function Catalogo() {
  return (
    <Screen rolavel>
      <Header titulo="Catálogo" subtitulo="O que os compradores veem na vitrine" grande />
      <MenuList itens={ITENS} />
    </Screen>
  );
}