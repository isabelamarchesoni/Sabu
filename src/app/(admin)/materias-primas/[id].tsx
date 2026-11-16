// Detalhe da matéria-prima (/materias-primas/3). O id é o número da matéria-prima. Mostra dados, estoque e lotes; editar abre materias-primas/formulario/[id].
import { useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarMateriaPrima, apagarMateriaPrima, restaurarMateriaPrima, listarLotesDaMateriaPrima, rotuloTipo, formatarQuantidade, formatarCusto, SITUACOES_LOTE, type LoteMateriaPrima, type MateriaPrima } from '../../../services/estoque';
import { listarVinculos, opcoesFornecedores, type Vinculo } from '../../../services/compras';
import { mensagemDeErro } from '../../../services/api';
import { formatarData } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Badge from '../../../components/ui/Badge';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

export default function DetalheMateriaPrima() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [materia, setMateria] = useState<MateriaPrima | null>(null);
  const [lotes, setLotes] = useState<LoteMateriaPrima[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [nomesFornecedores, setNomesFornecedores] = useState<Record<number, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
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
      const [dados, listaLotes, listaVinculos, fornecedores] = await Promise.all([
        buscarMateriaPrima(Number(id)),
        listarLotesDaMateriaPrima(Number(id)),
        listarVinculos({ pagina: 1, materiaPrimaId: Number(id), apagados: false }),
        opcoesFornecedores(),
      ]);
      const nomes: Record<number, string> = {};
      fornecedores.forEach(function (opcao) {
        nomes[opcao.valor] = opcao.rotulo.replace('★ ', '');
      });
      setMateria(dados);
      setLotes(listaLotes);
      setVinculos(listaVinculos.results);
      setNomesFornecedores(nomes);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar a matéria-prima.'));
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    carregar();
  }

  async function apagar() {
    setProcessando(true);
    setErroAcao('');
    try {
      await apagarMateriaPrima(Number(id));
      setConfirmandoExclusao(false);
      setAviso('Matéria-prima apagada. Os vínculos de fornecedor dela também foram apagados.');
      await carregar();
    } catch (e) {
      setConfirmandoExclusao(false);
      setErroAcao(mensagemDeErro(e, 'Não foi possível apagar a matéria-prima.'));
    } finally {
      setProcessando(false);
    }
  }

  async function restaurar() {
    setProcessando(true);
    setErroAcao('');
    try {
      await restaurarMateriaPrima(Number(id));
      setAviso('Matéria-prima restaurada. Os vínculos de fornecedor não voltam sozinhos.');
      await carregar();
    } catch (e) {
      setErroAcao(mensagemDeErro(e, 'Não foi possível restaurar a matéria-prima.'));
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

  if (carregando || !materia) {
    return (
      <Screen>
        <Header titulo="Matéria-prima" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando matéria-prima…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  const apagada = materia.apagada_em !== null;
  const unidade = materia.unidade_medida.toLowerCase();

  return (
    <Screen rolavel>
      <Header titulo="Matéria-prima" voltar />

      {apagada ? <Notice mensagem="Esta matéria-prima está apagada. Restaure para voltar a usá-la." tom="erro" /> : null}
      {aviso ? <Notice mensagem={aviso} tom="sucesso" /> : null}
      {erroAcao ? <Notice mensagem={erroAcao} tom="erro" /> : null}

      <View style={estilos.topo}>
        <Text style={[estilos.nome, { color: cores.texto }]}>{materia.nome}</Text>
        <Badge texto={apagada ? 'Apagada' : 'Ativa'} tom={apagada ? 'erro' : 'sucesso'} />
      </View>

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {linha('SKU', materia.sku)}
        {linha('Tipo', rotuloTipo(materia.tipo))}
        {linha('Estoque atual', `${formatarQuantidade(materia.quantidade_estoque)} ${unidade}`)}
        {linha('Custo de referência', `${formatarCusto(materia.custo_unitario_referencia)}/${unidade}`)}
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo="Lotes"
          textoAcao="Novo lote"
          aoPressionarAcao={function () {
            router.push(`/lotes-materia-prima/novo?materia=${materia.id}` as Href);
          }}
        />
        {lotes.length > 0 ? (
          lotes.map(function (lote) {
            return (
              <ListItem
                key={lote.id}
                titulo={lote.numero_lote_fabricante || `Lote #${lote.id}`}
                subtitulo={`${lote.data_validade ? `validade ${formatarData(lote.data_validade)}` : 'sem validade'} · ${formatarQuantidade(lote.quantidade_atual)} de ${formatarQuantidade(lote.quantidade_inicial)} ${unidade}`}
                selo={SITUACOES_LOTE[lote.status]}
                aoPressionar={function () {
                  router.push(`/lotes-materia-prima/${lote.id}` as Href);
                }}
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Nenhum lote ainda. Os lotes nascem das compras ou de um lote novo.</Text>
        )}
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo="Fornecedores"
          textoAcao={apagada ? undefined : 'Vincular'}
          aoPressionarAcao={
            apagada
              ? undefined
              : function () {
                  router.push(`/vinculos/novo?materia=${materia.id}` as Href);
                }
          }
        />
        {vinculos.length > 0 ? (
          vinculos.map(function (vinculo) {
            return (
              <ListItem
                key={vinculo.id}
                titulo={nomesFornecedores[vinculo.fornecedor] ?? `Fornecedor ${vinculo.fornecedor}`}
                subtitulo={vinculo.sku_materia_prima_fornecedor ? `código ${vinculo.sku_materia_prima_fornecedor}` : undefined}
                detalhe={`${formatarCusto(vinculo.custo_unitario_fornecedor)}/${unidade}`}
                aoPressionar={function () {
                  router.push(`/vinculos/${vinculo.id}` as Href);
                }}
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Nenhum fornecedor vinculado. Vincule para comparar preços.</Text>
        )}
      </View>

      <View style={estilos.acoes}>
        <Button
          titulo="Editar matéria-prima"
          variante="secundario"
          icone="create-outline"
          aoPressionar={function () {
            router.push(`/materias-primas/formulario/${materia.id}`);
          }}
        />
        {apagada ? <Button titulo="Restaurar matéria-prima" variante="secundario" icone="refresh" carregando={processando} aoPressionar={restaurar} /> : null}
      </View>

      {!apagada ? (
        <View style={estilos.perigo}>
          <Button
            titulo="Excluir matéria-prima"
            variante="textoPerigo"
            icone="trash-outline"
            aoPressionar={function () {
              setAviso('');
              setErroAcao('');
              setConfirmandoExclusao(true);
            }}
          />
        </View>
      ) : null}

      <ConfirmModal
        visivel={confirmandoExclusao}
        titulo="Excluir matéria-prima?"
        mensagem={`"${materia.nome}" sai das listas e os vínculos de fornecedor dela também são apagados. Dá para restaurar depois.`}
        textoConfirmar="Excluir"
        perigo
        carregando={processando}
        aoConfirmar={apagar}
        aoCancelar={function () {
          setConfirmandoExclusao(false);
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
  nome: {
    flex: 1,
    fontSize: 24,
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
  vazio: {
    fontSize: 14,
  },
  acoes: {
    marginTop: 28,
    gap: 10,
  },
  perigo: {
    marginTop: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
});
