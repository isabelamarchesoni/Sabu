# 🧼 Sabú — Feito pra cuidar de tu

Aplicativo mobile de gestão e personalização para a **Sabú**, pequena empresa de sabonetes artesanais, com **Inteligência Artificial** integrada para precificação, recomendação de produtos e previsão de estoque.

---

## 📑 Sumário

- [Sobre a empresa](#-sobre-a-empresa)
- [Pesquisa de campo](#-pesquisa-de-campo)
- [Problema, solução e diferencial](#-problema-solução-e-diferencial)
- [Funcionalidades](#-funcionalidades)
- [Requisitos](#-requisitos)
- [Inteligência Artificial](#-inteligência-artificial)
- [Arquitetura e tecnologias](#️-arquitetura-e-tecnologias)
- [Publicação em nuvem](#️-publicação-em-nuvem)
- [Como executar](#-como-executar)
- [Problemas comuns](#-problemas-comuns)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Padrão de commit](#-padrão-de-commit)
- [Roadmap](#️-roadmap)
- [Equipe](#-equipe)

---

## 🏢 Sobre a empresa

| | |
|---|---|
| **Empresa** | Sabú (@sabu.artesanal) |
| **Ramo** | Produtos artesanais |
| **Porte** | Pequeno |
| **Início** | 2026 |
| **Especialidade** | Produção de sabonetes artesanais |
| **Dor principal** | Organização e controle de produção |

---

## 🔎 Pesquisa de campo

O primeiro contato foi feito pelo Instagram com a proprietária da empresa, que demonstrou interesse em um aplicativo totalmente personalizado. Principais pontos levantados:

- O processo do negócio vai da **idealização do sabonete**, passando pela definição de matérias-primas, produção e embalagem, até a **venda**.
- O **registro** entre essas etapas é a atividade mais crítica e a que mais gera problemas.
- Inventário, cadastro de clientes e classificação de produtos (**curva ABC**) ficam **espalhados em diferentes lugares**, o que atrasa a definição de preços e a criação de estratégias de marketing, além de obrigar a alternar entre aplicativos.
- A empresa perde, em média, **2 dias por semana** com registros, cadastros, consultas e revisão de informes.
- O app deve atender **tanto os clientes quanto a organização interna** do negócio.

---

## 🎯 Problema, solução e diferencial

| Problema | Solução | Diferencial |
|---|---|---|
| Controle manual e informações dispersas, gerando desorganização e perda de tempo | App mobile para cadastrar e controlar estoque e pedidos em um só lugar | IA personalizada para a cliente e seus produtos |

---

## ✨ Funcionalidades

- **Vitrine pública** com filtros por categoria e tipo de pele, página do produto e contato pelo **WhatsApp**
- **Área do administrador** protegida por login
- Cadastro de **produtos, variações e insumos**
- **Controle de estoque**, lotes e movimentações
- **Histórico de vendas e pedidos**
- **Modo claro e escuro**
- **Quiz dermatológico** com recomendação de sabonete
- **Precificação inteligente** com preço mínimo e preço sugerido
- **Previsão de estoque** (quanto produzir)

---

## 📋 Requisitos

### Funcionais

- Cadastro de produtos e insumos
- Controle de estoque e movimentações
- Quiz dermatológico e recomendação
- Histórico de vendas e pedidos

### Não funcionais

- Aplicativo mobile intuitivo
- Sincronização em nuvem
- Baixo custo operacional
- Resposta rápida da recomendação

---

## 🤖 Inteligência Artificial

### 1. Precificação por Machine Learning

A fórmula de custo informa apenas o valor mínimo para não ter prejuízo, mas não diz se esse valor é competitivo. Um **modelo de regressão** aprende quanto o mercado paga por cada característica do sabonete, e a proprietária visualiza o **preço mínimo** e o **preço sugerido** lado a lado.

| Fase | Descrição |
|---|---|
| **MVP** | Regressão linear (scikit-learn), simples, explicável e avaliada por erro médio (MAE). Dados: 150 a 300 anúncios reais (Elo7, Mercado Livre, Shopee). Variáveis: preço/100g, peso, tipo, vegano, ingrediente, embalagem |
| **Versão 2** | Compara Random Forest e Gradient Boosting com a regressão linear. Mostra faixa de preço (mínimo, sugerido, máximo). Alerta quando o custo ultrapassa o preço praticado no mercado |
| **Versão final** | Recoleta periódica de anúncios e retreino do modelo. Versionamento de modelos, com opção de reverter. Ajuste fino com o histórico real de vendas da cliente |

### 2. Quiz e Recomendação

Um **modelo pré-treinado de embeddings** compara as respostas do quiz dermatológico com a descrição de cada sabonete e sugere o mais compatível.

### 3. Previsão de Estoque

**Suavização exponencial** projeta a demanda futura de cada produto a partir do histórico de vendas, sugerindo quanto produzir.

---

## 🛠️ Arquitetura e tecnologias

| Camada | Tecnologia |
|---|---|
| Aplicativo mobile | React Native com **Expo SDK 58** (React Native 0.88, React 19), **Expo Router**, TypeScript |
| Backend (API) | **Django 6 + Django REST Framework**, autenticação **JWT** (SimpleJWT), documentação **Swagger** (drf-spectacular) — repositório separado |
| Banco de dados | **PostgreSQL** |
| Machine Learning | Python, scikit-learn |
| Recomendação | Modelo pré-treinado de embeddings |
| Build | Expo / EAS Build |
| Hospedagem | Azure |
| Versionamento | GitHub |

---

## ☁️ Publicação em nuvem

- **Código:** repositórios no GitHub (front-end neste repositório; back-end em repositório próprio)
- **Build:** Expo / EAS Build
- **API e banco:** Django REST + PostgreSQL
- **Hospedagem:** Azure
- **Ideia inicial:** pipeline simples de deploy contínuo, com custo baixo no início do projeto

---

## 🚀 Como executar

### Pré-requisitos

| Ferramenta | Versão | Como conferir |
|---|---|---|
| [Node.js](https://nodejs.org/) | **22.13 ou mais novo** (exigência do Expo SDK 58) | `node -v` |
| npm | vem junto com o Node | `npm -v` |
| Git | qualquer recente | `git --version` |
| [VS Code](https://code.visualstudio.com/) | recomendado | — |
| **Expo Go** no celular | versão da loja com suporte ao **SDK 58** | ver no app |
| Python | 3.12+ (para o back-end e os modelos de ML) | `python --version` |

> O front-end **não usa `requirements.txt`**: todas as bibliotecas estão no `package.json` (versões exatas no `package-lock.json`). O `npm install` instala tudo sozinho — **não instale bibliotecas à mão**.

### Extensões do VS Code

Ao abrir a pasta do projeto, o VS Code avisa que há **extensões recomendadas** (lista em `.vscode/extensions.json`). Clique em **Instalar todas**:

- **Expo Tools** — autocompletar e validação do `app.json`
- **ESLint** — aponta erros enquanto você digita
- **React Native Tools** — comandos e depuração
- **Path Intellisense** — completa os caminhos dos imports

### Aplicativo (front-end)

```bash
git clone https://github.com/isabelamarchesoni/Sabu.git
```
```bash
cd Sabu
```
```bash
npm install
```

Crie o arquivo **`.env`** na raiz do projeto a partir do modelo **`.env.example`**:

```
EXPO_PUBLIC_API_URL=http://IP_DO_PC:8000/api/v1
EXPO_PUBLIC_WHATSAPP=55DDNUMERO
```

- `IP_DO_PC`: no Windows, rode `ipconfig` e use o **Endereço IPv4** da rede Wi-Fi.
- `EXPO_PUBLIC_WHATSAPP`: só números (55 + DDD + número). Vazio = o botão do WhatsApp não aparece.
- O `.env` **não vai para o GitHub**.

Inicie o app:

```bash
npx expo start -c
```

Leia o QR code com a câmera do iPhone (ou pelo Expo Go no Android). **PC e celular precisam estar na mesma rede Wi-Fi.**

| Comando | Para quê |
|---|---|
| `npx tsc --noEmit` | confere os tipos do TypeScript |
| `npx expo-doctor` | confere se as versões das bibliotecas combinam com o SDK |
| `npx expo install --fix` | corrige versões de bibliotecas desalinhadas |

### Back-end (repositório separado)

Dentro da pasta do back-end, com o ambiente virtual criado e as dependências instaladas (`pip install -r requirements.txt`):

```powershell
.venv\Scripts\Activate.ps1
```
```powershell
python manage.py runserver 0.0.0.0:8000
```

- O `.env` do back-end precisa ter o IP do PC em `ALLOWED_HOSTS` (ex.: `ALLOWED_HOSTS=localhost,127.0.0.1,IP_DO_PC`).
- Documentação da API (Swagger): `http://localhost:8000/api/docs/`.
- O back-end ainda não tem CORS: teste o app **no celular**, não no navegador.

### Modelos de ML

> Em desenvolvimento pela equipe de IA. Os comandos serão documentados quando a pasta dos modelos entrar no repositório.

### Build

```bash
npx eas build --platform android
```

---

## 🧯 Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `No module named 'django'` | ambiente virtual do back-end desligado | rodar `.venv\Scripts\Activate.ps1` antes |
| "Execução de scripts desabilitada" no PowerShell | política do Windows | `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` e repetir |
| `DisallowedHost` | IP do PC fora do `ALLOWED_HOSTS` | adicionar o IP no `.env` do back-end e reiniciar |
| App mostra "sem conexão" | IP errado no `.env`, back-end desligado ou redes Wi-Fi diferentes | conferir os três e reiniciar com `npx expo start -c` |
| Mudei o `.env` e nada mudou | o Expo só lê o `.env` ao iniciar | parar (Ctrl + C) e rodar `npx expo start -c` |
| "Unmatched route" numa tela nova | o app não pegou a pasta nova | `npx expo start -c`, fechar o Expo Go e ler o QR de novo |
| "Project is incompatible with this version of Expo Go" | Expo Go desatualizado | atualizar o Expo Go pela loja |
| Erro no `npm install` | Node antigo | instalar o Node 22.13+ e rodar `npm install` de novo |

---

## 📁 Estrutura do projeto

```
Sabu/
├── .vscode/
│   └── extensions.json       extensões recomendadas do VS Code
├── .env.example              modelo das variáveis de ambiente
├── .nvmrc                    versão do Node (22)
├── app.json
├── package.json
├── assets/                   ícone, splash e imagens
├── src/
│   ├── app/                  rotas — cada arquivo é uma tela (Expo Router)
│   │   ├── _layout.tsx       tema + navegação geral
│   │   ├── index.tsx         splash
│   │   ├── login.tsx
│   │   ├── vitrine/          área pública (lista e página do produto)
│   │   └── (admin)/          área do administrador (protegida pelo login)
│   │       ├── (abas)/       início, catálogo, estoque, compras e vendas
│   │       ├── categorias/, tipos-pele/, produtos/, variacoes/
│   │       ├── materias-primas/, fichas-tecnicas/, lotes-materia-prima/, lotes-sabonetes/
│   │       ├── movimentacoes-materia-prima/, movimentacoes-sabonetes/
│   │       ├── fornecedores/, historico-compras/, vinculos/
│   │       ├── clientes/, pedidos/
│   │       └── conta/, administradores/
│   ├── components/ui/        kit de componentes (Button, TextField, PaginatedList…)
│   ├── services/             conversa com a API (api, sessao, catalogo, estoque, compras, vendas…)
│   ├── theme/                cores e modo claro/escuro
│   └── utils/                máscaras, datas e erros
└── README.md
```

---

## 🗺️ Roadmap

- [x] Pesquisa de campo com a cliente
- [x] Definição de requisitos
- [x] Design UI mobile
- [x] Backend e API
- [x] Vitrine pública e página do produto
- [x] Login e área do administrador
- [x] Cadastro de produtos, insumos e estoque
- [x] Histórico de vendas e pedidos
- [ ] MVP de precificação (regressão linear)
- [ ] Quiz dermatológico e recomendação
- [ ] Previsão de estoque
- [ ] Versão 2 da precificação (Random Forest e Gradient Boosting)
- [ ] Deploy em nuvem

---

## 👥 Equipe

| Integrante | Área |
|---|---|
| **Isabela Vitória** | Frontend |
| **Amanda Lima** | IA/Machine Learning |
| **Thiago Monteiro** | Backend |
| **Frank Oliveira** | IA/Machine Learning |
| **Guilherme Cauã** | Backend (QA) |

---

<p align="center">Feito pra cuidar de tu 💙</p>