import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import {hash} from "bcrypt"
import * as z from "zod";
//get
export async function GET() {
    try {
      // Fetch all users from the database (excluding passwords)
      const users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          // Explicitly exclude password
        }
      });
  
      return NextResponse.json({
        success: true,
        data: users
      }, { status: 200 });
  
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: "Failed to fetch users",
        error: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 });
    }
  }
  

// post

const userShema = z
  .object({
    name: z.string().min(4, 'Username is required').max(100),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must have than 8 characters'),
  })



export async function POST(req:Request){
    try {
        const body=await req.json()
        const {name, email, password}=userShema.parse (body)


        //check is email is already exist
        const isemailExist=await db.user.findUnique({
            where:{
                email:email
                }

        })

        if(isemailExist){
            return NextResponse.json({
                user:null,
                success:false,
                message:"Email is already exist"
                },{status:409})
        }

        const hasedPassword=await hash(password,10)

        const newUser=await db.user.create({
            data:{
                name,
                email,
                password:hasedPassword
                }
        })

        const {password:newUserPassword, ...rest}=newUser

        return NextResponse.json({user:rest,message:"User successfully created"},{status:201})
    } catch (error) {
        return NextResponse.json({message:"Something went wrong"},{status:500})
    }
}