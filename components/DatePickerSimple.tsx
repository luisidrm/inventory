"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Icon } from "./ui/Icon"

export function DatePickerSimple({ date, setDate }: { date: string, setDate: (date: string) => void }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="input-wrapper"
        >
          <Icon name="calendar_today" />
          {date ? date : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={new Date(date)}
          captionLayout="dropdown"
          onSelect={(date) => {
            setDate(date?.toISOString().split("T")[0] || "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}