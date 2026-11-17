import { useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import { PERGUNTAS, listarIngredientes, recomendarProduto, recomendacaoIndisponivel, textoDaResposta, type OpcaoQuiz, type RespostasQuiz } from '../../services/quiz';
import { mensagemDeErro } from '../../services/api';
import Screen from '../../components/ui/Screen';
import Header from '../../components/ui/Header';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import Notice from '../../components/ui/Notice';

type Rascunho = Partial<Record<keyof RespostasQuiz, string | number | (string | number)[]>>;

export default function PerguntasQuiz() {
  const { cores } = useContext(TemaContext);
  const [etapa, setEtapa] = useState(0);
  const [respostas, setRespostas] = useState<Rascunho>({ alergia_ingrediente: [] });
  const [ingredientes, setIngredientes] = useState<OpcaoQuiz[]>([]);
  const [ingredientesIndisponiveis, setIngredientesIndisponiveis] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(function () {
    carregarIngredientes();
  }, []);

  async function carregarIngredientes() {
    try {
      setIngredientes(await listarIngredientes());
    } catch {
      setIngredientesIndisponiveis(true);
    }
  }

  const pergunta = PERGUNTAS[etapa];
  const ultima = etapa === PERGUNTAS.length - 1;
  const alergias = (respostas.alergia_ingrediente as (string | number)[]) ?? [];

  function escolher(valor: string | number) {
    setRespostas({ ...respostas, [pergunta.campo]: valor });
    setTimeout(function () {
      setEtapa(function (atual) {
        return Math.min(atual + 1, PERGUNTAS.length - 1);
      });
    }, 220);
  }

  function alternarAlergia(valor: string | number) {
    const marcada = alergias.includes(valor);
    setRespostas({
      ...respostas,
      alergia_ingrediente: marcada
        ? alergias.filter(function (item) {
            return item !== valor;
          })
        : [...alergias, valor],
    });
  }

  function voltar() {
    setErro('');
    setIndisponivel(false);
    if (etapa === 0) {
      router.back();
    } else {
      setEtapa(etapa - 1);
    }
  }

  async function enviar() {
    setErro('');
    setIndisponivel(false);
    const completas = respostas as RespostasQuiz;
    const resumo = PERGUNTAS.filter(function (item) {
      return item.campo !== 'alergia_ingrediente';
    }).map(function (item) {
      return { pergunta: item.titulo.replace('?', ''), resposta: textoDaResposta(item.campo, completas[item.campo] as string | number) };
    });
    const nomesAlergias = ingredientes
      .filter(function (opcao) {
        return alergias.includes(opcao.valor);
      })
      .map(function (opcao) {
        return opcao.rotulo;
      });
    resumo.push({ pergunta: 'Alergias', resposta: nomesAlergias.length > 0 ? nomesAlergias.join(', ') : 'Nenhuma' });
    setEnviando(true);
    try {
      const recomendacao = await recomendarProduto({ ...completas, alergia_ingrediente: alergias });
      router.replace({
        pathname: '/quiz/resultado',
        params: {
          produto: String(recomendacao.produtoId),
          variacao: recomendacao.variacaoId ? String(recomendacao.variacaoId) : '',
          motivo: recomendacao.motivo,
          resumo: JSON.stringify(resumo),
        },
      });
    } catch (e) {
      if (recomendacaoIndisponivel(e)) {
        setIndisponivel(true);
      } else {
        setErro(mensagemDeErro(e, 'Não foi possível falar com o Bú agora. Tente de novo.'));
      }
    } finally {
      setEnviando(false);
    }
  }

  const progresso = (etapa + 1) / PERGUNTAS.length;

  return (
    <Screen rolavel>
      <Header titulo="Quiz do Bú" subtitulo={`Pergunta ${etapa + 1} de ${PERGUNTAS.length}`} voltar />

      <View style={[estilos.trilho, { backgroundColor: cores.destaqueSuave }]}>
        <View style={[estilos.preenchido, { width: `${progresso * 100}%`, backgroundColor: cores.botao }]} />
      </View>

      <Text style={[estilos.pergunta, { color: cores.texto }]}>{pergunta.titulo}</Text>
      <Text style={[estilos.ajuda, { color: cores.textoApoio }]}>{pergunta.ajuda}</Text>

      {pergunta.multipla ? (
        <View style={estilos.alergias}>
          {ingredientesIndisponiveis ? (
            <Notice mensagem="A lista de ingredientes ainda não está disponível. Pode seguir sem marcar." tom="sucesso" />
          ) : ingredientes.length === 0 ? (
            <Text style={[estilos.ajuda, { color: cores.textoApoio }]}>Carregando ingredientes…</Text>
          ) : (
            <View style={estilos.chips}>
              {ingredientes.map(function (opcao) {
                return (
                  <Chip
                    key={String(opcao.valor)}
                    rotulo={opcao.rotulo}
                    selecionado={alergias.includes(opcao.valor)}
                    aoPressionar={function () {
                      alternarAlergia(opcao.valor);
                    }}
                  />
                );
              })}
            </View>
          )}
        </View>
      ) : (
        <View style={estilos.opcoes}>
          {pergunta.opcoes.map(function (opcao) {
            const selecionada = respostas[pergunta.campo] === opcao.valor;
            return (
              <Pressable
                key={String(opcao.valor)}
                onPress={function () {
                  escolher(opcao.valor);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: selecionada }}
                style={[
                  estilos.opcao,
                  {
                    backgroundColor: selecionada ? cores.destaqueSuave : cores.cartao,
                    borderColor: selecionada ? cores.botao : cores.borda,
                  },
                ]}
              >
                <Text style={[estilos.textoOpcao, { color: cores.texto }]}>{opcao.rotulo}</Text>
                <Ionicons name={selecionada ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selecionada ? cores.botao : cores.placeholder} />
              </Pressable>
            );
          })}
        </View>
      )}

      {indisponivel ? (
        <View style={estilos.aviso}>
          <Notice mensagem="O Bú ainda está aprendendo a recomendar sabonetes. Enquanto isso, dá uma olhada em todos eles!" tom="sucesso" />
          <Button
            titulo="Ver todos os sabonetes"
            variante="secundario"
            icone="leaf-outline"
            aoPressionar={function () {
              router.dismissTo('/vitrine');
            }}
          />
        </View>
      ) : null}
      {erro ? <Notice mensagem={erro} tom="erro" /> : null}

      <View style={estilos.acoes}>
        {ultima ? <Button titulo="Ver meu sabonete" icone="sparkles-outline" carregando={enviando} aoPressionar={enviar} /> : null}
        <Button titulo={etapa === 0 ? 'Sair do quiz' : 'Pergunta anterior'} variante="texto" icone="chevron-back" desabilitado={enviando} aoPressionar={voltar} />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  preenchido: {
    height: 8,
    borderRadius: 4,
  },
  pergunta: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 28,
  },
  ajuda: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  opcoes: {
    marginTop: 20,
    gap: 10,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  textoOpcao: {
    fontSize: 17,
    fontWeight: '600',
  },
  alergias: {
    marginTop: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aviso: {
    marginTop: 20,
    gap: 10,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 6,
  },
});
