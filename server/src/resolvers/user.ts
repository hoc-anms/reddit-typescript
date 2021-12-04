import { User } from "../entities/User";
import { Arg, Mutation, Resolver } from "type-graphql";
import argon2 from "argon2";
import { UserMutationResponse } from "../types/UserMutationResponse";
import { RegisterInput } from "../types/RegisterInput";
import { validateRegisterInput } from "../utils/validatateRegisterInput";
import { LoginInput } from "../types/LoginInput";

@Resolver()
export class UserResolver {
    @Mutation(_return => UserMutationResponse, { nullable: true })
    async register(
        @Arg('registerInput') registerInput: RegisterInput,
    ): Promise<UserMutationResponse> {
        const validateRegisterInputErrors = validateRegisterInput(registerInput)
        if (validateRegisterInputErrors !== null) {
            return {
                code: 400,
                success: false,
                ...validateRegisterInputErrors
            }
        }

        try {
            const { username, email, password } = registerInput;
            const existingUser = await User.findOne({ where: [{ email }, { username }] });
            if(existingUser) {
                return {
                    code: 400,
                    success: false,
                    message: 'User already exists',
                    errors: [
                        {field: existingUser.email ? 'email' : 'username', message: 'User already exists'}
                    ]
                }
            }
    
            const hashedPassword = await argon2.hash(password);
    
            const newUser = await User.create({
                username,
                password: hashedPassword,
                email,
            });

            return {
                code: 200,
                success: true,
                message: 'User created successfully',
                user: await User.save(newUser),
            }
        } catch (error) {
            console.error(error);
            return {
                code: 500,
                success: false,
                message: `Internal server error: ${error.message}`,
            };
        }
    }

    @Mutation(_return => UserMutationResponse)
    async login(
        @Arg('loginInput') {usernameOrEmail, password}: LoginInput
    ): Promise<UserMutationResponse> {
        try {
            const existingUser = await User.findOne(
                usernameOrEmail.includes('@') 
                ? {email: usernameOrEmail} 
                : {username: usernameOrEmail}
            );

            if(!existingUser) {
                return {
                    code: 400,
                    success: false,
                    message: 'User does not exist',
                    errors: [
                        {field: 'usernameOrEmail', message: 'User does not exist'}
                    ]
                }
            }

            const passwordValid = await argon2.verify(existingUser.password, password);

            if(!passwordValid) {
                return {
                    code: 400,
                    success: false,
                    message: 'Wrong password',
                    errors: [
                        {field: 'password', message: 'Wrong password'}
                    ]
                }
            }

            return {
                code: 200,
                success: true,
                message: 'User logged in successfully',
                user: existingUser,
            }

        } catch (error) {
            console.error(error);
            return {
                code: 500,
                success: false,
                message: `Internal server error: ${error.message}`,
            };
        }
    }
}