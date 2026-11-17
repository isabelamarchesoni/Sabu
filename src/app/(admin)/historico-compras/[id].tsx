// Detalhe da compra (/historico-compras/3). O id é o número da compra. Mostra itens e lotes gerados, permite editar a observação e devolver.
import { useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarCompra, buscarFornecedor, atualizarObservacaoCompra, devolverCompra, SITUACOES_COMPRA, type Compra, type Fornecedor } from '../../../services/compras';
import { buscarMateriaPrima, formatarQuantidade, formatarCusto, type MateriaPrima } from '../../../services/estoque';
import { mensagemDeErro } from '../../../services/api';
import { formatarDataHora } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Badge from '../../../components/ui/Badge';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import TextField from '../../../components/ui/TextField';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

export default function DetalheCompra() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [compra, setCompra] = useState<Compra | null>(null);
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [materias, setMaterias] = useState<Record<number, MateriaPrima>>({});
  const [observacao, setObservacao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmandoDevolucao, setConfirmandoDevolucao] = useState(false);
  const [processando, setProcessando] = useState(false);

  useFocusEffect(
    useCallback(
      function () {
        carregar();
      },
      [id]
    )
  );

  async function carregar() {
    setErro('');
    try {
      const dados = await buscarCompra(Number(id));
      const ids = Array.from(
        new Set(
          dados.itens.map(function (item) {
            return item.materia_prima;
          })
        )
      );
      const [dadosFornecedor, listaMaterias] = await Promise.all([buscarFornecedor(dados.fornecedor), Promise.all(ids.map(buscarMateriaPrima))]);
      const mapa: Record<number, MateriaPrima> = {};
      listaMaterias.forEach(function (materia) {
        mapa[materia.id] = materia;
      });
      setCompra(dados);
      setFornecedor(dadosFornecedor);
      setMaterias(mapa);
      setObservacao(dados.observacao ?? '');
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar a compra.'));
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    carregar();
  }

  async function salvarObservacao() {
    setProcessando(true);
    setErroAcao('');
    setAviso('');
    try {
      const atualizada = await atualizarObservacaoCompra(Number(id), observacao.trim());
      setObservacao(atualizada.observacao ?? '');
      setAviso('Observação salva.');
      await carregar();
    } catch (e) {
      setErroAcao(mensagemDeErro(e, 'Não foi possível salvar a observação.'));
    } finally {
      setProcessando(false);
    }
  }

  async function devolver() {
    setProcessando(true);
    setErroAcao('');
    setAviso('');
    try {
      await devolverCompra(Number(id));
      setConfirmandoDevolucao(false);
      setAviso('Compra devolvida. As quantidades saíram do estoque das matérias-primas.');
      await carregar();
    } catch (e) {
      setConfirmandoDevolucao(false);
      setErroAcao(mensagemDeErro(e, 'Não foi possível devolver a compra.'));
    } finally {
      setProcessando(false);
    }
  }

  function linha(rotulo: string, valor: string) {
    return (
      <View style={[estilos.linha, { borderColor: cores.borda }]}>
        <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>{rotulo}</Text>
        <Text style={[estilos.valor, { color: cores.texto }]}>{valor}</Text>
      </View>
    );
  }

  if (carregando || !compra) {
    return (
      <Screen>
        <Header titulo="Compra" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando compra…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  const situacao = SITUACOES_COMPRA[compra.status];
  const concluida = compra.status === 'CONCLUIDO';
  const observacaoMudou = observacao.trim() !== (compra.observacao ?? '').trim();

  return (
    <Screen rolavel>
      <Header titulo={`Compra #${compra.id}`} voltar />

      {aviso ? <Notice mensagem={aviso} tom="sucesso" /> : null}
      {erroAcao ? <Notice mensagem={erroAcao} tom="erro" /> : null}

      <View style={estilos.topo}>
        <Text style={[estilos.total, { color: cores.texto }]}>{formatarCusto(compra.valor_total)}</Text>
        <Badge texto={situacao.texto} tom={situacao.tom} />
      </View>

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {linha('Fornecedor', fornecedor ? fornecedor.nome : `Fornecedor ${compra.fornecedor}`)}
        {linha('Realizada em', formatarDataHora(compra.compra_realizada_em))}
        {linha('Atualizada em', formatarDataHora(compra.atualizada_em))}
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo={`Itens (${compra.itens.length})`} />
        {compra.itens.map(function (item) {
          const materia = materias[item.materia_prima];
          const unidade = materia ? materia.unidade_medida.toLowerCase() : '';
          const subtotal = Number(item.quantidade_item) * Number(item.custo_unitario_momento_compra);
          return (
            <ListItem
              key={item.id}
              titulo={materia ? materia.nome : `Matéria-prima ${item.materia_prima}`}
              subtitulo={`${formatarQuantidade(item.quantidade_item)} ${unidade} × ${formatarCusto(item.custo_unitario_momento_compra)} · lote ${item.lote}`}
              detalhe={formatarCusto(subtotal)}
              aoPressionar={function () {
                router.push(`/materias-primas/${item.materia_prima}`);
              }}
            />
          );
        })}
      </View>

      <View style={estilos.secao}>
        <TextField
          rotulo="Observação"
          valor={observacao}
          aoMudar={setObservacao}
          placeholder="Ex.: chegou com 2 dias de atraso"
          multilinha
          desabilitado={processando}
        />
        {observacaoMudou ? <Button titulo="Salvar observação" variante="secundario" carregando={processando} aoPressionar={salvarObservacao} /> : null}
      </View>

      {concluida ? (
        <View style={estilos.perigo}>
          <Button
            titulo="Devolver compra ao fornecedor"
            variante="textoPerigo"
            icone="return-down-back-outline"
            aoPressionar={function () {
              setAviso('');
              setErroAcao('');
              setConfirmandoDevolucao(true);
            }}
          />
        </View>
      ) : (
        <Text style={[estilos.nota, { color: cores.textoApoio }]}>Compra devolvida: os itens já saíram do estoque.</Text>
      )}

      <ConfirmModal
        visivel={confirmandoDevolucao}
        titulo="Devolver compra?"
        mensagem="Todas as quantidades desta compra saem do estoque. Só dá certo se os lotes ainda tiverem tudo que entrou. Isso não pode ser desfeito."
        textoConfirmar="Devolver"
        perigo
        carregando={processando}
        aoConfirmar={devolver}
        aoCancelar={function () {
          setConfirmandoDevolucao(false);
        }}
      />
    </Screen>
  );
}

const estilos = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  total: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
  },
  cartao: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rotulo: {
    fontSize: 14,
  },
  valor: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  secao: {
    marginTop: 24,
    gap: 10,
  },
  perigo: {
    marginTop: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  nota: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});
