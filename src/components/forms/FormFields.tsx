import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  type TextFieldProps,
} from '@mui/material'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

export function FormTextField<T extends FieldValues>({
  name,
  control,
  ...props
}: {
  name: FieldPath<T>
  control: Control<T>
} & Omit<TextFieldProps, 'name'>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? props.helperText}
        />
      )}
    />
  )
}

export function FormSelectField<T extends FieldValues>({
  name,
  control,
  label,
  options,
  fullWidth = true,
}: {
  name: FieldPath<T>
  control: Control<T>
  label: string
  options: { value: string; label: string }[]
  fullWidth?: boolean
}) {
  const id = `${String(name)}-select`
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth={fullWidth} error={Boolean(fieldState.error)}>
          <InputLabel id={`${id}-label`}>{label}</InputLabel>
          <Select
            {...field}
            labelId={`${id}-label`}
            id={id}
            label={label}
            value={field.value ?? ''}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error ? <FormHelperText>{fieldState.error.message}</FormHelperText> : null}
        </FormControl>
      )}
    />
  )
}
