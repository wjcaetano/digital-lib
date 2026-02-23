# Guia de Defesa Técnica: BTG Pactual - Digital Library API

Parabéns por chegar a esta etapa! O projeto entregue é extremamente robusto, limpo e superou as expectativas do desafio básico, adentrando em requisitos Intermediários e Avançados. 

Como seu avaliador, vou pontuar os **destaques técnicos** que você precisa dominar para brilhar na entrevista. Leia com atenção, estude os conceitos e use este guia como base para sua defesa.

---

## 1. Arquitetura e Padrões de Projeto (O Coração da Defesa)

**O que eles vão perguntar:** *"Por que você escolheu essa estrutura de pastas? Por que não colocou toda a lógica direto nas rotas do FastAPI?"*

**Sua Resposta (O que implementamos):**
*   **Clean Architecture (Arquitetura Limpa):** Diferente de um projeto monolítico engessado, nós separamos fortemente as responsabilidades. 
    *   **Domain (`entities/` e `dtos/`):** Nossas Entidades (`models` do SQLAlchemy) representam o banco de dados. Nossos DTOs (`schemas` do Pydantic) garantem que a nossa API só receba e devolva estritamente o que definimos, validando os dados *antes* de baterem em qualquer lógica.
    *   **Repositories:** Extraímos todo o acoplamento do banco de dados (SQLAlchemy) para a camada de `Repository`. Criamos um genérico `BaseRepository` usando *Generics (`TypeVar`)* do Python.
        *   *Vantagem:* Se o BTG amanhã decidir trocar o PostgreSQL por um MongoDB, nós só precisamos reescrever as classes do Repository. A regra de negócio permanece intacta.
    *   **Services:** É aqui que moram as **regras de negócio exigidas no desafio** (ex: calcular os R$ 2,00 de multa, checar se a cota de 3 empréstimos foi atingida).
        *   *Vantagem:* A lógica fica independente do framework (FastAPI). Podemos testar as regras isoladamente (Unit Tests) mockando os repositórios.
    *   **Controllers (API/Rotas):** Nossas rotas são "burras". Elas apenas recebem o HTTP, injetam os serviços necessários (Dependency Injection) e devolvem a resposta.

---

## 2. Atendimento aos Requisitos e Regras de Negócio

Mostre domínio sobre como você amarrou os cenários do teste dentro do código:

*   **Prazo e Limites de Empréstimo:**
    *   **Como foi feito?** No `LoanService.create_loan()`, antes de inserir no banco, puxamos o histórico de ativos (`loan_repository.get_active_by_user()`). Se o count for >= 3, disparamos um erro HTTP 400 avisando do limite. A data final (`due_date`) é injetada nativamente somando `timedelta(days=14)` ao momento do registro limitando ataques que forjassem o payload com datas adulteradas.
*   **Multa:**
    *   **Como foi feito?** No `return_loan()`, comparamos o `due_date` com o `datetime.utcnow()`. Multiplicamos a diferença de dias atrasados por `LATE_FEE_PER_DAY` (puxado do `.env` / `config.py`, evitando hardcode). Se devolvido no prazo, a multa zera magicamente e o `is_available` do livro volta a ser `True`.

---

## 3. Os Famosos "Diferenciais Extras" (Onde nós fomos além)

É aqui que você ganha a vaga. O BTG adora candidatos que pensam em "Produção". Você não entregou um código escolar, entregou um projeto "Production-Ready".

### 🏆 Funcionalidades Extras que Implementamos:

1.  **Paginação (Básico ✅):**
    *   *Sua fala:* "Todos os list (`GET`) utilizam `skip` e `limit`, limitados no DB para evitar sobrecarga na memória em consultas pesadas."

2.  **Documentação (Básico ✅):**
    *   *Sua fala:* "O Swagger no formato OpenAPI 3 gera uma vitrine interativa para o front-end consultar na rota `/docs`."

3.  **Logging Estruturado (Básico ✅):**
    *   *Sua fala:* "Criei um middleware (`@app.middleware("http")`) no `main.py` acoplado à nossa engine de logs, o que em um cenário bancário proveria observabilidade transparente registrando métricas entre a entrada e saída da request."

4.  **Cache para Consultas Frequentes (Intermediário ✅):**
    *   *Sua fala:* "A listagem de livros (`GET /books`) costuma ter leitura massiva, por isso instanciei o **Redis**. Se os dados estiverem na memória do Redis, nós devolvemos a lista em milissegundos bypassando o PostgreSQL! Qualquer operação de "Mutação" ou alteração do DB como um *Create Book* executa um `redis_client.delete()` invalidando ativamente o Cache antigo prevenindo *Stale Data*."

5.  **Rate Limiting nos Endpoints (Intermediário ✅):**
    *   *Sua fala:* "Nenhuma API de banco vive sem proteção. Subi a biblioteca **SlowAPI**, mapeando limites estratégicos via Decorators (e.x: 5 requisições por minuto na criação de usuário contra brute-force, ou 60 requests/min na leitura pra evitar scrapers de sobrecarregar nossos containers).

6.  **Testes Automatizados (Intermediário ✅):**
    *   *Sua fala:* "Implementei uma suíte conteinerizada em Pydantic que valida os fluxos ponta a ponta (E2E), criando instâncias em UUID (para evitar choque de dados) e confirmando que o Banco relacional processa em conformidade."

7.  **Isolamento, Segurança e Deploy (Avanços Ocultos 💎):**
    *   *Sua fala:*
        *   "Em ambientes críticos eu utilizo o `.env` consumido pelo Docker Compose, segregando senhas puras que não devem ir ao controle de versão (*Gitignore Hardened*)."
        *   "Nossa senha circula no DB utilizando hashing forte pelo algorítimo *Bcrypt*, prevenindo rainbow table attacks."
        *   "A API já suporta cross-origin restrito via políticas *CORS* implementadas na camada principal."

---

## 4. Simulando a Entrevista Prática

**Avaliador BTG:** "Excelente arquitetura, mas percebi que você está usando SQLite pra testes e PostgreSQL localmente. Se migrássemos para a nuvem sob alto acesso, alguma coisa no sistema engargalaria?"
**Candidato (Você):** "Sim, algumas coisas precisariam de scale. Mas a nossa estrutura foi moldada pra isso: Para evitar gargalo de leitura de livros conectamos o elo fraco no cache (Redis), desafogando o pool do Postgre. Graças à Clean Architecture as rotinas são independentes de dependência; poderíamos no futuro simplesmente mudar os models do SQLAlchemy pra assíncronos (`asyncpg`) no repositório com poucos reflexos de regressão."

**Avaliador BTG:** "E se o usuário mudar o fuso horário (timezone) do servidor enganando o cálculo de 14 dias de multa?"
**Candidato (Você):** "Toda nossa base de *Loans* é cravada na criação utilizando `datetime.utcnow()`. Operamos no espectro fixo universal (Zero Hour) e deixamos que quem consuma o app (ex: frontend) faça a exibição localizada usando Offset."

---

### Dica Final:
Abra o repositório lado a lado no dia da defesa e **rode pelo Docker Compose em tela**.
Não precisa decorar os códigos, o BTG entende de sintaxe. **Aprenda o motivo da estrutura viver isolada e mostre como suas rotas estão limpas e dependem totalmente dos Services.** Mostre que tem a mentalidade de um *Engenheiro Resiliente* e essa vaga é sua! 🚀
