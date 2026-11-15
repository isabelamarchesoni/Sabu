import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import MenuList, { type ItemMenu } from '../../../../components/ui/MenuList';

const ITENS: ItemMenu[] = [
  { titulo: 'Matérias-primas', subtitulo: 'Óleos, essências, embalagens e outros insumos', rota: '/materias-primas' },
  { titulo: 'Fichas técnicas', subtitulo: 'A receita de cada variação', rota: '/fichas-tecnicas' },
  { titulo: 'Lotes de matéria-prima', subtitulo: 'Quantidade e validade de cada entrada', rota: '/lotes-materia-prima' },
  { titulo: 'Lotes de sabonetes', subtitulo: 'Sabonetes fabricados, saldo e validade', rota: '/lotes-sabonetes' },
  { titulo: 'Movimentações de matéria-prima', subtitulo: 'Entradas, uso na produção, ajustes e devoluções', rota: '/movimentacoes-materia-prima' },
  { titulo: 'Movimentações de sabonetes', subtitulo: 'Entradas, vendas, ajustes e estornos', rota: '/movimentacoes-sabonetes' },
];

export default function Estoque() {
  return (
    <Screen rolavel>
      <Header titulo="Estoque" subtitulo="Produção, insumos e validade" grande />
      <MenuList itens={ITENS} />
    </Screen>
  );
}