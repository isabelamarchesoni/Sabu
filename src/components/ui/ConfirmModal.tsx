import { useContext } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { TemaContext } from '../../theme/TemaContext';
import Button from './Button';

type Props = {
  visivel: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  perigo?: boolean;
  carregando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
};

export default function ConfirmModal({ visivel, titulo, mensagem, textoConfirmar, perigo = false, carregando = false, aoConfirmar, aoCancelar }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoCancelar}>
      <View style={styles.fundo}>
        <View style={[styles.caixa, { backgroundColor: cores.cartao }]}>
          <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text>
          <Text style={[styles.mensagem, { color: cores.textoApoio }]}>{mensagem}</Text>
          <View style={styles.botoes}>
            <Button titulo={textoConfirmar} variante={perigo ? 'perigo' : 'primario'} carregando={carregando} aoPressionar={aoConfirmar} />
            <Button titulo="Cancelar" variante="secundario" desabilitado={carregando} aoPressionar={aoCancelar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  caixa: {
    borderRadius: 24,
    padding: 24,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  mensagem: {
    fontSize: 15,
    lineHeight: 22,
  },
  botoes: {
    marginTop: 24,
    gap: 8,
  },
});