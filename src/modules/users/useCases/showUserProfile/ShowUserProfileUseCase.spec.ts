import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let showUserProfileUseCase: ShowUserProfileUseCase
let inMemoryUsersRepository: InMemoryUsersRepository
let createUserUseCase: CreateUserUseCase

describe('Show User Profile Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository)
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
  })

  it('should throw error if user id is not registered', async () => {
    const response = showUserProfileUseCase.execute('nonexistent-id')
    await expect(response).rejects.toBeInstanceOf(ShowUserProfileError)
  });

  it('should return user profile', async () => {
    const user = { name: 'valid-name', email: 'valid-email@mail.com', password: 'valid-password' }
    const createdUser = await createUserUseCase.execute({ name: 'valid-name', email: 'valid-email@mail.com', password: 'valid-password' })
    expect(createdUser.id).not.toBeUndefined()
    if (createdUser.id) {
      const response = await showUserProfileUseCase.execute(createdUser.id)
      expect(typeof response.id).toBe('string')
      expect(response.email).toBe(user.email)
      expect(response.name).toBe(user.name)
    }
  });
});
