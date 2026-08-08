import type { StylesConfig } from 'react-select'

// react-select renders its own DOM (not a native <select>), so none of
// Bootstrap's .form-select CSS reaches it — colors have to be supplied
// explicitly. This mirrors Bootstrap 5's own component defaults
// (--bs-body-bg/--bs-border-color for .form-control, --bs-border-color-
// translucent for .dropdown-menu) via CSS variables only, so every
// instance already tracks the light/dark theme for free.
export function bsSelectStyles<
  Option,
  IsMulti extends boolean = false
>(): StylesConfig<Option, IsMulti> {
  return {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--bs-body-bg)',
      borderColor: state.isFocused
        ? 'var(--bs-primary)'
        : 'var(--bs-border-color)',
      boxShadow: state.isFocused
        ? '0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.25)'
        : 'none',
      '&:hover': {
        borderColor: 'var(--bs-primary)'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--bs-body-color)'
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'var(--bs-tertiary-bg)'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'var(--bs-body-color)'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: 'var(--bs-secondary-color)',
      ':hover': {
        backgroundColor: 'var(--bs-danger-bg-subtle)',
        color: 'var(--bs-danger)'
      }
    }),
    input: (base) => ({
      ...base,
      color: 'var(--bs-body-color)'
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--bs-secondary-color)'
    }),
    menu: (base) => ({
      ...base,
      zIndex: 100,
      backgroundColor: 'var(--bs-body-bg)',
      border: '1px solid var(--bs-border-color-translucent)'
    }),
    menuList: (base) => ({
      ...base,
      backgroundColor: 'var(--bs-body-bg)'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--bs-primary)'
        : state.isFocused
          ? 'var(--bs-tertiary-bg)'
          : 'transparent',
      color: state.isSelected ? 'var(--bs-white)' : 'var(--bs-body-color)',
      ':hover': {
        backgroundColor: state.isSelected
          ? 'var(--bs-primary)'
          : 'var(--bs-tertiary-bg)'
      }
    })
  }
}
