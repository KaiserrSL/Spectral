import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['*.min.js', 'node_modules/**']
    },
    {
        files: ['boot.js', 'theme-init.js', 'script.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: globals.browser
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-control-regex': 'off',
            'no-empty': 'off',
            'no-useless-assignment': 'off',
            'no-useless-escape': 'off',
            'no-unused-vars': ['warn', {argsIgnorePattern: '^_', caughtErrors: 'none'}]
        }
    },
    {
        files: ['tools/**/*.mjs', 'tests/**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.node
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-unused-vars': ['error', {argsIgnorePattern: '^_', caughtErrors: 'none'}]
        }
    }
];
