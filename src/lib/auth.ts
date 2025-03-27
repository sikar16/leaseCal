import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {PrismaAdapter} from '@next-auth/prisma-adapter'
import { db } from "./db";
import { compare } from "bcrypt";
export const  authOptions:NextAuthOptions={
 adapter:PrismaAdapter(db),
 session:{
    strategy: 'jwt',
 },
    pages:{
   signIn:'/sign-in'
   },
    providers: [
        CredentialsProvider({
          // The name to display on the sign in form (e.g. "Sign in with...")
          name: "Credentials",
            credentials: {
            email: { label: "Email", type: "text", placeholder: "jsmith" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
           if(!credentials?.email || !credentials?.password){
          return null;  
           }


           const userExist=await db.user.findUnique({
            where:{
                email:credentials.email
                },

           })
           if(!userExist){
            return null
           }

        const passwordMatch=await compare(credentials.password,userExist.password)
        if(!passwordMatch){
        return null
        }

        return{
            id:`${userExist.id}`,
            name:userExist.name,
            email:userExist.email

        }

          }
        })
      ]
}