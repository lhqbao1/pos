"use client"

import React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import CreateMealDrawer from "@/app/(dashboard)/menu/components/crud-meal/create-meal-drawer"
import CreateTableDrawer from "./create-table-drawer"

const CashierToolbar = () => {
  return (
    <div className="w-full rounded-2xl border border-[#e9d6c0] bg-gradient-to-r from-[#fffefb] via-[#fff8ef] to-[#fffdf8] p-3 shadow-[0_8px_22px_rgba(168,118,66,0.08)]">
      <div className="flex flex-wrap items-center gap-2">
        <CreateTableDrawer />
        <CreateMealDrawer
          trigger={
            <Button className="h-11 rounded-2xl bg-primary px-5 text-primary-foreground shadow-[0_10px_18px_rgba(194,123,55,0.28)] transition hover:opacity-95">
              <Plus className="mr-2 h-4 w-4" />
              Thêm món ăn
            </Button>
          }
        />
      </div>
    </div>
  )
}

export default CashierToolbar
