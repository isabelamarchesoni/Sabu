import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listarCompras, listarFornecedores, listarVinculos } from '../../../../services/compras';
import { contarTodos } from '../../../../utils/contagens';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import ShortcutBar from '../../../../components/ui/ShortcutBar';
import MenuGroup from '../../../../components/ui/MenuGroup';

export default function Compras() {
  const [contagens, setContagens] = useState<(number | null)[]>([]);

  useFocusEffect(
    useCallback(function () {
      carregar();
    }, [])
  );

  async function carregar() {
    setContagens(
      await contarTodos([
        listarCompras({ pagina: 1 }),
        listarFornecedores({ pagina: 1, apagados: false }),
        listarVinculos({ pagina: 1, apagados: false }),
      ])
    );
  }

  return (
    <Screen rolavel>
      <Header titulo="Compras" subtitulo="Fornecedores e reposição de insumos" grande />

      <ShortcutBar
        atalhos={[
          { rotulo: 'Nova compra', rota: '/historico-compras/novo', icone: 'add' },
          { rotulo: 'Fornecedor', rota: '/fornecedores/formulario/novo', icone: 'add' },
        ]}
      />

      <MenuGroup
        titulo="Reposição"
        itens={[
          { titulo: 'Compras realizadas', subtitulo: 'Entradas de matéria-prima e devoluções', rota: '/historico-compras', icone: 'bag-handle-outline', contagem: contagens[0] },
        ]}
      />

      <MenuGroup
        titulo="Quem vende"
        itens={[
          { titulo: 'Fornecedores', subtitulo: 'Contatos, prazos e favoritos', rota: '/fornecedores', icone: 'storefront-outline', contagem: contagens[1] },
          { titulo: 'Vínculos', subtitulo: 'Quem vende cada matéria-prima e por quanto', rota: '/vinculos', icone: 'link-outline', contagem: contagens[2] },
        ]}
      />
    </Screen>
  );
}
