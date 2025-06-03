import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

type SelectPeriodProps = {
    size?: string;
    isActive?: boolean;
};

const SelectPeriod = ({ size = "md", isActive = true }: SelectPeriodProps) => {
    return (
        <Select>
            <SelectTrigger
                className={`border-0 shadow-none text-xs font-bold text-black! justify-end gap-1 items-center focus:ring-0 focus:border-0 focus-visible:border-none! focus-visible:ring-0! ${size === 'sm' ? 'p-0 text-[10px] gap-1' : ''
                    }`}
            >
                <SelectValue className='' placeholder="Last 7 Days" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="7" className='text-xs'>Last 7 Days</SelectItem>
                <SelectItem value="30" className='text-xs'>Last 30 Days</SelectItem>
                <SelectItem value="90" className='text-xs'>Last 90 Days</SelectItem>
            </SelectContent>
        </Select>
    )
}

export default SelectPeriod