import * as React from 'react'
import { cn } from '@/lib/utils/helpers'

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="label-custom mb-2 block">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        'input-custom',
                        error && 'border-destructive focus-visible:ring-destructive',
                        className
                    )}
                    ref={ref}
                    id={inputId}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-destructive">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export { Input }
