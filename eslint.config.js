const { defineConfig, globalIgnores } = require('eslint/config')
const js = require('@eslint/js')
const globals = require('globals')
const tseslint = require('typescript-eslint')
const prettier = require('eslint-config-prettier/flat')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const reactCompiler = require('eslint-plugin-react-compiler')
const eslintReact = require('@eslint-react/eslint-plugin')
const chai = require('eslint-plugin-chai-friendly')

// CSS named colors (CSS Color Module Level 4) that shouldn't appear as
// literal string values in packages/server-admin-ui — mirrors that
// package's stylelint 'color-named'/'color-no-hex' rules, which only
// ever see .scss/.css and can't catch the same thing in inline
// style={{}} objects or SVG fill/stroke props. Use var(--bs-*) instead.
const CSS_NAMED_COLORS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige',
  'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown',
  'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral',
  'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
  'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia',
  'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green',
  'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo',
  'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
  'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
  'lightslategray', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
  'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
  'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
  'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite',
  'navy', 'oldlace', 'olive', 'olivedrab', 'orange', 'orangered',
  'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum',
  'powderblue', 'purple', 'red', 'rosybrown', 'royalblue', 'saddlebrown',
  'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver',
  'skyblue', 'slateblue', 'slategray', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet',
  'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'
]
const NAMED_COLOR_PATTERN = CSS_NAMED_COLORS.join('|')

module.exports = defineConfig([
  globalIgnores([
    '**/public',
    '**/public_src',
    '**/dist',
    '**/.__mf__temp',
    // WASM plugin examples - AssemblyScript has different semantics
    'examples/wasm-plugins/**/assembly/**',
    // AssemblyScript SDK - decorators and types not compatible with ESLint
    'packages/assemblyscript-plugin-sdk/assembly/**',
    // Auto-generated WASM bindings (created by AssemblyScript compiler)
    'examples/wasm-plugins/**/build/**',
    'examples/wasm-plugins/**/plugin.js',
    'examples/wasm-plugins/**/plugin.d.ts',
    'packages/assemblyscript-plugin-sdk/build/**'
  ]),

  // TypeScript options
  {
    files: ['**/*.ts'],
    extends: [common('@typescript-eslint/'), tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.node
    }
  },

  // JavasScript-only options
  {
    files: ['**/*.js'],
    extends: [common(), js.configs.recommended],
    languageOptions: {
      globals: globals.node
    }
  },

  // Test-only options
  {
    files: [
      '{src,packages/*/src}/**/*.test.{ts,js}',
      '{test,packages/*/test}/**/*.{js,ts}'
    ],
    plugins: { chai },
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'chai/no-unused-expressions': 'error'
    },
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.mocha
    }
  },

  // Server-admin UI React 19 specific options
  {
    settings: {
      react: {
        version: 'detect'
      }
    },
    files: ['packages/server-admin-ui/src/**/*.{js,jsx,ts,tsx}'],
    extends: [
      common('@typescript-eslint/'),
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      eslintReact.configs['recommended-typescript']
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-compiler': reactCompiler
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        project: './packages/server-admin-ui/tsconfig.json'
      },
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // React hooks rules
      ...reactHooks.configs.recommended.rules,
      // Duplicates react-hooks/set-state-in-effect, which is already an error
      // from the official plugin. Reporting both means every annotated site
      // needs two disable comments.
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
      // React compiler rules
      'react-compiler/react-compiler': 'warn',
      // React 17+ with new JSX transform doesn't require React in scope
      'react/react-in-jsx-scope': 'off',
      // Disable prop-types (using TypeScript)
      'react/prop-types': 'off',
      'react/no-string-refs': 'off',
      'react/no-direct-mutation-state': 'off',
      // Mirror this package's stylelint color-no-hex/color-named rules
      // for the file types stylelint can't see (.tsx/.ts inline styles,
      // SVG fill/stroke props) — use var(--bs-*) instead.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message:
            'Use a Bootstrap utility class (e.g. text-danger) or CSS variable (var(--bs-*)) instead of a hardcoded hex color.'
        },
        {
          selector: `Literal[value=/^(${NAMED_COLOR_PATTERN})$/]`,
          message:
            'Use a Bootstrap utility class (e.g. text-danger) or CSS variable (var(--bs-*)) instead of a named color.'
        }
      ]
    }
  },

  // Admin UI tests. Must follow the React block above so these overrides win.
  {
    files: ['packages/server-admin-ui/src/**/*.test.{ts,tsx}'],
    rules: {
      // vi.mock factories must re-export hook names verbatim to replace the
      // real module, so the use-prefix convention cannot apply here.
      '@eslint-react/hooks-extra/no-unnecessary-use-prefix': 'off'
    }
  },

  // Streams package - uses synchronous require() for lazy/dynamic imports
  {
    files: ['packages/streams/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // Disable rules that prettier handles
  prettier
])

// Common rules for all files
function common(prefix = '') {
  return {
    rules: {
      [`${prefix}no-unused-vars`]: [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      [`${prefix}no-unused-expressions`]: [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true
        }
      ],
      'no-return-assign': ['error', 'always'],
      eqeqeq: ['error', 'always']
    }
  }
}
