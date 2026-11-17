import { useContext, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import Badge, { type TomBadge } from './Badge';

export type ItemGrupo = {
  titulo: string;
  subtitulo: string;
  rota: string;
  icone: ComponentProps<typeof Ionicons>['name'];
  contagem?: number | null;
  alerta?: { texto: string; tom: TomBadge };
};

type Props = {
  titulo?: string;
  itens: ItemGrupo[];
};

export default function MenuGroup({ titulo, itens }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <View style={estilos.grupo}>
      {titulo ? <Text style={[estilos.rotuloGrupo, { color: cores.textoApoio }]}>{titulo.toUpperCase()}</Text> : null}
      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda, boxShadow: `0px 2px 10px ${cores.sombraCartao}` }]}>
        {itens.map(function (item, indice) {
          return (
            <TouchableOpacity
              key={item.rota}
              style={[estilos.linha, indice > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.bordaForte }]}
              onPress={function () {
                router.push(item.rota as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel={item.contagem !== undefined && item.contagem !== null ? `${item.titulo}, ${item.contagem}` : item.titulo}
            >
              <View style={[estilos.icone, { backgroundColor: cores.destaqueSuave }]}>
                <Ionicons name={item.icone} size={20} color={cores.botao} />
              </View>
              <View style={estilos.textos}>
                <Text style={[estilos.titulo, { color: cores.texto }]} numberOfLines={1}>
                  {item.titulo}
                </Text>
                <Text style={[estilos.subtitulo, { color: cores.textoApoio }]} numberOfLines={1}>
                  {item.subtitulo}
                </Text>
              </View>
              {item.alerta ? <Badge texto={item.alerta.texto} tom={item.alerta.tom} /> : null}
              {item.contagem !== undefined ? (
                <Text style={[estilos.contagem, { color: cores.textoApoio }]}>{item.contagem === null ? '—' : item.contagem}</Text>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={cores.placeholder} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: {
    marginTop: 20,
  },
  rotuloGrupo: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cartao: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
  },
  icone: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitulo: {
    fontSize: 13,
    marginTop: 2,
  },
  contagem: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'right',
  },
});
