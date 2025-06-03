import React from 'react'
import MealCart from './meal-cart'

interface MealsList {
    id: number,
    name: string,
    image: {
        url: string
    },
    category: string,
    ratings: number,
    sold: number,
    price: number
}

const MealsData: MealsList[] = [
    {
        id: 1,
        name: "Mực chiên bột",
        image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6s8cNMGwxULv7mqQr1ie0wax1SzHKEXYfQg&s" },
        category: "Hải sản",
        ratings: 3.4,
        sold: 76,
        price: 100000
    },
    {
        id: 1,
        name: "Mực chiên bột",
        image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6s8cNMGwxULv7mqQr1ie0wax1SzHKEXYfQg&s" },
        category: "Hải sản",
        ratings: 3.4,
        sold: 76,
        price: 100000
    },
    {
        id: 1,
        name: "Mực chiên bột",
        image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6s8cNMGwxULv7mqQr1ie0wax1SzHKEXYfQg&s" },
        category: "Hải sản",
        ratings: 3.4,
        sold: 76,
        price: 100000
    },
    {
        id: 1,
        name: "Mực chiên bột",
        image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6s8cNMGwxULv7mqQr1ie0wax1SzHKEXYfQg&s" },
        category: "Hải sản",
        ratings: 3.4,
        sold: 76,
        price: 100000
    },
    {
        id: 1,
        name: "Mực chiên bột",
        image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6s8cNMGwxULv7mqQr1ie0wax1SzHKEXYfQg&s" },
        category: "Hải sản",
        ratings: 3.4,
        sold: 76,
        price: 100000
    },
]

const Recommend = () => {
    return (
        <div className='flex flex-col px-4 gap-4'>
            <h2 className='font-semibold text-lg'>Trending Menus</h2>
            {MealsData.slice(0, 4).map((item, index) => {
                return (
                    <MealCart data={item} key={index} />
                )
            })}
        </div>
    )
}

export default Recommend