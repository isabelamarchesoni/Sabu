import { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import { type Produto } from '../../services/catalogo';
import { formatarDinheiro, precoAtual, promocaoAtiva, menorPreco, estoqueTotal, variacoesDisponiveis } from '../../utils/formatar';
import VitoriaRegia from '../VitoriaRegia';
import Badge from './Badge';

type Props = {
  produto: Produto;
  aoPressionar: () => void;
};

export default function ProductCard({ produto, aoPressionar }: Props) {
  const { cores } = useContext(TemaContext);

  const variacao = menorPreco(produto);
  const esgotado = estoqueTotal(produto) === 0;
  const emPromocao = variacao ? promocaoAtiva(variacao) : false;
  const variasOpcoes = variacoesDisponiveis(produto).length > 1;

  return (
    <TouchableOpacity
      style={[styles.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda, boxShadow: `0px 4px 14px ${cores.sombraCartao}` }]}
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${produto.nome}`}
    >
      <View style={[styles.imagem, { backgroundColor: cores.fundoImagem }]}>
        <VitoriaRegia tamanho={56} cores={cores} corFundo={cores.fundoImagem} mostrarFlor={false} sombra={false} />
        <View style={styles.selo}>{esgotado ? <Badge texto="Esgotado" tom="erro" /> : emPromocao ? <Badge texto="Promoção" tom="destaque" /> : null}</View>
      </View>

      <View style={styles.informacoes}>
        <Text style={[styles.nome, { color: cores.texto }]} numberOfLines={2}>
          {produto.nome}
        </Text>

        <View style={styles.rodape}>
          <View style={styles.precos}>
            {variacao ? (
              <>
                {variasOpcoes && <Text style={[styles.aPartir, { color: cores.textoApoio }]}>a partir de</Text>}
                <Text style={[styles.preco, { color: cores.texto }]}>{formatarDinheiro(precoAtual(variacao))}</Text>
                {emPromocao && <Text style={[styles.precoAntigo, { color: cores.textoApoio }]}>{formatarDinheiro(variacao.preco)}</Text>}
              </>
            ) : (
              <Text style={[styles.aPartir, { color: cores.textoApoio }]}>Indisponível</Text>
            )}
          </View>
          <View style={[styles.botaoRedondo, { borderColor: cores.botao }]}>
            <Ionicons name="arrow-forward" size={16} color={cores.botao} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flex: 1,
    maxWidth: '48.5%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  imagem: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selo: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  informacoes: {
    padding: 12,
    gap: 8,
  },
  nome: {
    fontSize: 14,
    fontWeight: '600',
    minHeight: 36,
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  precos: {
    flex: 1,
  },
  aPartir: {
    fontSize: 11,
  },
  preco: {
    fontSize: 15,
    fontWeight: '700',
  },
  precoAntigo: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  botaoRedondo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});