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
    
    const apolloServer = new ApolloServer({
        schema: await buildSchema({resolvers: [HelloResolver, UserResolver], validate: false}),
        plugins: [ApolloServerPluginLandingPageGraphQLPlayground()]
    })

    await apolloServer.start()

    apolloServer.applyMiddleware({app, cors: false})

    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => console.log(`Server started on port ${PORT}. Grapqhql server started on localhost:${PORT}${apolloServer.graphqlPath}`))
}

main().catch(err => console.error(err))