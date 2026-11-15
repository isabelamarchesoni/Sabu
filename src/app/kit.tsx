import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Screen from '../components/ui/Screen';
import Header from '../components/ui/Header';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import SearchField from '../components/ui/SearchField';
import Chip from '../components/ui/Chip';
import Select from '../components/ui/Select';
import Toggle from '../components/ui/Toggle';
import Badge from '../components/ui/Badge';
import ListItem from '../components/ui/ListItem';
import SectionTitle from '../components/ui/SectionTitle';
import ScreenState from '../components/ui/ScreenState';
import ConfirmModal from '../components/ui/ConfirmModal';
import Notice from '../components/ui/Notice';
import ThemeToggle from '../components/ui/ThemeToggle';

const CATEGORIAS = [
  { valor: 1, rotulo: 'Hidratante' },
  { valor: 2, rotulo: 'Esfoliante' },
  { valor: 3, rotulo: 'Relaxante' },
  { valor: 4, rotulo: 'Infantil' },
];

export default function KitDeComponentes() {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [busca, setBusca] = useState('');
  const [chipSelecionado, setChipSelecionado] = useState(1);
  const [categorias, setCategorias] = useState<(number | string)[]>([]);
  const [ativo, setAtivo] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  function nada() {
    return;
  }

  return (
    <Screen rolavel>
      <Header titulo="Kit de componentes" subtitulo="Tela de teste para aprovação" voltar acoes={<ThemeToggle />} />

      <SectionTitle titulo="Botões" />
      <View style={styles.grupo}>
        <Button titulo="Primário" aoPressionar={nada} />
        <Button titulo="Com ícone" icone="add" aoPressionar={nada} />
        <Button titulo="Secundário" variante="secundario" aoPressionar={nada} />
        <Button titulo="Texto" variante="texto" aoPressionar={nada} />
        <Button titulo="Perigo" variante="perigo" aoPressionar={nada} />
        <Button titulo="Texto de perigo" variante="textoPerigo" aoPressionar={nada} />
        <Button titulo="Carregando" carregando aoPressionar={nada} />
      </View>

      <SectionTitle titulo="Campos" />
      <TextField rotulo="Nome" valor={nome} aoMudar={setNome} placeholder="Ex.: Sabonete de Lavanda" ajuda="Até 100 caracteres." />
      <TextField rotulo="Senha" valor={senha} aoMudar={setSenha} placeholder="Sua senha" senha />
      <TextField rotulo="Peso" valor="" aoMudar={nada} placeholder="90" teclado="numeric" sufixo="g" erro="Informe um número maior que zero." />
      <TextField rotulo="Descrição" valor="" aoMudar={nada} placeholder="Ingredientes e benefícios" multilinha />
      <SearchField
        valor={busca}
        aoMudar={setBusca}
        aoBuscar={nada}
        aoLimpar={function () {
          setBusca('');
        }}
        placeholder="Buscar sabonete"
      />
      <Select rotulo="Categorias" opcoes={CATEGORIAS} selecionados={categorias} aoMudar={setCategorias} multiplo placeholder="Escolha uma ou mais" />
      <Toggle rotulo="Produto ativo" descricao="Aparece na vitrine pública" valor={ativo} aoMudar={setAtivo} />

      <SectionTitle titulo="Filtros" />
      <View style={styles.linha}>
        {CATEGORIAS.map(function (categoria) {
          return (
            <Chip
              key={categoria.valor}
              rotulo={categoria.rotulo}
              selecionado={chipSelecionado === categoria.valor}
              aoPressionar={function () {
                setChipSelecionado(categoria.valor);
              }}
            />
          );
        })}
      </View>

      <SectionTitle titulo="Selos" />
      <View style={styles.linha}>
        <Badge texto="Neutro" />
        <Badge texto="Ativo" tom="sucesso" />
        <Badge texto="Pendente" tom="alerta" />
        <Badge texto="Esgotado" tom="erro" />
        <Badge texto="Promoção" tom="destaque" />
      </View>

      <SectionTitle titulo="Itens de lista" textoAcao="Ver tudo" aoPressionarAcao={nada} />
      <ListItem titulo="Sabonete de Lavanda" subtitulo="Relaxante · 2 variações" detalhe="R$ 18,00" selo={{ texto: 'Ativo', tom: 'sucesso' }} aoPressionar={nada} />
      <ListItem titulo="Pedido #128" subtitulo="Maria Souza · 14/11/2026" detalhe="R$ 54,90" selo={{ texto: 'Pendente', tom: 'alerta' }} aoPressionar={nada} />
      <ListItem titulo="Óleo de coco" subtitulo="Óleos e gorduras · KG" detalhe="3,500 kg" />

      <SectionTitle titulo="Avisos" />
      <Notice mensagem="Não foi possível salvar. Verifique os campos destacados." />
      <Notice mensagem="Categoria criada com sucesso." tom="sucesso" />

      <SectionTitle titulo="Estado vazio" />
      <View style={styles.caixaEstado}>
        <ScreenState tipo="vazio" mensagem="Nenhum pedido ainda." />
      </View>

      <Button
        titulo="Abrir confirmação"
        variante="secundario"
        aoPressionar={function () {
          setModalAberto(true);
        }}
      />

      <ConfirmModal
        visivel={modalAberto}
        titulo="Excluir categoria?"
        mensagem="Se ela estiver ligada a algum produto, o sistema não vai permitir a exclusão."
        textoConfirmar="Excluir"
        perigo
        aoConfirmar={function () {
          setModalAberto(false);
        }}
        aoCancelar={function () {
          setModalAberto(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grupo: {
    gap: 8,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  caixaEstado: {
    height: 220,
  },
});