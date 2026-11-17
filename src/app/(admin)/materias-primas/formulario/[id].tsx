// Formulário de matéria-prima. /materias-primas/formulario/novo cadastra; /materias-primas/formulario/3 edita a matéria-prima de id 3.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarMateriaPrima, salvarMateriaPrima, formatarQuantidade, TIPOS_MATERIA_PRIMA, UNIDADES_MEDIDA, type MateriaPrima, type TipoMateriaPrima, type UnidadeMedida } from '../../../../services/estoque';
import { mensagemDeErro } from '../../../../services/api';
import { erroDoCampo } from '../../../../utils/erros';
import { mascararDecimal } from '../../../../utils/mascaras';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import TextField from '../../../../components/ui/TextField';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';

const CAMPOS = ['sku', 'nome', 'tipo', 'unidade_medida', 'custo_unitario_referencia'];
const PADRAO_CUSTO = /^\d{1,6}(\.\d{1,4})?$/;

export default function FormularioMateriaPrima() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const criando = id === 'novo';

  const [sku, setSku] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoMateriaPrima | null>(null);
  const [unidade, setUnidade] = useState<UnidadeMedida | null>(null);
  const [custo, setCusto] = useState('');
  const [atual, setAtual] = useState<MateriaPrima | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(!criando);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(
    function () {
      if (!criando) {
        carregar();
      }
    },
    [id]
  );

  async function carregar() {
    setCarregando(true);
    setFalhouCarregar(false);
    try {
      const dados = await buscarMateriaPrima(Number(id));
      setAtual(dados);
      setSku(dados.sku);
      setNome(dados.nome);
      setTipo(dados.tipo);
      setUnidade(dados.unidade_medida);
      setCusto(dados.custo_unitario_referencia.replace('.', ','));
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar a matéria-prima.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  async function salvar() {
    setErroGeral('');
    const novosErros: Record<string, string> = {};
    const custoApi = custo.trim().replace(',', '.');
    if (!sku.trim()) {
      novosErros.sku = 'Informe o SKU.';
    } else if (sku.trim().length > 50) {
      novosErros.sku = 'Use no máximo 50 caracteres.';
    }
    if (!nome.trim()) {
      novosErros.nome = 'Informe o nome.';
    } else if (nome.trim().length > 100) {
      novosErros.nome = 'Use no máximo 100 caracteres.';
    }
    if (!tipo) {
      novosErros.tipo = 'Escolha o tipo.';
    }
    if (!unidade) {
      novosErros.unidade_medida = 'Escolha a unidade de medida.';
    }
    if (!PADRAO_CUSTO.test(custoApi)) {
      novosErros.custo_unitario_referencia = 'Informe um custo válido, ex.: 0,0450.';
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || !tipo || !unidade) {
      return;
    }
    setSalvando(true);
    try {
      const salva = await salvarMateriaPrima(criando ? null : Number(id), {
        sku: sku.trim(),
        nome: nome.trim(),
        tipo: tipo,
        unidade_medida: unidade,
        custo_unitario_referencia: custoApi,
      });
      if (criando) {
        router.replace(`/materias-primas/${salva.id}`);
      } else {
        router.back();
      }
    } catch (e) {
      const errosApi: Record<string, string> = {};
      for (const campo of CAMPOS) {
        const mensagem = erroDoCampo(e, campo);
        if (mensagem) {
          errosApi[campo] = mensagem;
        }
      }
      if (Object.keys(errosApi).length > 0) {
        setErros(errosApi);
      } else {
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar a matéria-prima.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  const titulo = criando ? 'Nova matéria-prima' : 'Editar matéria-prima';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando matéria-prima…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregar}
        />
      </Screen>
    );
  }

  return (
    <Screen rolavel>
      <Header titulo={titulo} voltar />

      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <TextField
          rotulo="SKU"
          valor={sku}
          aoMudar={setSku}
          placeholder="Ex.: OL-COCO"
          erro={erros.sku}
          maiusculas="characters"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Nome"
          valor={nome}
          aoMudar={setNome}
          placeholder="Ex.: Óleo de coco"
          erro={erros.nome}
          desabilitado={salvando}
        />
        <Select
          rotulo="Tipo"
          opcoes={TIPOS_MATERIA_PRIMA}
          selecionados={tipo ? [tipo] : []}
          aoMudar={function (valores) {
            setTipo(valores.length > 0 ? (valores[0] as TipoMateriaPrima) : null);
          }}
          placeholder="Escolha o tipo"
          erro={erros.tipo}
        />
        <Select
          rotulo="Unidade de medida"
          opcoes={UNIDADES_MEDIDA}
          selecionados={unidade ? [unidade] : []}
          aoMudar={function (valores) {
            setUnidade(valores.length > 0 ? (valores[0] as UnidadeMedida) : null);
          }}
          placeholder="Escolha a unidade"
          erro={erros.unidade_medida}
        />
        {!criando ? <Notice mensagem="A unidade não pode ser trocada depois que houver movimentações desta matéria-prima." tom="erro" /> : null}
        <TextField
          rotulo="Custo unitário de referência (R$)"
          valor={custo}
          aoMudar={function (texto) {
            setCusto(mascararDecimal(texto, 4));
          }}
          placeholder="0,0450"
          erro={erros.custo_unitario_referencia}
          ajuda="Por unidade de medida. Até 4 casas decimais."
          teclado="decimal-pad"
          desabilitado={salvando}
        />
        {atual ? (
          <TextField
            rotulo="Estoque atual"
            valor={`${formatarQuantidade(atual.quantidade_estoque)} ${atual.unidade_medida.toLowerCase()}`}
            aoMudar={function () {}}
            ajuda="Só para consulta: muda com compras, fabricação e movimentações."
            desabilitado
          />
        ) : null}
      </View>

      <View style={estilos.acoes}>
        <Button titulo="Salvar" aoPressionar={salvar} carregando={salvando} />
        <Button
          titulo="Cancelar"
          variante="secundario"
          desabilitado={salvando}
          aoPressionar={function () {
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  campos: {
    marginTop: 8,
    gap: 16,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});
