import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository';
import { CreateUserUseCase } from '../createUser/CreateUserUseCase';
import { AuthenticateUserUseCase } from './AuthenticateUserUseCase'
import { IncorrectEmailOrPasswordError } from './IncorrectEmailOrPasswordError';

let authenticateUserUseCase: AuthenticateUserUseCase
let inMemoryUsersRepository: InMemoryUsersRepository
let createUserUseCase: CreateUserUseCase

describe('Authenticate User Use case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository)
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
  })

  it('should throw error if email is not registered', async () => {
    const response = authenticateUserUseCase.execute({ email: 'no-existente-email@mail.com', password: 'valid-password' })
    await expect(response).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  });

  it('should throw error if email exists, but password is wrong', async () => {
    const user = { email: 'valid-email@mail.com', name: 'valid-name', password: 'valid-password' }
    await createUserUseCase.execute(user)

    const response = authenticateUserUseCase.execute({ email: user.email, password: 'wrong-password' })
    await expect(response).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  });

  it('should authenticate user with right credentials', async () => {
    const user = { email: 'valid-email@mail.com', name: 'valid-name', password: 'valid-password' }
    await createUserUseCase.execute(user)

    const response = await authenticateUserUseCase.execute({ email: user.email, password: user.password })
    expect(typeof response.token).toBe('string')
    expect(response.user).toMatchObject({ email: user.email, name: user.name })
    expect(response.user).not.toHaveProperty('password')
  });
});
