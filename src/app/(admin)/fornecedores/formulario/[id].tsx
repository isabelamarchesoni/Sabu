// Formulário de fornecedor. /fornecedores/formulario/novo cadastra; /fornecedores/formulario/3 edita o fornecedor de id 3.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarFornecedor, criarFornecedor, atualizarFornecedor, type DadosFornecedor } from '../../../../services/compras';
import { TIPOS_MATERIA_PRIMA, type TipoMateriaPrima } from '../../../../services/estoque';
import { mensagemDeErro } from '../../../../services/api';
import { erroDoCampo } from '../../../../utils/erros';
import { digitos, mascararTelefone } from '../../../../utils/mascaras';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import TextField from '../../../../components/ui/TextField';
import Select from '../../../../components/ui/Select';
import Toggle from '../../../../components/ui/Toggle';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';

const CAMPOS = ['nome', 'categorias', 'prazo_medio_entrega_em_dias', 'plataforma', 'email', 'telefone', 'forma_pagamento', 'link'];
const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PADRAO_LINK = /^https?:\/\/\S+\.\S+/;

export default function FormularioFornecedor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const criando = id === 'novo';

  const [nome, setNome] = useState('');
  const [categorias, setCategorias] = useState<TipoMateriaPrima[]>([]);
  const [prazo, setPrazo] = useState('');
  const [plataforma, setPlataforma] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [link, setLink] = useState('');
  const [favorito, setFavorito] = useState(false);
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
      const dados = await buscarFornecedor(Number(id));
      setNome(dados.nome);
      setCategorias(dados.categorias);
      setPrazo(String(dados.prazo_medio_entrega_em_dias));
      setPlataforma(dados.plataforma);
      setTelefone(dados.telefone ? mascararTelefone(dados.telefone) : '');
      setEmail(dados.email);
      setFormaPagamento(dados.forma_pagamento);
      setLink(dados.link);
      setFavorito(dados.favorito);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar o fornecedor.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function validar() {
    const novosErros: Record<string, string> = {};
    if (!nome.trim()) {
      novosErros.nome = 'Informe o nome.';
    } else if (nome.trim().length > 100) {
      novosErros.nome = 'Use no máximo 100 caracteres.';
    }
    if (categorias.length === 0) {
      novosErros.categorias = 'Escolha pelo menos uma categoria.';
    }
    if (!prazo || Number(prazo) < 1) {
      novosErros.prazo_medio_entrega_em_dias = 'Informe o prazo em dias (mínimo 1).';
    }
    if (plataforma.trim().length > 50) {
      novosErros.plataforma = 'Use no máximo 50 caracteres.';
    }
    if (telefone && digitos(telefone).length < 10) {
      novosErros.telefone = 'Informe o telefone com DDD.';
    }
    if (email.trim() && !PADRAO_EMAIL.test(email.trim())) {
      novosErros.email = 'Informe um e-mail válido.';
    }
    if (formaPagamento.trim().length > 50) {
      novosErros.forma_pagamento = 'Use no máximo 50 caracteres.';
    }
    if (link.trim() && !PADRAO_LINK.test(link.trim())) {
      novosErros.link = 'Informe o link completo, começando com https://';
    }
    return novosErros;
  }

  function montarDados(): DadosFornecedor {
    const dados: DadosFornecedor = {
      nome: nome.trim(),
      categorias: categorias,
      prazo_medio_entrega_em_dias: Number(prazo),
      favorito: favorito,
    };
    const opcionais = {
      plataforma: plataforma.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      forma_pagamento: formaPagamento.trim(),
      link: link.trim(),
    };
    if (criando) {
      if (opcionais.plataforma) {
        dados.plataforma = opcionais.plataforma;
      }
      if (opcionais.telefone) {
        dados.telefone = opcionais.telefone;
      }
      if (opcionais.email) {
        dados.email = opcionais.email;
      }
      if (opcionais.forma_pagamento) {
        dados.forma_pagamento = opcionais.forma_pagamento;
      }
      if (opcionais.link) {
        dados.link = opcionais.link;
      }
      return dados;
    }
    return { ...dados, ...opcionais };
  }

  async function salvar() {
    setErroGeral('');
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setSalvando(true);
    try {
      const salvo = criando ? await criarFornecedor(montarDados()) : await atualizarFornecedor(Number(id), montarDados());
      if (!criando && salvo.favorito !== favorito) {
        setErroGeral('O fornecedor foi salvo, mas o servidor não gravou o favorito. Avise o back-end: o campo "favorito" está sendo ignorado.');
        return;
      }
      if (criando) {
        router.replace(`/fornecedores/${salvo.id}`);
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
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar o fornecedor.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  const titulo = criando ? 'Novo fornecedor' : 'Editar fornecedor';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando fornecedor…' : erroGeral}
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
          rotulo="Nome"
          valor={nome}
          aoMudar={setNome}
          placeholder="Ex.: Casa dos Óleos"
          erro={erros.nome}
          desabilitado={salvando}
        />
        <Select
          rotulo="Categorias"
          opcoes={TIPOS_MATERIA_PRIMA}
          selecionados={categorias}
          aoMudar={function (valores) {
            setCategorias(valores as TipoMateriaPrima[]);
          }}
          multiplo
          placeholder="O que este fornecedor vende"
          erro={erros.categorias}
        />
        <TextField
          rotulo="Prazo médio de entrega"
          valor={prazo}
          aoMudar={function (texto) {
            setPrazo(digitos(texto).slice(0, 3));
          }}
          placeholder="Ex.: 7"
          erro={erros.prazo_medio_entrega_em_dias}
          sufixo="dias"
          teclado="number-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Plataforma (opcional)"
          valor={plataforma}
          aoMudar={setPlataforma}
          placeholder="Ex.: Mercado Livre, loja física"
          erro={erros.plataforma}
          desabilitado={salvando}
        />
        <TextField
          rotulo="Telefone (opcional)"
          valor={telefone}
          aoMudar={function (texto) {
            setTelefone(mascararTelefone(texto));
          }}
          placeholder="(11) 91234-5678"
          erro={erros.telefone}
          teclado="phone-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="E-mail (opcional)"
          valor={email}
          aoMudar={setEmail}
          placeholder="contato@fornecedor.com"
          erro={erros.email}
          teclado="email-address"
          maiusculas="none"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Forma de pagamento (opcional)"
          valor={formaPagamento}
          aoMudar={setFormaPagamento}
          placeholder="Ex.: Pix, boleto 30 dias"
          erro={erros.forma_pagamento}
          desabilitado={salvando}
        />
        <TextField
          rotulo="Site ou link (opcional)"
          valor={link}
          aoMudar={setLink}
          placeholder="https://"
          erro={erros.link}
          teclado="url"
          maiusculas="none"
          desabilitado={salvando}
        />
        <Toggle
          rotulo="Fornecedor favorito"
          descricao="Aparece primeiro com uma estrela na hora de registrar compras."
          valor={favorito}
          aoMudar={setFavorito}
        />
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
