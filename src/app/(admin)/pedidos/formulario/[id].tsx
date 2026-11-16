// formulário de pedido. /pedidos/formulario/novo registra uma venda (aceita ?cliente=ID); /pedidos/formulario/3 edita só o endereço e a observação do pedido 3.
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { TemaContext } from '../../../../theme/TemaContext';
import { listarProdutosAdmin, type Variacao } from '../../../../services/catalogo';
import { listarVariacoes, buscarVariacao } from '../../../../services/variacoes';
import { listarClientes, buscarCliente, buscarPedido, criarPedido, atualizarPedido, type Cliente, type DadosEndereco, type Pedido } from '../../../../services/vendas';
import { ErroApi, mensagemDeErro } from '../../../../services/api';
import { erroDoCampo } from '../../../../utils/erros';
import { formatarDinheiro, precoAtual } from '../../../../utils/formatar';
import { digitos, mascararCep } from '../../../../utils/mascaras';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import TextField from '../../../../components/ui/TextField';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';
import SectionTitle from '../../../../components/ui/SectionTitle';
import ListItem from '../../../../components/ui/ListItem';

type LinhaItem = {
  chave: number;
  variacaoId: number | null;
  quantidade: string;
};

const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const CAMPOS = ['cliente', 'cep', 'logradouro', 'numero_residencia', 'complemento', 'bairro', 'cidade', 'sigla_estado', 'observacao'];
const LIMITES: Record<string, number> = {
  logradouro: 150,
  numero_residencia: 20,
  complemento: 50,
  bairro: 50,
  cidade: 50,
};
const LIMITE_QUANTIDADE = 1000;

export default function FormularioPedido() {
  const { cores } = useContext(TemaContext);
  const { id, cliente } = useLocalSearchParams<{ id: string; cliente?: string }>();
  const criando = id === 'novo';
  const proximaChave = useRef(2);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [nomesProdutos, setNomesProdutos] = useState<Record<number, string>>({});
  const [clienteId, setClienteId] = useState<number | null>(cliente ? Number(cliente) : null);
  const [endereco, setEndereco] = useState<DadosEndereco>({
    cep: '',
    logradouro: '',
    numero_residencia: '',
    complemento: '',
    bairro: '',
    cidade: '',
    sigla_estado: '',
    observacao: '',
  });
  const [itens, setItens] = useState<LinhaItem[]>([{ chave: 1, variacaoId: null, quantidade: '1' }]);
  const [errosItens, setErrosItens] = useState<Record<number, string>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [faltaEstoque, setFaltaEstoque] = useState(false);
  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null);
  const [nomeClienteAtual, setNomeClienteAtual] = useState('');
  const [variacoesDoPedido, setVariacoesDoPedido] = useState<Record<number, Variacao>>({});
  const [carregando, setCarregando] = useState(!criando);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(
    useCallback(
      function () {
        if (criando) {
          carregarOpcoes();
        }
      },
      [criando]
    )
  );

  useEffect(
    function () {
      if (cliente) {
        setClienteId(Number(cliente));
      }
    },
    [cliente]
  );

  useEffect(
    function () {
      if (!criando) {
        carregarPedido();
      }
    },
    [id]
  );

  async function carregarOpcoes() {
    try {
      const [listaClientes, listaVariacoes, listaProdutos] = await Promise.all([
        listarClientes({ pagina: 1, ordenacao: 'nome' }),
        listarVariacoes({ pagina: 1, apagadas: false, produtoAtivo: true }),
        listarProdutosAdmin({ pagina: 1 }),
      ]);
      const nomes: Record<number, string> = {};
      listaProdutos.results.forEach(function (produto) {
        nomes[produto.id] = produto.nome;
      });
      setClientes(listaClientes.results);
      setVariacoes(listaVariacoes.results);
      setNomesProdutos(nomes);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar clientes e sabonetes.'));
    }
  }

  async function carregarPedido() {
    setCarregando(true);
    setFalhouCarregar(false);
    try {
      const dados = await buscarPedido(Number(id));
      const ids = Array.from(
        new Set(
          dados.itens.map(function (item) {
            return item.variacao;
          })
        )
      );
      const [dadosCliente, lista] = await Promise.all([
        dados.cliente !== null ? buscarCliente(dados.cliente).catch(function () { return null; }) : Promise.resolve(null),
        Promise.all(
          ids.map(function (idVariacao) {
            return buscarVariacao(idVariacao).catch(function () {
              return null;
            });
          })
        ),
      ]);
      const mapa: Record<number, Variacao> = {};
      lista.forEach(function (variacao) {
        if (variacao) {
          mapa[variacao.id] = variacao;
        }
      });
      setPedidoAtual(dados);
      setNomeClienteAtual(dadosCliente ? dadosCliente.nome : 'Sem cliente');
      setVariacoesDoPedido(mapa);
      setEndereco({
        cep: dados.cep ? mascararCep(dados.cep) : '',
        logradouro: dados.logradouro,
        numero_residencia: dados.numero_residencia,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        sigla_estado: dados.sigla_estado,
        observacao: dados.observacao,
      });
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar o pedido.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function mudarEndereco(campo: keyof DadosEndereco, valor: string) {
    setEndereco({ ...endereco, [campo]: valor });
    setErros({ ...erros, [campo]: '' });
  }

  function variacaoPorId(idVariacao: number | null) {
    if (idVariacao === null) {
      return undefined;
    }
    return variacoes.find(function (variacao) {
      return variacao.id === idVariacao;
    });
  }

  function nomeVariacao(variacao: Variacao) {
    const produto = nomesProdutos[variacao.produto];
    return produto ? `${produto} ${variacao.nome}` : variacao.nome;
  }

  function mudarItem(chave: number, mudancas: Partial<LinhaItem>) {
    setItens(
      itens.map(function (item) {
        return item.chave === chave ? { ...item, ...mudancas } : item;
      })
    );
    setErrosItens({ ...errosItens, [chave]: '' });
  }

  function adicionarItem() {
    setItens([...itens, { chave: proximaChave.current, variacaoId: null, quantidade: '1' }]);
    proximaChave.current += 1;
  }

  function removerItem(chave: number) {
    setItens(
      itens.filter(function (item) {
        return item.chave !== chave;
      })
    );
  }

  function validarEndereco() {
    const novosErros: Record<string, string> = {};
    const numerosCep = digitos(endereco.cep);
    if (numerosCep.length > 0 && numerosCep.length !== 8) {
      novosErros.cep = 'O CEP tem 8 números.';
    }
    Object.keys(LIMITES).forEach(function (campo) {
      const valor = endereco[campo as keyof DadosEndereco].trim();
      if (valor.length > LIMITES[campo]) {
        novosErros[campo] = `Use no máximo ${LIMITES[campo]} caracteres.`;
      }
    });
    return novosErros;
  }

  function validarItens() {
    const novosErros: Record<number, string> = {};
    const usadas: number[] = [];
    itens.forEach(function (item) {
      const variacao = variacaoPorId(item.variacaoId);
      const quantidade = Number(item.quantidade);
      if (!variacao) {
        novosErros[item.chave] = 'Escolha o sabonete.';
      } else if (usadas.includes(variacao.id)) {
        novosErros[item.chave] = 'Este sabonete já está no pedido. Some as quantidades no outro item.';
      } else if (!item.quantidade || quantidade < 1 || quantidade > LIMITE_QUANTIDADE) {
        novosErros[item.chave] = 'Informe uma quantidade de 1 a 1.000.';
      } else if (quantidade > variacao.quantidade_estoque) {
        novosErros[item.chave] = `Só há ${variacao.quantidade_estoque} em estoque.`;
      }
      if (variacao) {
        usadas.push(variacao.id);
      }
    });
    return novosErros;
  }

  function enderecoLimpo(): DadosEndereco {
    return {
      cep: endereco.cep,
      logradouro: endereco.logradouro.trim(),
      numero_residencia: endereco.numero_residencia.trim(),
      complemento: endereco.complemento.trim(),
      bairro: endereco.bairro.trim(),
      cidade: endereco.cidade.trim(),
      sigla_estado: endereco.sigla_estado,
      observacao: endereco.observacao.trim(),
    };
  }

  function enderecoSemVazios() {
    const dados = enderecoLimpo();
    const resultado: Partial<DadosEndereco> = {};
    (Object.keys(dados) as (keyof DadosEndereco)[]).forEach(function (campo) {
      if (dados[campo]) {
        resultado[campo] = dados[campo];
      }
    });
    return resultado;
  }

  async function salvar() {
    setErroGeral('');
    setFaltaEstoque(false);
    const novosErros = validarEndereco();
    const novosErrosItens = criando ? validarItens() : {};
    setErros(novosErros);
    setErrosItens(novosErrosItens);
    if (Object.keys(novosErros).length > 0 || Object.keys(novosErrosItens).length > 0) {
      return;
    }
    if (criando && itens.length === 0) {
      setErroGeral('O pedido precisa de pelo menos um item.');
      return;
    }
    setSalvando(true);
    try {
      if (criando) {
        const novo = await criarPedido({
          ...enderecoSemVazios(),
          ...(clienteId !== null ? { cliente: clienteId } : {}),
          itens: itens.map(function (item) {
            return { variacao: item.variacaoId as number, quantidade_item: Number(item.quantidade) };
          }),
        });
        router.replace(`/pedidos/${novo.id}`);
      } else {
        await atualizarPedido(Number(id), enderecoLimpo());
        router.back();
      }
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === 'estoque_insuficiente') {
        setFaltaEstoque(true);
        setErroGeral(mensagemDeErro(e, 'Falta estoque para algum item.'));
        return;
      }
      const errosApi: Record<string, string> = {};
      for (const campo of CAMPOS) {
        const mensagem = erroDoCampo(e, campo);
        if (mensagem) {
          errosApi[campo] = mensagem;
        }
      }
      const erroItens = erroDoCampo(e, 'itens');
      if (Object.keys(errosApi).length > 0) {
        setErros(errosApi);
      }
      if (erroItens) {
        setErroGeral(erroItens);
      } else if (Object.keys(errosApi).length === 0) {
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar o pedido.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  const titulo = criando ? 'Novo pedido' : 'Editar pedido';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando pedido…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregarPedido}
        />
      </Screen>
    );
  }

  const bloqueado = !criando && pedidoAtual !== null && pedidoAtual.status !== 'PENDENTE';
  const totalEstimado = itens.reduce(function (soma, item) {
    const variacao = variacaoPorId(item.variacaoId);
    return variacao ? soma + precoAtual(variacao) * (Number(item.quantidade) || 0) : soma;
  }, 0);

  return (
    <Screen rolavel>
      <Header titulo={criando ? titulo : `${titulo} #${id}`} voltar />

      {bloqueado ? <Notice mensagem="Só pedidos pendentes podem ser editados. Este já foi encerrado." tom="erro" /> : null}
      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}
      {faltaEstoque ? (
        <Button
          titulo="Ver variações para fabricar"
          variante="secundario"
          icone="flask-outline"
          aoPressionar={function () {
            router.push('/variacoes');
          }}
        />
      ) : null}

      <View style={estilos.secao}>
        <SectionTitle titulo="Cliente" />
        {criando ? (
          <>
            <Select
              rotulo="Cliente"
              opcoes={clientes.map(function (item) {
                return { valor: item.id, rotulo: item.nome };
              })}
              selecionados={clienteId === null ? [] : [clienteId]}
              aoMudar={function (valores) {
                setClienteId(valores.length > 0 ? Number(valores[0]) : null);
              }}
              placeholder="Sem cliente (opcional)"
              erro={erros.cliente}
            />
            <Button
              titulo="Cadastrar novo cliente"
              variante="texto"
              icone="person-add-outline"
              aoPressionar={function () {
                router.push('/clientes/formulario/novo?origem=pedido');
              }}
            />
          </>
        ) : (
          <TextField rotulo="Cliente" valor={nomeClienteAtual} aoMudar={function () {}} desabilitado />
        )}
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Itens" />
        {criando
          ? itens.map(function (item, indice) {
              const variacao = variacaoPorId(item.variacaoId);
              return (
                <View key={item.chave} style={[estilos.item, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
                  <Select
                    rotulo={`Sabonete ${indice + 1}`}
                    opcoes={variacoes.map(function (opcao) {
                      return { valor: opcao.id, rotulo: `${nomeVariacao(opcao)} · ${opcao.sku}` };
                    })}
                    selecionados={item.variacaoId === null ? [] : [item.variacaoId]}
                    aoMudar={function (valores) {
                      mudarItem(item.chave, { variacaoId: valores.length > 0 ? Number(valores[0]) : null });
                    }}
                    placeholder="Escolha o sabonete"
                  />
                  {variacao ? (
                    <Text style={[estilos.info, { color: cores.textoApoio }]}>
                      Em estoque: {variacao.quantidade_estoque} · {formatarDinheiro(precoAtual(variacao))} cada
                    </Text>
                  ) : null}
                  <TextField
                    rotulo="Quantidade"
                    valor={item.quantidade}
                    aoMudar={function (texto) {
                      mudarItem(item.chave, { quantidade: digitos(texto) });
                    }}
                    placeholder="1"
                    erro={errosItens[item.chave]}
                    teclado="number-pad"
                    desabilitado={salvando}
                  />
                  {itens.length > 1 ? (
                    <Button
                      titulo="Remover item"
                      variante="textoPerigo"
                      icone="trash-outline"
                      aoPressionar={function () {
                        removerItem(item.chave);
                      }}
                    />
                  ) : null}
                </View>
              );
            })
          : pedidoAtual?.itens.map(function (item) {
              const variacao = variacoesDoPedido[item.variacao];
              return (
                <ListItem
                  key={item.id}
                  titulo={variacao ? variacao.nome : `Variação ${item.variacao}`}
                  subtitulo={`${item.quantidade_item} × ${formatarDinheiro(item.valor_unitario)}`}
                />
              );
            })}
        {criando ? <Button titulo="Adicionar item" variante="secundario" icone="add" aoPressionar={adicionarItem} /> : null}
        <View style={[estilos.total, { borderColor: cores.borda }]}>
          <Text style={[estilos.rotuloTotal, { color: cores.textoApoio }]}>{criando ? 'Total estimado' : 'Total'}</Text>
          <Text style={[estilos.valorTotal, { color: cores.texto }]}>
            {formatarDinheiro(criando ? totalEstimado : pedidoAtual ? pedidoAtual.valor_total : 0)}
          </Text>
        </View>
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Endereço de entrega (opcional)" />
        <TextField
          rotulo="CEP"
          valor={endereco.cep}
          aoMudar={function (texto) {
            mudarEndereco('cep', mascararCep(texto));
          }}
          placeholder="00000-000"
          erro={erros.cep}
          teclado="number-pad"
          desabilitado={salvando || bloqueado}
        />
        <TextField
          rotulo="Rua"
          valor={endereco.logradouro}
          aoMudar={function (texto) {
            mudarEndereco('logradouro', texto);
          }}
          erro={erros.logradouro}
          desabilitado={salvando || bloqueado}
        />
        <View style={estilos.linha}>
          <View style={estilos.metade}>
            <TextField
              rotulo="Número"
              valor={endereco.numero_residencia}
              aoMudar={function (texto) {
                mudarEndereco('numero_residencia', texto);
              }}
              erro={erros.numero_residencia}
              desabilitado={salvando || bloqueado}
            />
          </View>
          <View style={estilos.metade}>
            <TextField
              rotulo="Complemento"
              valor={endereco.complemento}
              aoMudar={function (texto) {
                mudarEndereco('complemento', texto);
              }}
              erro={erros.complemento}
              desabilitado={salvando || bloqueado}
            />
          </View>
        </View>
        <TextField
          rotulo="Bairro"
          valor={endereco.bairro}
          aoMudar={function (texto) {
            mudarEndereco('bairro', texto);
          }}
          erro={erros.bairro}
          desabilitado={salvando || bloqueado}
        />
        <View style={estilos.linha}>
          <View style={estilos.maior}>
            <TextField
              rotulo="Cidade"
              valor={endereco.cidade}
              aoMudar={function (texto) {
                mudarEndereco('cidade', texto);
              }}
              erro={erros.cidade}
              desabilitado={salvando || bloqueado}
            />
          </View>
          <View style={estilos.menor}>
            <Select
              rotulo="UF"
              opcoes={ESTADOS.map(function (sigla) {
                return { valor: sigla, rotulo: sigla };
              })}
              selecionados={endereco.sigla_estado ? [endereco.sigla_estado] : []}
              aoMudar={function (valores) {
                mudarEndereco('sigla_estado', valores.length > 0 ? String(valores[0]) : '');
              }}
              placeholder="UF"
              erro={erros.sigla_estado}
            />
          </View>
        </View>
      </View>

      <View style={estilos.secao}>
        <TextField
          rotulo="Observação"
          valor={endereco.observacao}
          aoMudar={function (texto) {
            mudarEndereco('observacao', texto);
          }}
          placeholder="Algo importante sobre a entrega ou o pedido"
          erro={erros.observacao}
          multilinha
          desabilitado={salvando || bloqueado}
        />
      </View>

      <View style={estilos.acoes}>
        {!bloqueado ? <Button titulo={criando ? 'Registrar pedido' : 'Salvar'} aoPressionar={salvar} carregando={salvando} /> : null}
        <Button
          titulo={bloqueado ? 'Voltar' : 'Cancelar'}
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
  secao: {
    marginTop: 20,
    gap: 12,
  },
  item: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  info: {
    fontSize: 13,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  rotuloTotal: {
    fontSize: 14,
  },
  valorTotal: {
    fontSize: 20,
    fontWeight: '700',
  },
  linha: {
    flexDirection: 'row',
    gap: 10,
  },
  metade: {
    flex: 1,
  },
  maior: {
    flex: 2,
  },
  menor: {
    flex: 1,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});