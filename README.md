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
- [Arquitetura e tecnologias](#-arquitetura-e-tecnologias)
- [Publicação em nuvem](#-publicação-em-nuvem)
- [Como executar](#-como-executar)
- [Estrutura do projeto](#-estrutura-do-projeto)
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

- 📦 Cadastro de **produtos e insumos**
- 🔄 **Controle de estoque** e movimentações
- 🧾 **Histórico de vendas e pedidos**
- 🧴 **Quiz dermatológico** com recomendação de sabonete
- 💰 **Precificação inteligente** com preço mínimo e preço sugerido
- 📈 **Previsão de estoque** (quanto produzir)

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
| Aplicativo mobile | Expo / EAS Build |
| Backend e banco de dados | Supabase (PostgreSQL, Edge Functions, Auth, Storage) |
| Machine Learning | Python, scikit-learn |
| Recomendação | Modelo pré-treinado de embeddings |
| Hospedagem | Azure |
| Versionamento | GitHub |

---

## ☁️ Publicação em nuvem

- **Código:** repositório no GitHub
- **Build:** Expo / EAS Build
- **Supabase:** banco de dados (PostgreSQL), Edge Functions, autenticação e storage
- **Hospedagem:** Azure
- **Ideia inicial:** pipeline simples de deploy contínuo, com custo baixo no início do projeto

---

## 🚀 Como executar

> ⚠️ Ajuste os comandos conforme a estrutura final do repositório.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS)
- [Expo CLI](https://docs.expo.dev/) e aplicativo **Expo Go** no celular
- Conta no [Supabase](https://supabase.com/)
- Python 3.10+ (para os modelos de ML)

### Aplicativo

```bash
# Clonar o repositório
git clone https://github.com/isabelamarchesoni/Sabu.git
cd sabu

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencha SUPABASE_URL e SUPABASE_ANON_KEY

# Iniciar o app
npx expo start
```

### Modelos de ML

```bash
cd ml
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python train.py
```

### Build

```bash
npx eas build --platform android
```

---

## 📁 Estrutura do projeto

> Estrutura sugerida. Atualize conforme o projeto evoluir.

```
sabu/
├── app/            # Telas e navegação (Expo)
├── components/     # Componentes reutilizáveis
├── services/       # Integração com Supabase e APIs
├── ml/             # Modelos de precificação, recomendação e previsão
├── supabase/       # Edge Functions e migrações
├── docs/           # Apresentação e comprovantes da pesquisa de campo
└── README.md
```

---

## 🗺️ Roadmap

- [x] Pesquisa de campo com a cliente
- [x] Definição de requisitos
- [x] Design UI mobile
- [x] Backend e API
- [ ] Cadastro de produtos, insumos e estoque
- [ ] Histórico de vendas e pedidos
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

---

<p align="center">Feito pra cuidar de tu 💙</p>
