import { CreateUserDto } from './../dto/create-user.dto';
import { User, UserDocument } from './../schemas/user.schema';
import { UsersService } from '../users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;

  // Mock save function
  const mockSave = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset mockSave for each test
    mockSave.mockReset();

    // Create a constructor function
    function MockUserModel(dto) {
      this.email = dto.email;
      this.firstName = dto.firstName;
      this.lastName = dto.lastName;
      this.password = dto.password;
      this.save = mockSave;
      return this;
    }

    // Add static methods to the constructor function
    MockUserModel.findOne = jest.fn();
    MockUserModel.findById = jest.fn();
    MockUserModel.find = jest.fn();
    MockUserModel.countDocuments = jest.fn();
    MockUserModel.findByIdAndUpdate = jest.fn();
    MockUserModel.findByIdAndDelete = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<any>(getModelToken(User.name));
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        _id: 'someId',
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        password: hashedPassword,
      };

      // Mock the findOne method to return null (no existing user)
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Mock the save method to return the saved user
      mockSave.mockResolvedValue(savedUser);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 'salt');
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(savedUser);
    });
    it('should throw a ConflictException if email already exists', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const existingUser = {
        _id: 'existingId',
        email: createUserDto.email,
      };

      // Mock the findOne to return an existing user
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUser),
      });

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
    });

    it('should throw BadRequestException when save fails', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Mock the findOne method to return null (no existing user)
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Mock the save method to throw an error
      mockSave.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSave).toHaveBeenCalled();
    });
  });

  //   describe('findAll', () => {
  //     it('should return all users with pagination', async () => {
  //       const paginationDto = { page: 1, limit: 10 };
  //       const users = [{ name: 'User 1' }, { name: 'User 2' }];
  //       const total = 2;

  //       jest.spyOn(model, 'find').mockReturnValueOnce({
  //         skip: jest.fn().mockReturnThis(),
  //         limit: jest.fn().mockReturnThis(),
  //         exec: jest.fn().mockResolvedValueOnce(users),
  //       } as any);

  //       jest.spyOn(model, 'countDocuments').mockReturnValueOnce({
  //         exec: jest.fn().mockResolvedValueOnce(total),
  //       } as any);

  //       const result = await service.findAll(paginationDto);

  //       expect(model.find).toHaveBeenCalled();
  //       expect(model.countDocuments).toHaveBeenCalled();
  //       expect(result).toEqual({
  //         users,
  //         total,
  //         page: paginationDto.page,
  //         limit: paginationDto.limit,
  //       });
  //     });
  //   });

  //   describe('findOne', () => {
  //     it('should find and return a user by id', async () => {
  //       const id = 'someId';
  //       const user = { _id: id, name: 'John Doe' };

  //       jest.spyOn(model, 'findById').mockReturnValueOnce({
  //         exec: jest.fn().mockResolvedValueOnce(user),
  //       } as any);

  //       const result = await service.findOne(id);

  //       expect(model.findById).toHaveBeenCalledWith(id);
  //       expect(result).toEqual(user);
  //     });

  //     it('should throw NotFoundException if user not found', async () => {
  //       const id = 'nonExistentId';

  //       jest.spyOn(model, 'findById').mockReturnValueOnce({
  //         exec: jest.fn().mockResolvedValueOnce(null),
  //       } as any);

  //       await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
  //     });
  //   });

  // Additional tests for update, remove, findByEmail, validateUser
});
