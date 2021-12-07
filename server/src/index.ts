require('dotenv').config()
import 'reflect-metadata'
import express from 'express'
import { createConnection } from 'typeorm'
import { User } from './entities/User'
import { Post } from './entities/Post'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { HelloResolver } from './resolvers/hello'
import {ApolloServerPluginLandingPageGraphQLPlayground} from 'apollo-server-core'
import { UserResolver } from './resolvers/user'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { COOKIE_NAME, __prod__ } from './contants'
import { Context } from './types/Context'

const main = async () => {
    await createConnection({
        type: 'postgres',
        database: 'reddit',
        username: process.env.DB_USERNAME_DEV,
        password: process.env.DB_PASSWORD_DEV,
        logging: true,
        synchronize: true,
        entities: [User, Post]
    })

    const app = express()

    // Session/Cookie Store
    const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_DEV_PROD}:${process.env.SESSION_DB_PASSWORD_DEV_PROD}@reddit-typescript.fyz92.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
    
    await mongoose.connect(mongoUrl)
    console.log('Connected to MongoDB');

    app.use(session({
        name: COOKIE_NAME,
        store: MongoStore.create({mongoUrl}),
        cookie: {
            maxAge: 1000 * 60 * 60, // one hour
            httpOnly: true, // JS frontend cannot access cookies
            secure: __prod__, // only send cookies over https
            sameSite: 'none', // csrf
        },
        secret: process.env.SESSION_SECRET_DEV_PROD as string,
        saveUninitialized: false, // don't save empty sessions, right from the start
        resave: false, // don't save session if unmodified
    }))
    
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, UserResolver], 
            validate: false
        }),
        context: ({req, res}): Context => ({req, res}),
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    })

    await apolloServer.start()

    apolloServer.applyMiddleware({app, cors: false})

    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => console.log(`Server started on port ${PORT}. Grapqhql server started on localhost:${PORT}${apolloServer.graphqlPath}`))
}

main().catch(err => console.error(err))