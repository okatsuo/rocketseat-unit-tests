import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { OperationType } from '../../entities/Statement'
import { CreateStatementError } from "./CreateStatementError";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";

let createStatementUseCase: CreateStatementUseCase
let inMemoryStatementsRepository: InMemoryStatementsRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let createUserUseCase: CreateUserUseCase

describe('Create Statement Use Case', () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
  })

  it('should throw error if user_id does not exists', async () => {
    const response = createStatementUseCase.execute({
      user_id: 'nonexistent-user-id',
      amount: 1,
      description: 'valid-description',
      type: OperationType.DEPOSIT
    })

    await expect(response).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  });

  it('should throw error if user_id does not have enough funds to withdraw', async () => {
    const userData = { email: 'valid-mail@mail.com', name: 'valid-name', password: 'valid-password' }
    const user = await createUserUseCase.execute(userData)
    expect(user.id).not.toBeUndefined()
    if (user.id) {
      const response = createStatementUseCase.execute({
        user_id: user.id,
        amount: 1,
        description: 'valid-description',
        type: OperationType.WITHDRAW
      })

      await expect(response).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
    }
  });

  it('should do a user deposit', async () => {
    const userData = { email: 'valid-mail@mail.com', name: 'valid-name', password: 'valid-password' }
    const user = await createUserUseCase.execute(userData)
    if (!user.id) return expect(user.id).not.toBeFalsy()
    const depositData = {
      user_id: user.id,
      amount: 100,
      description: 'valid-description',
      type: OperationType.DEPOSIT
    }
    const statement = await createStatementUseCase.execute(depositData)

    if (!statement.id) return expect(statement.id).not.toBeFalsy()

    const deposit = await inMemoryStatementsRepository.findStatementOperation({ statement_id: statement.id, user_id: user.id })
    if (!deposit) return expect(deposit).not.toBeFalsy()
    expect(typeof deposit?.id).toBe('string')
    expect(deposit.amount).toBe(depositData.amount)
    expect(deposit.description).toBe(depositData.description)
    expect(deposit.user_id).toBe(depositData.user_id)
    expect(deposit.type).toBe(depositData.type)

    const { balance } = await inMemoryStatementsRepository.getUserBalance({ user_id: user.id })
    expect(balance).toBe(depositData.amount)
  });

  it('should do a user withdrawal', async () => {
    const userData = { email: 'valid-mail@mail.com', name: 'valid-name', password: 'valid-password' }
    const user = await createUserUseCase.execute(userData)
    if (!user.id) return expect(user.id).not.toBeFalsy()
    const withdrawalData = {
      user_id: user.id,
      amount: 100,
      description: 'valid-description',
      type: OperationType.WITHDRAW
    }

    const balanceInAccount = 200
    await createStatementUseCase.execute({ ...withdrawalData, amount: balanceInAccount, type: OperationType.DEPOSIT })
    const statement = await createStatementUseCase.execute(withdrawalData)

    if (!statement.id) return expect(statement.id).not.toBeFalsy()

    const deposit = await inMemoryStatementsRepository.findStatementOperation({ statement_id: statement.id, user_id: user.id })
    if (!deposit) return expect(deposit).not.toBeFalsy()
    expect(typeof deposit?.id).toBe('string')
    expect(deposit.amount).toBe(withdrawalData.amount)
    expect(deposit.description).toBe(withdrawalData.description)
    expect(deposit.user_id).toBe(withdrawalData.user_id)
    expect(deposit.type).toBe(withdrawalData.type)

    const { balance } = await inMemoryStatementsRepository.getUserBalance({ user_id: user.id })
    expect(balance).toBe(balanceInAccount - withdrawalData.amount)
  });
});
