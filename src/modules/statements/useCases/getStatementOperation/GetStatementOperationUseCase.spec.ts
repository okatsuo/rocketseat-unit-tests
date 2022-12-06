import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryStatementsRepository: InMemoryStatementsRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let createUserUseCase: CreateUserUseCase
let createStatementUseCase: CreateStatementUseCase
let getStatementOperationUseCase: GetStatementOperationUseCase

const createUser = async () => {
  return createUserUseCase.execute({ email: 'valid-mail@mail.com', name: 'valid-name', password: 'valid-password' })
}

type ICreateStatement = {
  user_id: string;
  amount: number;
  description?: string;
  type: OperationType
}
const createStatement = async ({
  user_id,
  amount,
  description = 'valid-description',
  type
}: ICreateStatement) => {
  return createStatementUseCase.execute({ user_id, amount, description, type })
}

describe('Get Statement Operation Use Case', () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
    getStatementOperationUseCase = new GetStatementOperationUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
  })

  it('should throw error if user_id does not exists', async () => {
    const response = getStatementOperationUseCase.execute({ user_id: 'nonexistent-user-id', statement_id: 'valid-statement-id' })
    await expect(response).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
  });

  it('should throw error if statement_id does not exists', async () => {
    const user = await createUser()
    if (!user.id) return expect(user.id).not.toBeUndefined()
    const response = getStatementOperationUseCase.execute({ user_id: user.id, statement_id: 'valid-statement-id' })
    await expect(response).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
  });

  it('should return statement operation', async () => {
    const user = await createUser()
    if (!user.id) return expect(user.id).not.toBeUndefined()

    const depositData = { user_id: user.id, amount: 1000, type: OperationType.DEPOSIT, description: 'valid-description' }
    const statement = await createStatement(depositData)
    if (!statement.id) return expect(statement.id).not.toBeUndefined()

    const response = await getStatementOperationUseCase.execute({ user_id: user.id, statement_id: statement.id })
    expect(typeof response.id).toBe('string')
    expect(response).toMatchObject(depositData)
  });

  // it('should return user balance', async () => {
  //   const user = await createUser()
  //   if (!user.id) return expect(user.id).not.toBeFalsy()

  //   const userBalance = 1000
  //   await createStatement({ user_id: user.id, amount: userBalance, type: OperationType.DEPOSIT })

  //   const response = await getStatementOperationUseCase.execute({ user_id: user.id })
  //   expect(response.balance).toBe(userBalance)
  // });
});
