import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listarProdutosAdmin, listarCategoriasPaginadas, listarTiposPelePaginados } from '../../../../services/catalogo';
import { listarVariacoes } from '../../../../services/variacoes';
import { contarTodos } from '../../../../utils/contagens';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import ShortcutBar from '../../../../components/ui/ShortcutBar';
import MenuGroup from '../../../../components/ui/MenuGroup';

export default function Catalogo() {
  const [contagens, setContagens] = useState<(number | null)[]>([]);

  useFocusEffect(
    useCallback(function () {
      carregar();
    }, [])
  );

  async function carregar() {
    setContagens(
      await contarTodos([
        listarProdutosAdmin({ pagina: 1 }),
        listarVariacoes({ pagina: 1, apagadas: false }),
        listarCategoriasPaginadas({ pagina: 1 }),
        listarTiposPelePaginados({ pagina: 1 }),
      ])
    );
  }

  return (
    <Screen rolavel>
      <Header titulo="Catálogo" subtitulo="O que os compradores veem na vitrine" grande />

      <ShortcutBar
        atalhos={[
          { rotulo: 'Novo produto', rota: '/produtos/formulario/novo', icone: 'add' },
          { rotulo: 'Nova variação', rota: '/variacoes/formulario/novo', icone: 'add' },
        ]}
      />

      <MenuGroup
        titulo="Vitrine"
        itens={[
          { titulo: 'Produtos', subtitulo: 'Sabonetes que aparecem na vitrine', rota: '/produtos', icone: 'leaf-outline', contagem: contagens[0] },
          { titulo: 'Variações', subtitulo: 'Tamanhos, preços e fabricação', rota: '/variacoes', icone: 'pricetag-outline', contagem: contagens[1] },
        ]}
      />

      <MenuGroup
        titulo="Organização"
        itens={[
          { titulo: 'Categorias', subtitulo: 'Grupos para filtrar a vitrine', rota: '/categorias', icone: 'albums-outline', contagem: contagens[2] },
          { titulo: 'Tipos de pele', subtitulo: 'Para qual pele cada um é indicado', rota: '/tipos-pele', icone: 'water-outline', contagem: contagens[3] },
        ]}
      />
    </Screen>
  );
}
