// layout das abas desenha a barra de baixo com início, catalogo, estoque, compras, vendas e conta.
// só as telas listadas em ABAS viram aba.
import { useContext, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../../theme/TemaContext';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

type Aba = { nome: string; titulo: string; icone: NomeIcone; iconeAtivo: NomeIcone };

const ABAS: Aba[] = [
  { nome: 'inicio/index', titulo: 'Início', icone: 'home-outline', iconeAtivo: 'home' },
  { nome: 'catalogo/index', titulo: 'Catálogo', icone: 'pricetags-outline', iconeAtivo: 'pricetags' },
  { nome: 'estoque/index', titulo: 'Estoque', icone: 'cube-outline', iconeAtivo: 'cube' },
  { nome: 'compras/index', titulo: 'Compras', icone: 'cart-outline', iconeAtivo: 'cart' },
  { nome: 'vendas/index', titulo: 'Vendas', icone: 'receipt-outline', iconeAtivo: 'receipt' },
  { nome: 'conta/index', titulo: 'Conta', icone: 'person-circle-outline', iconeAtivo: 'person-circle' },
];

export default function LayoutAbas() {
  const { cores } = useContext(TemaContext);

  const opcoes = {
    headerShown: false,
    tabBarActiveTintColor: cores.botao,
    tabBarInactiveTintColor: cores.placeholder,
    tabBarStyle: {
      backgroundColor: cores.cartao,
      borderTopColor: cores.borda,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600' as const,
    },
    sceneStyle: {
      backgroundColor: cores.fundo,
    },
  };

  return (
    <Tabs screenOptions={opcoes}>
            {ABAS.map(function (aba) { return <Tabs.Screen key={aba.nome} name={aba.nome} options={{ title: aba.titulo, tabBarIcon: function ({ size, focused }) { return <Ionicons name={focused ? aba.iconeAtivo : aba.icone} size={size} color={focused ? cores.botao : cores.placeholder} />; } }} />; })}
    </Tabs>
  );
}