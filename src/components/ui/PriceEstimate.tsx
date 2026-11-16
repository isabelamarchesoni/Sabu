import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import { formatarDinheiro } from '../../utils/formatar';

type Props = {
  recomendado: number;
  minimo: number;
  maximo: number;
  precoAtual?: number;
};

function posicao(valor: number, minimo: number, maximo: number) {
  if (maximo <= minimo) {
    return 50;
  }
  const percentual = ((valor - minimo) / (maximo - minimo)) * 100;
  return Math.min(100, Math.max(0, percentual));
}

export default function PriceEstimate({ recomendado, minimo, maximo, precoAtual }: Props) {
  const { cores } = useContext(TemaContext);
  const marcaRecomendado = posicao(recomendado, minimo, maximo);
  const mostrarAtual = precoAtual !== undefined && precoAtual > 0;
  const marcaAtual = mostrarAtual ? posicao(precoAtual, minimo, maximo) : 0;

  return (
    <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
      <View style={estilos.rotuloLinha}>
        <Ionicons name="sparkles-outline" size={16} color={cores.textoApoio} />
        <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>Preço recomendado pela IA</Text>
      </View>
      <Text style={[estilos.recomendado, { color: cores.texto }]}>{formatarDinheiro(recomendado)}</Text>

      <Text style={[estilos.faixaTitulo, { color: cores.textoApoio }]}>Faixa de preço no mercado</Text>
      <View style={estilos.extremos}>
        <View>
          <Text style={[estilos.extremoRotulo, { color: cores.textoApoio }]}>Mínimo</Text>
          <Text style={[estilos.extremoValor, { color: cores.texto }]}>{formatarDinheiro(minimo)}</Text>
        </View>
        <View style={estilos.direita}>
          <Text style={[estilos.extremoRotulo, { color: cores.textoApoio }]}>Máximo</Text>
          <Text style={[estilos.extremoValor, { color: cores.texto }]}>{formatarDinheiro(maximo)}</Text>
        </View>
      </View>

      <View style={[estilos.trilho, { backgroundColor: cores.destaqueSuave }]}>
        {mostrarAtual ? <View style={[estilos.marcaAtual, { left: `${marcaAtual}%`, backgroundColor: cores.textoApoio }]} /> : null}
        <View style={[estilos.marca, { left: `${marcaRecomendado}%`, backgroundColor: cores.botao, borderColor: cores.cartao }]} />
      </View>

      {mostrarAtual ? (
        <Text style={[estilos.atual, { color: cores.textoApoio }]}>
          Seu preço hoje: {formatarDinheiro(precoAtual)} (traço cinza na barra)
        </Text>
      ) : null}
      <Text style={[estilos.nota, { color: cores.textoApoio }]}>Referência de mercado, não garantia de venda.</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  rotuloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
  },
  recomendado: {
    fontSize: 40,
    fontWeight: '800',
    marginTop: 6,
  },
  faixaTitulo: {
    fontSize: 13,
    marginTop: 14,
  },
  extremos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  direita: {
    alignItems: 'flex-end',
  },
  extremoRotulo: {
    fontSize: 12,
  },
  extremoValor: {
    fontSize: 16,
    fontWeight: '700',
  },
  trilho: {
    height: 10,
    borderRadius: 5,
    marginTop: 12,
    justifyContent: 'center',
  },
  marca: {
    position: 'absolute',
    width: 18,
    height: 18,
    marginLeft: -9,
    borderRadius: 9,
    borderWidth: 3,
  },
  marcaAtual: {
    position: 'absolute',
    width: 3,
    height: 18,
    marginLeft: -1.5,
    borderRadius: 2,
  },
  atual: {
    fontSize: 13,
    marginTop: 12,
  },
  nota: {
    fontSize: 13,
    marginTop: 6,
  },
});
