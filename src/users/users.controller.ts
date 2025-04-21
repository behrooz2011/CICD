import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from './schemas/user.schema';
import { PaginationDto } from '../common/dto/pagination.dto';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';

@Controller('users')
@UseInterceptors(TransformInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    // Only admins can create users with admin role
    if (
      createUserDto.role === UserRole.ADMIN &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only admins can create admin users');
    }

    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: User,
  ) {
    // Regular users can only see their own profile
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // Regular users can only see their own profile
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser._id.toString() !== id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    // Regular users can only update their own profile
    // And they cannot change their role
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser._id.toString() !== id) {
        throw new ForbiddenException('Access denied');
      }

      if (updateUserDto.role) {
        throw new ForbiddenException('Cannot change role');
      }
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // Only admins can delete users
    // Regular users cannot delete their account
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    // Prevent deleting yourself
    if (currentUser._id.toString() === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    await this.usersService.remove(id);
    return { success: true };
  }
}
