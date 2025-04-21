import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto;

      // Check if email already exists
      const existingUser = await this.userModel
        .findOne({ email: userData.email })
        .exec();
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const newUser = new this.userModel({
        ...userData,
        password: hashedPassword,
      });

      return await newUser.save();
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    // const { page, limit } = paginationDto;
    const page = paginationDto.page ?? 1; // Default to 1 if undefined
    const limit = paginationDto.limit ?? 10; // Default to 10 if undefined
    const skip = (page - 1) * limit;

    try {
      const [users, total] = await Promise.all([
        this.userModel.find().skip(skip).limit(limit).exec(),
        this.userModel.countDocuments().exec(),
      ]);

      return {
        users,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to find users: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to find users');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to find user');
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException(`User with email "${email}" not found`);
      }
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to find user by email: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to find user by email');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const updates: any = { ...updateUserDto };

      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await this.hashPassword(updates.password);
      }

      // Check if email already exists (if email is being updated)
      if (updates.email) {
        const existingUser = await this.userModel
          .findOne({
            email: updates.email,
            _id: { $ne: id },
          })
          .exec();

        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updates, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.userModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove user: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove user');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Failed to validate user: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to validate user');
    }
  }
}
