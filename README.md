# projetoMVC
Projeto web simples utilizando a estrutura MVC, feito para a disciplina Programação Multiplataforma.
## Sumário
## Tecnologias
<img src="https://skillicons.dev/icons?i=javascript,html,css,mysql&perline=8" />
<h2>Frameworks/bibliotecas</h2> 
<ul>
  <li><a href="https://www.npmjs.com/package/express">Express</a></li>
  <li><a href="https://www.npmjs.com/package/bcryptjs">bcryptjs</a></li>
  <li><a href="https://www.npmjs.com/package/cookie-parser">cookie-parser</a></li>
  <li><a href="https://www.npmjs.com/package/ejs">EJS</a></li>
  <li><a href="https://www.npmjs.com/package/express-session">Express-session</a></li>
  <li><a href="https://www.npmjs.com/package/sequelize">Sequelize</a></li>
  <li><a href="https://www.npmjs.com/package/uuid">uuid</a></li>
  <li><a href="https://www.npmjs.com/package/mysql2">mysql2</a></li>
</ul>
<h2>Instalação</h2>
🚀

### Instruções para baixar e configurar o projeto MVC

#### 1. Baixe ou clone o repositório

Você pode baixar o arquivo zip do repositório ou cloná-lo usando GitHub CLI, HTTPS ou SSH.

**Baixe o arquivo zip:**

[Download do zip](https://github.com/Gustavo2022003/projetoMVC/archive/refs/heads/branch1.zip)

**GitHub CLI:**

```sh
gh repo clone Gustavo2022003/projetoMVC
```

**HTTPS:**

```sh
git clone https://github.com/Gustavo2022003/projetoMVC.git
```

**SSH:**

```sh
git clone git@github.com:Gustavo2022003/projetoMVC.git
```

#### 2. Certifique-se de ter o NodeJS instalado no seu sistema

1. Abra o terminal/prompt de comando e digite:

```sh
node --version
```

Se uma versão do NodeJS for exibida, significa que o NodeJS já está instalado no seu sistema. Caso contrário, você precisará instalá-lo.

Você pode baixar o instalador do NodeJS no link a seguir:

[NodeJS](https://www.nodejs.com)

## Instalação das dependências

Após garantir que o NodeJS está instalado, navegue até o diretório do projeto clonado e execute o comando abaixo para instalar as dependências:

```sh
npm install
```

### Configurando o Servidor com MySQL

Para configurar o servidor, siga os passos abaixo:

#### 1. Certifique-se de que o MySQL está instalado

Verifique se o MySQL está instalado em sua máquina. Abra o terminal/prompt de comando e digite:

```sh
mysql --version
```

Se a versão do MySQL for exibida, significa que o MySQL está instalado. Caso contrário, você precisará instalá-lo.

Você pode baixar o instalador do MySQL no link a seguir:

[MySQL](https://dev.mysql.com/downloads/)

### 2. Configurando o Banco de Dados

1. Abra o MySQL Workbench ou seu cliente de banco de dados favorito.
2. Crie um novo banco de dados com algum nome de sua preferêcia, neste caso irei usar `projetoMVC`:

```sql
CREATE DATABASE projetoMVC;
```

3. (Opcional) Crie um novo usuário (novo_usuario) e conceda permissões:

```sql
CREATE USER 'novo_usuario'@'localhost' IDENTIFIED BY 'senha';
GRANT ALL PRIVILEGES ON projeto1.* TO 'novo_usuario'@'localhost';
FLUSH PRIVILEGES;
```

*Substitua "novo_usuario" pelo nome de usuário desejado e "senha" pela senha que você preferir*

#### 3. Configurando as Variáveis de Ambiente

No diretório do projeto, crie um arquivo `.env` e adicione as seguintes linhas com suas configurações do banco de dados:

```
DATABASE=projetoMVC
DB_USERNAME=novo_usuario
DB_PASSWORD=senha
SESSION_SECRET=projetoMVC
```

**Nota:** Se você criou um novo usuário, substitua `novo_usuario` e `senyha` pelos dados do novo usuário.

*SESSION_SECRET é o segredo usado para assinar o cookie de ID de sessão. O segredo pode ser qualquer tipo de valor suportado pelo Node.js crypto.createHmac (como uma string ou um Buffer). Pode ser um único segredo ou uma série de vários segredos. Se for fornecido um array de segredos, apenas o primeiro elemento será utilizado para assinar o cookie de ID de sessão, enquanto todos os elementos serão considerados na verificação da assinatura nas solicitações. O segredo em si não deve ser facilmente analisado por um humano e seria melhor ser um conjunto aleatório de caracteres*

#### 4. Inicializando o Projeto

1. Certifique-se de estar no diretório do projeto.

2. Inicie o servidor:

```sh
npm start
```

#### 5. Acessar a Aplicação

Abra seu navegador e acesse:

```
http://localhost:8000
```

Agora você deve ser capaz de ver a aplicação rodando localmente, com a conexão ao banco de dados MySQL configurada corretamente.

# Telas

## Tela principal

<img src="/public/images/mainscreen.png">

## Tela de Login

<img src="/public/images/login.png">

## Tela de cadastro

<img src="/public/images/cadastro.png">

## Confirmação de exclusão

<img src="/public/images/excluir.png">

## Tela de extratos

<img src="/public/images/extrato.png">

## Tela de transferência

<img src="/public/images/transferir.png">

## Tela de edição de informações do usuário

<img src="/public/images/Editar.png">

## Tela de criação de cofrinho

<img src="/public/images/cofrinho.png">

## Deposito cofrinho

<img src="/public/images/depositoCofrinho.png">

## Sacar do cofrinho

<img src="/public/images/sacarCofrinho.png">

## Editar cofrinho

<img src="/public/images/editarCofrinho.png">

## Tela de depósito bancário

<img src="/public/images/deposito.png">

## Tela de transferência bancária

<img src="/public/images/transferir.png">
