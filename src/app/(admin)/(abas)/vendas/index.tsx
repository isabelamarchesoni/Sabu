import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listarPedidos, listarClientes } from '../../../../services/vendas';
import { contarTodos, plural } from '../../../../utils/contagens';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import ShortcutBar from '../../../../components/ui/ShortcutBar';
import MenuGroup from '../../../../components/ui/MenuGroup';

export default function Vendas() {
  const [contagens, setContagens] = useState<(number | null)[]>([]);

  useFocusEffect(
    useCallback(function () {
      carregar();
    }, [])
  );

  async function carregar() {
    setContagens(await contarTodos([listarPedidos({ pagina: 1 }), listarPedidos({ pagina: 1, status: 'PENDENTE' }), listarClientes({ pagina: 1 })]));
  }

  const pendentes = contagens[1];

  return (
    <Screen rolavel>
      <Header titulo="Vendas" subtitulo="Pedidos e clientes da loja" grande />

      <ShortcutBar
        atalhos={[
          { rotulo: 'Novo pedido', rota: '/pedidos/formulario/novo', icone: 'add' },
          { rotulo: 'Novo cliente', rota: '/clientes/formulario/novo', icone: 'person-add-outline' },
        ]}
      />

      <MenuGroup
        titulo="Vendas"
        itens={[
          {
            titulo: 'Pedidos',
            subtitulo: 'Pendentes, concluídos e estornos',
            rota: '/pedidos',
            icone: 'receipt-outline',
            contagem: contagens[0],
            alerta: pendentes ? { texto: plural(pendentes, 'pendente', 'pendentes'), tom: 'alerta' } : undefined,
          },
          { titulo: 'Clientes', subtitulo: 'Quem compra e como falar com cada um', rota: '/clientes', icone: 'people-outline', contagem: contagens[2] },
        ]}
      />
    </Screen>
  );
}
