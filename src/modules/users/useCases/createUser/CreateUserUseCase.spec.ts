import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";

let createUserUseCase: CreateUserUseCase
let inMemoryUsersRepository: InMemoryUsersRepository

describe('Create User Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
  })

  it('should throw error if register a user with an email that already exists', async () => {
    const user = { email: 'valid-mail@mail.com', name: 'valid-name', password: 'valid-password' }
    await createUserUseCase.execute(user)
    const response = createUserUseCase.execute(user)
    await expect(response).rejects.toBeInstanceOf(CreateUserError)
  });

  it('should create a new user', async () => {
    const user = { email: 'valid-mail@mail.com', name: 'valid-name', password: 'valid-password' }
    await createUserUseCase.execute(user)
    const createdUser = await inMemoryUsersRepository.findByEmail(user.email)
    expect(createdUser).not.toBeUndefined()
    if (createdUser) {
      expect(typeof createdUser.id).toBe('string')
      expect(createdUser.email).toBe(user.email)
      expect(createdUser.name).toBe(user.name)
      expect(createdUser.password).not.toBe(user.password)
    }
  });
});
