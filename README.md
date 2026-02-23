# Digital Library API

Sistema de Gerenciamento de uma Biblioteca Digital Moderna. 
Uma API RESTful elegante e perfomática desenvolvida em FastAPI e stack Python assíncrona.

## Visão Geral das Funcionalidades
A aplicação possui 3 entidades principais (`Usuário`, `Livro`, `Empréstimo`) gerenciadas através de operações CRUD com regras de negócios complexas.

### Regras de Negócio e Diferenciais:
- **Limite de Empréstimos**: Máximo de 3 ativos por usuário.
- **Duração**: Prazo de 14 dias para devolução.
- **Multa**: R$ 2,00 por dia de atraso calculado automaticamente.
- **Cache (Redis)**: Endpoints de listagem de livros armazenados em cache para performance.
- **Rate Limit**: Prevenção contra abusos via SlowAPI (ex. `10 requisições/minuto` para a listagem principal).
- **Log Estruturado**: Interceptor customizado para monitoramento das chamadas da API.
- **Documentação Nativa**: Swagger OpenAPI acessível diretamente no Browser.
- **Testes Automatizados**: Suíte de testes integrados e validadores Pydantic rigorosos.

## Tecnologias e Arquitetura Recomendada
- **FastAPI**: Backend REST Framework (`python-multipart`, `pydantic`).
- **PostgreSQL**: Persistência de dados através do docker.
- **SQLAlchemy (ORM) + Alembic**: Abstração do BD e Migrações (Versionamento de Esquema).
- **Redis**: Chave/Valor para Cacheamento na camada de API.
- **Bcrypt**: Hashing de senhas seguro.
- **Docker Compose**: Orquestração multi-contêiner.
- **Pytest**: Validação e Suíte de Testes.

## Instruções de Instalação e Execução

### Pré-requisitos
- Ter o **Docker** e o **Docker Compose** instalados na sua máquina.
- Conexão e porta liberada `8000` (API), `5432` (Postgres) e `6379` (Redis).

### Passos:
1. Faça o clone do projeto (ou copie a estrutura para seu path de execução).
2. **Configure as Variáveis de Ambiente (`.env`)**
   O projeto utiliza um arquivo `.env` para separar as configurações de **Desenvolvimento** e **Produção**.
   Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
   *(Edite o arquivo `.env` com senhas fortes para produção. Em dev, os valores padrão conectam diretamente com o Docker).*

3. Na raiz onde localiza-se o arquivo `docker-compose.yml`, rode o seguinte comando:
   ```bash
   docker-compose up -d --build
   ```
   *Isso irá ler o arquivo `.env`, construir a imagem Python, baixar e ligar o PostgreSQL e o Redis.*

3. **Iniciando e Rodando as Migrations**:
   Para criar as tabelas do Banco de Dados automaticamente, rode o Alembic dentro do container web:
   ```bash
   docker-compose run --rm web alembic upgrade head
   ```

4. **Acesse a Documentação (Swagger)**:
   Abra no seu navegador: `http://localhost:8000/docs`

## Rodando Testes (QA - Validação Interna)
Você pode executar todos os testes da aplicação rodando:
```bash
docker-compose run --rm web pytest tests/ -v
```

## Exemplos de Uso da API

Todos os Modelos (`Schemas`) podem ser validados interativamente na interface web `/docs`, entretanto, você pode utilizar `curl` ou um client HTTP (Ex. Insomnia/Postman) para invocar as rotas sob o prefixo: `http://localhost:8000/api/v1/`

| Funcionalidade | Endpoint | Método | Descrição |
| --- | --- | --- | --- |
| Criar Usuário | `/users/` | POST | Exige `name`, `email` e `password` |
| Criar Livro | `/books/` | POST | Exige `title`, `author_id` (Criação vinculada prévia da rota Author) |
| Listar Livros | `/books/?skip=0&limit=10` | GET | Listagem Paginada e Cacheada! |
| Realizar Empréstimo | `/loans/` | POST | Payload: `{"user_id": 1, "book_id": 1}`. Valida se livro está disponível e usuário não atingiu cota de 3 empréstimos |
| Devolver Livro | `/loans/{loan_id}/return` | POST | Valida multa e libera o livro novamente no acervo |

### Coleção do Postman
Na raiz do projeto existe o arquivo **`Digital_Library_API.postman_collection.json`**.
Você pode importar este arquivo em seu [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/) para testar rapidamente todas as rotas listadas acima. A coleção já inclui a variável de ambiente nativa `{{base_url}}` apontando para `http://localhost:8000`.
