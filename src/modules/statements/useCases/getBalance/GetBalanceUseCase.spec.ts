import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let getBalanceUseCase: GetBalanceUseCase
let inMemoryStatementsRepository: InMemoryStatementsRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let createUserUseCase: CreateUserUseCase
let createStatementUseCase: CreateStatementUseCase

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

describe('Get Balance Use Case', () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository)
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
  })

  it('should throw error if user_id does not exists', async () => {
    const response = getBalanceUseCase.execute({ user_id: 'nonexistent-user-id' })
    await expect(response).rejects.toBeInstanceOf(GetBalanceError)
  });

  it('should return user balance', async () => {
    const user = await createUser()
    if (!user.id) return expect(user.id).not.toBeFalsy()

    const userBalance = 1000
    await createStatement({ user_id: user.id, amount: userBalance, type: OperationType.DEPOSIT })

    const response = await getBalanceUseCase.execute({ user_id: user.id })
    expect(response.balance).toBe(userBalance)
  });
});
