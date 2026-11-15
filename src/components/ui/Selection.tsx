import { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import Button from './Button';

export type Opcao = {
  valor: number | string;
  rotulo: string;
};

type Props = {
  rotulo: string;
  opcoes: Opcao[];
  selecionados: (number | string)[];
  aoMudar: (selecionados: (number | string)[]) => void;
  multiplo?: boolean;
  placeholder?: string;
  erro?: string;
};

export default function Select({ rotulo, opcoes, selecionados, aoMudar, multiplo = false, placeholder = 'Selecione', erro }: Props) {
  const { cores } = useContext(TemaContext);
  const espacos = useSafeAreaInsets();
  const [aberto, setAberto] = useState(false);

  const textoEscolhido = opcoes
    .filter(function (opcao) {
      return selecionados.includes(opcao.valor);
    })
    .map(function (opcao) {
      return opcao.rotulo;
    })
    .join(', ');

  function escolher(valor: number | string) {
    if (multiplo) {
      const jaEscolhido = selecionados.includes(valor);
      aoMudar(
        jaEscolhido
          ? selecionados.filter(function (item) {
              return item !== valor;
            })
          : [...selecionados, valor]
      );
    } else {
      aoMudar([valor]);
      setAberto(false);
    }
  }

  function fechar() {
    setAberto(false);
  }

  return (
    <View style={styles.grupo}>
      <Text style={[styles.rotulo, { color: cores.texto }]}>{rotulo}</Text>

      <TouchableOpacity
        style={[styles.caixa, { backgroundColor: cores.campo, borderColor: erro ? cores.erro : cores.bordaForte }]}
        onPress={function () {
          setAberto(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
      >
        <Text style={[styles.valor, { color: textoEscolhido ? cores.texto : cores.placeholder }]} numberOfLines={1}>
          {textoEscolhido || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={cores.textoApoio} />
      </TouchableOpacity>

      {erro && <Text style={[styles.erro, { color: cores.erro }]}>{erro}</Text>}

      <Modal visible={aberto} transparent animationType="slide" onRequestClose={fechar}>
        <View style={styles.fundoModal}>
          <View style={[styles.folha, { backgroundColor: cores.cartao, paddingBottom: espacos.bottom + 16 }]}>
            <View style={styles.topo}>
              <Text style={[styles.tituloModal, { color: cores.texto }]}>{rotulo}</Text>
              <TouchableOpacity style={styles.botaoFechar} onPress={fechar} accessibilityLabel="Fechar">
                <Ionicons name="close" size={24} color={cores.texto} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={opcoes}
              style={styles.lista}
              keyExtractor={function (opcao) {
                return String(opcao.valor);
              }}
              renderItem={function ({ item }) {
                const marcado = selecionados.includes(item.valor);
                return (
                  <TouchableOpacity
                    style={[styles.opcao, { borderBottomColor: cores.borda }]}
                    onPress={function () {
                      escolher(item.valor);
                    }}
                    accessibilityState={{ selected: marcado }}
                  >
                    <Text style={[styles.textoOpcao, { color: cores.texto }]}>{item.rotulo}</Text>
                    {marcado && <Ionicons name="checkmark-circle" size={22} color={cores.botao} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={[styles.vazio, { color: cores.textoApoio }]}>Nenhuma opção disponível.</Text>}
            />

            {multiplo && (
              <View style={styles.rodape}>
                <Button titulo="Concluir" aoPressionar={fechar} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: {
    marginBottom: 16,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  caixa: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  valor: {
    flex: 1,
    fontSize: 16,
  },
  erro: {
    fontSize: 13,
    marginTop: 6,
  },
  fundoModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  folha: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tituloModal: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  botaoFechar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    maxHeight: 420,
  },
  opcao: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  textoOpcao: {
    flex: 1,
    fontSize: 16,
  },
  vazio: {
    fontSize: 15,
    paddingVertical: 24,
    textAlign: 'center',
  },
  rodape: {
    marginTop: 16,
  },
});