import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listarMateriasPrimas, listarFichas, listarLotesMateriaPrima, listarLotesVariacao } from '../../../../services/estoque';
import { contarTodos, plural } from '../../../../utils/contagens';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import ShortcutBar from '../../../../components/ui/ShortcutBar';
import MenuGroup from '../../../../components/ui/MenuGroup';

function alertaVencidos(quantidade: number | null | undefined) {
  if (!quantidade) {
    return undefined;
  }
  return { texto: plural(quantidade, 'vencido', 'vencidos'), tom: 'erro' as const };
}

export default function Estoque() {
  const [contagens, setContagens] = useState<(number | null)[]>([]);

  useFocusEffect(
    useCallback(function () {
      carregar();
    }, [])
  );

  async function carregar() {
    setContagens(
      await contarTodos([
        listarMateriasPrimas({ pagina: 1, apagadas: false }),
        listarFichas({ pagina: 1, apagadas: false }),
        listarLotesMateriaPrima({ pagina: 1, status: 'ATIVO' }),
        listarLotesMateriaPrima({ pagina: 1, status: 'VENCIDO' }),
        listarLotesVariacao({ pagina: 1, status: 'ATIVO' }),
        listarLotesVariacao({ pagina: 1, status: 'VENCIDO' }),
      ])
    );
  }

  return (
    <Screen rolavel>
      <Header titulo="Estoque" subtitulo="Produção, insumos e validade" grande />

      <ShortcutBar
        atalhos={[
          { rotulo: 'Matéria-prima', rota: '/materias-primas/formulario/novo', icone: 'add' },
          { rotulo: 'Movimentar', rota: '/movimentacoes-materia-prima/novo', icone: 'swap-vertical' },
        ]}
      />

      <MenuGroup
        titulo="Cadastros"
        itens={[
          { titulo: 'Matérias-primas', subtitulo: 'Óleos, essências, embalagens', rota: '/materias-primas', icone: 'flask-outline', contagem: contagens[0] },
          { titulo: 'Fichas técnicas', subtitulo: 'A receita de cada variação', rota: '/fichas-tecnicas', icone: 'document-text-outline', contagem: contagens[1] },
        ]}
      />

      <MenuGroup
        titulo="Lotes ativos"
        itens={[
          { titulo: 'Matéria-prima', subtitulo: 'Quantidade e validade de cada entrada', rota: '/lotes-materia-prima', icone: 'layers-outline', contagem: contagens[2], alerta: alertaVencidos(contagens[3]) },
          { titulo: 'Sabonetes', subtitulo: 'Fabricados, saldo e validade', rota: '/lotes-sabonetes', icone: 'cube-outline', contagem: contagens[4], alerta: alertaVencidos(contagens[5]) },
        ]}
      />

      <MenuGroup
        titulo="Histórico"
        itens={[
          { titulo: 'Movimentações de matéria-prima', subtitulo: 'Entradas, produção, ajustes', rota: '/movimentacoes-materia-prima', icone: 'swap-vertical-outline' },
          { titulo: 'Movimentações de sabonetes', subtitulo: 'Entradas, vendas, estornos', rota: '/movimentacoes-sabonetes', icone: 'repeat-outline' },
        ]}
      />
    </Screen>
  );
}
