'use client'
import React from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

const formSchema = z.object({
    name: z.string().min(2).max(50),
    price: z.number().min(1000),
    vipPrice: z.number().min(1000),
    image: z.string().optional().nullable(),
    sold: z.number().min(0),
    rating: z.number().min(0).max(5),
    category: z.string().min(1).max(50),
})

const CreateMeal = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "hehe",
            price: 10000,
            vipPrice: 10000,
            image: "https://example.com/image.jpg",
            sold: 1,
            rating: 1,
            category: "111",
        },
    })

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
    }
    return (
        <div>CreateMeal</div>
    )
}

export default CreateMeal